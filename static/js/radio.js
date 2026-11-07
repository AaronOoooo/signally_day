(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const audio = $('radioAudio');
  const savedKey = 'signally_day_favorites_v1';
  const volumeKey = 'signally_day_volume_v1';
  const defaultFavorites = [null, null, null, null, null];
  let favorites = defaultFavorites.slice();
  let selected = -1;
  let requestToken = 0;
  let metadataTimer = null;
  let abortController = null;
  let lastStream = '';
  try {
    const stored = JSON.parse(localStorage.getItem(savedKey));
    if (Array.isArray(stored) && stored.length === 5) {
      favorites = stored.map(item => item && typeof item.uuid === 'string' && typeof item.name === 'string' ? {uuid:item.uuid,name:item.name} : null);
    }
  } catch (_) { /* ignore invalid local preferences */ }
  const storedVolume = localStorage.getItem(volumeKey) === null ? .7 : Number(localStorage.getItem(volumeKey));
  audio.volume = Number.isFinite(storedVolume) && storedVolume >= 0 && storedVolume <= 1 ? storedVolume : .7;
  $('volume').value = Math.round(audio.volume * 100);

  function status(text) { $('playerStatus').textContent = text; }
  function setArt(url) {
    const image = $('stationArt');
    image.hidden = !url;
    $('disc').hidden = !!url;
    if (url) image.src = url;
    else image.removeAttribute('src');
  }
  $('stationArt').addEventListener('error', () => setArt(''));
  function syncButton() {
    $('playPause').textContent = !audio.paused ? '❚❚' : '▶';
    $('playPause').setAttribute('aria-label', !audio.paused ? 'Pause' : 'Play');
    $('playPause').disabled = !audio.src;
    $('mute').textContent = audio.muted ? '🔇' : '🔊';
  }
  function renderFavorites() {
    const region = $('favoriteButtons');
    region.replaceChildren();
    favorites.forEach((item, i) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = item ? item.name : `Favorite ${i+1}`;
      button.title = item ? item.name : `Set up favorite ${i+1}`;
      if (i === selected) button.classList.add('active');
      button.addEventListener('click', () => item ? selectStation(i) : openPicker(i));
      region.appendChild(button);
    });
  }
  function stopMetadata() {
    requestToken += 1;
    clearInterval(metadataTimer);
    metadataTimer = null;
    abortController?.abort();
    abortController = null;
  }
  function updateMetadata(data, firstLoad) {
    $('stationName').textContent = data.name || favorites[selected]?.name || 'Radio station';
    $('nowPlaying').textContent = [data.artist, data.song].filter(Boolean).join(' — ') || 'Live radio · Track information unavailable';
    setArt(data.graphic);
    if (firstLoad && data.streamUrl) {
      lastStream = data.streamUrl;
      audio.src = data.streamUrl;
      audio.load();
      syncButton();
      // Called after a station tap. Some iPadOS versions may require pressing Play again.
      audio.play().catch(() => status('Tap Play to listen'));
    }
  }
  async function fetchMetadata(token, firstLoad) {
    const item = favorites[selected];
    if (!item || token !== requestToken) return;
    const controller = new AbortController();
    abortController = controller;
    try {
      const response = await fetch(`/api/stations/${encodeURIComponent(item.uuid)}/metadata`, {signal:controller.signal,cache:'no-store'});
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
      if (token !== requestToken) return;
      updateMetadata(data, firstLoad);
      if (!firstLoad && data.streamUrl !== lastStream) {
        // Do not unexpectedly restart an active stream because an upstream URL changed.
        lastStream = data.streamUrl;
      }
      if (audio.paused && firstLoad) status('Tap Play if audio does not start');
    } catch (error) {
      if (error.name !== 'AbortError' && token === requestToken) {
        status(firstLoad ? 'Station temporarily unavailable' : 'Metadata unavailable');
        if (firstLoad) $('nowPlaying').textContent = error.message;
      }
    } finally {
      if (abortController === controller) abortController = null;
    }
  }
  function selectStation(i) {
    const item = favorites[i];
    if (!item) { openPicker(i); return; }
    stopMetadata();
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
    lastStream = '';
    selected = i;
    $('stationName').textContent = item.name;
    $('nowPlaying').textContent = 'Loading station…';
    setArt('');
    renderFavorites();
    status('Connecting…');
    syncButton();
    const token = requestToken;
    fetchMetadata(token, true);
    metadataTimer = setInterval(() => fetchMetadata(token, false), 60000);
  }
  function stepStation(direction) {
    if (!favorites.some(Boolean)) { openPicker(0); return; }
    for (let step = 1; step <= 5; step += 1) {
      const i = ((selected < 0 ? (direction > 0 ? -1 : 0) : selected) + direction * step + 50) % 5;
      if (favorites[i]) { selectStation(i); return; }
    }
  }
  $('previousStation').addEventListener('click', () => stepStation(-1));
  $('nextStation').addEventListener('click', () => stepStation(1));
  $('playPause').addEventListener('click', async () => {
    if (!audio.src) return;
    if (!audio.paused) audio.pause();
    else { try { await audio.play(); } catch (_) { status('Could not play this stream'); } }
  });
  $('volume').addEventListener('input', event => {
    audio.volume = Number(event.target.value) / 100;
    audio.muted = false;
    localStorage.setItem(volumeKey, String(audio.volume));
    syncButton();
  });
  $('mute').addEventListener('click', () => { audio.muted = !audio.muted; syncButton(); });
  audio.addEventListener('playing', () => { status('On air'); syncButton(); });
  audio.addEventListener('pause', () => { if (audio.src) status('Paused'); syncButton(); });
  audio.addEventListener('waiting', () => { if (audio.src) status('Buffering…'); });
  audio.addEventListener('error', () => { status('Stream unavailable'); syncButton(); });

  const picker = $('stationDialog');
  function openPicker(i) {
    $('favoriteSlot').value = String(i);
    $('stationResults').replaceChildren();
    $('searchMessage').textContent = 'Search for a station by name.';
    if (typeof picker.showModal === 'function') picker.showModal();
    else picker.setAttribute('open', '');
  }
  function closePicker() { if (typeof picker.close === 'function') picker.close(); else picker.removeAttribute('open'); }
  $('editFavorites').addEventListener('click', () => openPicker(selected < 0 ? 0 : selected));
  function persist() { localStorage.setItem(savedKey, JSON.stringify(favorites)); renderFavorites(); }
  $('clearFavorite').addEventListener('click', () => {
    const i = Number($('favoriteSlot').value);
    favorites[i] = null;
    if (selected === i) {
      stopMetadata(); audio.pause(); audio.removeAttribute('src'); audio.load(); selected = -1;
      setArt(''); $('stationName').textContent = 'Ready to listen'; $('nowPlaying').textContent = 'Choose a favorite station.';
      status('Choose a station below'); syncButton();
    }
    persist(); closePicker();
  });
  async function search() {
    const q = $('stationQuery').value.trim();
    if (q.length < 2) { $('searchMessage').textContent = 'Enter at least two characters.'; return; }
    $('searchMessage').textContent = 'Searching stations…';
    $('stationResults').replaceChildren();
    $('searchStations').disabled = true;
    try {
      const response = await fetch(`/api/stations/search?q=${encodeURIComponent(q)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Search failed');
      $('searchMessage').textContent = `${data.stations.length} stations found. Tap one to save it.`;
      for (const station of data.stations) {
        const button = document.createElement('button');
        button.type = 'button'; button.className = 'station-result';
        const title = document.createElement('strong'); title.textContent = station.name;
        const detail = document.createElement('small'); detail.textContent = [station.country, station.tags].filter(Boolean).join(' · ');
        button.append(title,detail);
        button.addEventListener('click', () => {
          const slot = Number($('favoriteSlot').value);
          favorites[slot] = {uuid:station.uuid,name:station.name};
          persist(); closePicker(); selectStation(slot);
        });
        $('stationResults').appendChild(button);
      }
    } catch (error) { $('searchMessage').textContent = error.message; }
    finally { $('searchStations').disabled = false; }
  }
  $('searchStations').addEventListener('click', search);
  $('stationQuery').addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); search(); } });
  renderFavorites(); syncButton();
})();
