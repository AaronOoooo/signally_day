(() => {
  'use strict';
  const byId = id => document.getElementById(id);
  function symbolFor(id) {
    if (id >= 200 && id < 300) return '⛈';
    if (id >= 300 && id < 600) return '🌧';
    if (id >= 600 && id < 700) return '❄';
    if (id >= 700 && id < 800) return '🌫';
    if (id === 800) return '☀';
    if (id > 800) return '☁';
    return '🌤';
  }
  const chicago = {lat:41.8781,lon:-87.6298,name:'Chicago',state:'Illinois',country:'US'};
  const prefKey = 'signallyDay.weatherCity.v1';
  function readCity() {
    try {
      const c = JSON.parse(localStorage.getItem(prefKey));
      if (c && Number.isFinite(c.lat) && Number.isFinite(c.lon) &&
          Math.abs(c.lat) <= 90 && Math.abs(c.lon) <= 180 && typeof c.name === 'string') return c;
    } catch (_) { /* Prefer Chicago if storage isn't available */ }
    return chicago;
  }
  let city = readCity();
  let requestVersion = 0;
  function cityLabel(c) {
    const state = c.country === 'US' && c.state ? c.state : c.country;
    return [c.name, state].filter(Boolean).join(', ');
  }
  byId('weatherPlace').textContent = cityLabel(city);
  async function loadWeather() {
    const status = byId('weatherStatus');
    const version = ++requestVersion;
    const selected = city;
    status.textContent = 'Updating weather…';
    try {
      const params = new URLSearchParams({lat: String(selected.lat), lon: String(selected.lon)});
      const response = await fetch('/api/weather?' + params, {cache: 'no-store'});
      const data = await response.json();
      if (version !== requestVersion) return;
      if (!response.ok) throw new Error(data.error || 'Weather unavailable');
      byId('weatherTemp').textContent = `${data.temperature}°`;
      byId('weatherSymbol').textContent = symbolFor(data.condition_id);
      byId('weatherDescription').textContent = data.description;
      byId('weatherDetails').textContent = `Feels like ${data.feels_like}° · Humidity ${data.humidity}%`;
      status.textContent = data.stale ? 'Last available weather' : 'Live weather · Updates every 10 min';
    } catch (error) {
      if (version !== requestVersion) return;
      status.textContent = 'Weather unavailable';
      byId('weatherDescription').textContent = error.message || 'Try again shortly';
    }
  }
  function chooseCity(c) {
    city = c;
    try {localStorage.setItem(prefKey, JSON.stringify(c));} catch (_) { /* still works for this session */ }
    byId('weatherPlace').textContent = cityLabel(c);
    byId('weatherDialog').close();
    loadWeather();
  }
  const dialog = byId('weatherDialog');
  byId('editWeather').addEventListener('click', () => {dialog.showModal(); byId('weatherCityQuery').focus();});
  byId('weatherReset').addEventListener('click', () => chooseCity(chicago));
  byId('weatherSearchForm').addEventListener('submit', async event => {
    event.preventDefault();
    const query = byId('weatherCityQuery').value.trim();
    if (query.length < 2) return;
    const results = byId('weatherCityResults');
    const message = byId('weatherSearchMessage');
    results.replaceChildren();
    message.textContent = 'Searching cities…';
    try {
      const resp = await fetch('/api/weather/cities?q=' + encodeURIComponent(query), {cache:'no-store'});
      const payload = await resp.json();
      if (!resp.ok) throw new Error(payload.error || 'City lookup failed');
      message.textContent = payload.cities.length ? 'Choose a result:' : 'No matching cities. Try adding a state or country.';
      for (const found of payload.cities) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'station-result';
        button.textContent = cityLabel(found);
        button.addEventListener('click', () => chooseCity(found));
        results.appendChild(button);
      }
    } catch (error) { message.textContent = error.message || 'City search unavailable'; }
  });
  loadWeather();
  setInterval(loadWeather, 10 * 60 * 1000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) loadWeather(); });
})();
