(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const audio = $('radioAudio');
  const savedKey = 'signally_day_favorites_v1';
  const wbez = {name:'WBEZ 91.5 Chicago', streamUrl:'https://stream.wbez.org/wbez128.mp3'};
  const volumeKey = 'signally_day_volume_v1';
  const favoriteCount = 10;
  const defaultFavorites = Array(favoriteCount).fill(null);
  let favorites = defaultFavorites.slice();
  let browserFavorites = defaultFavorites.slice();
  let playingStation = null;
  let savingFavorites = false;
  let refreshVersion = 0;
  let selected = -1;
  let requestToken = 0;
  let metadataTimer = null;
  let abortController = null;
  let lastStream = '';
  try {
    const stored = JSON.parse(localStorage.getItem(savedKey));
    if (Array.isArray(stored) && (stored.length === 5 || stored.length === favoriteCount)) {
      browserFavorites = defaultFavorites.map((_, i) => {
        const item = stored[i];
        return item && typeof item.uuid === 'string' && typeof item.name === 'string'
          ? {uuid:item.uuid,name:item.name} : null;
      });
    }
  } catch (_) { /* ignore invalid local preferences */ }
  let storedVolume = .7;
  try { storedVolume = Number(localStorage.getItem(volumeKey) ?? .7); } catch (_) {}
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
      if (i === selected && item?.uuid === playingStation?.uuid && item) button.classList.add('active');
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
  function playStream(url) {
    lastStream = url;
    audio.src = url;
    audio.load();
    syncButton();
    const token = requestToken;
    audio.play().catch(error => {
      if (token === requestToken && error.name !== 'AbortError') {
        status(error.name === 'NotAllowedError' ? 'Tap Play to listen' : 'Stream unavailable');
      }
    });
  }
  function updateMetadata(data, firstLoad) {
    $('stationName').textContent = data.name || playingStation?.name || 'Radio station';
    $('nowPlaying').textContent = [data.artist, data.song].filter(Boolean).join(' — ') || 'Live radio · Track information unavailable';
    setArt(data.graphic);
    if (firstLoad && data.streamUrl) playStream(data.streamUrl);
  }
  async function fetchMetadata(token, firstLoad) {
    const item = playingStation;
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
    playingStation = item;
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
  $('listenWbez').addEventListener('click', () => {
    stopMetadata();
    selected = -1;
    playingStation = wbez;
    $('stationName').textContent = wbez.name;
    $('nowPlaying').textContent = 'Live radio';
    setArt('');
    renderFavorites();
    status('Connecting…');
    // Start playback within the tap so Safari can honor the user gesture.
    playStream(wbez.streamUrl);
  });
  function stepStation(direction) {
    if (!favorites.some(Boolean)) { openPicker(0); return; }
    for (let step = 1; step <= favorites.length; step += 1) {
      const i = ((selected < 0 ? (direction > 0 ? -1 : 0) : selected) + direction * step + favorites.length * 2) % favorites.length;
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
    try { localStorage.setItem(volumeKey, String(audio.volume)); } catch (_) {}
    syncButton();
  });
  $('mute').addEventListener('click', () => { audio.muted = !audio.muted; syncButton(); });
  audio.addEventListener('playing', () => { status('On air'); syncButton(); });
  audio.addEventListener('pause', () => { if (audio.src) status('Paused'); syncButton(); });
  audio.addEventListener('waiting', () => { if (audio.src) status('Buffering…'); });
  audio.addEventListener('error', () => { status('Stream unavailable'); syncButton(); });

  // Populate all ten editor slots, including on devices with five saved favorites.
  $('favoriteSlot').replaceChildren(...Array.from({length: favoriteCount}, (_, i) => {
    const option = document.createElement('option');
    option.value = String(i);
    option.textContent = `Favorite ${i + 1}`;
    return option;
  }));
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
  const importButton = $('importFavorites');
  const canImport = browserFavorites.some(Boolean);

  async function favoritesRequest(method, payload) {
    const options = {method, cache:'no-store'};
    if (payload !== undefined) {
      options.headers = {'Content-Type':'application/json'};
      options.body = JSON.stringify(payload);
    }
    const response = await fetch('/api/favorites', options);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Shared favorites are unavailable.');
    return data;
  }

  function showSharedFavorites(data) {
    importButton.hidden = data.initialized || !canImport;
    if (JSON.stringify(favorites) !== JSON.stringify(data.favorites)) {
      favorites = data.favorites;
      renderFavorites();
    }
  }

  async function refreshFavorites() {
    if (savingFavorites) return;
    const version = ++refreshVersion;
    try {
      const data = await favoritesRequest('GET');
      if (version === refreshVersion) showSharedFavorites(data);
    } catch (_) {
      if (version === refreshVersion && !picker.open && !playingStation) {
        status('Shared favorites are unavailable. Retrying…');
      }
    }
  }

  async function saveFavorites(method, payload, onSaved) {
    if (savingFavorites) return;
    savingFavorites = true;
    refreshVersion += 1;
    $('searchMessage').textContent = 'Saving shared favorites…';
    try {
      showSharedFavorites(await favoritesRequest(method, payload));
      onSaved();
    } catch (error) {
      $('searchMessage').textContent = error.message;
    } finally {
      savingFavorites = false;
      refreshFavorites();
    }
  }

  importButton.addEventListener('click', () => {
    saveFavorites('POST', browserFavorites, () => {
      $('searchMessage').textContent = 'Browser favorites imported.';
    });
  });
  $('clearFavorite').addEventListener('click', () => {
    const index = Number($('favoriteSlot').value);
    const station = favorites[index];
    saveFavorites('PUT', {slot:index + 1, station:null}, () => {
      if (selected === index && station && playingStation?.uuid === station.uuid) {
        stopMetadata();
        audio.pause();
        audio.removeAttribute('src');
        audio.load();
        selected = -1;
        playingStation = null;
        setArt('');
        $('stationName').textContent = 'Ready to listen';
        $('nowPlaying').textContent = 'Choose a favorite station.';
        status('Choose a station below');
        syncButton();
      }
      closePicker();
    });
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
          saveFavorites('PUT', {
            slot:slot + 1,
            station:{uuid:station.uuid,name:station.name},
          }, () => { closePicker(); selectStation(slot); });
        });
        $('stationResults').appendChild(button);
      }
    } catch (error) { $('searchMessage').textContent = error.message; }
    finally { $('searchStations').disabled = false; }
  }
  $('searchStations').addEventListener('click', search);
  $('stationQuery').addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); search(); } });
  renderFavorites(); syncButton();
  refreshFavorites();
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) refreshFavorites();
  });
  window.addEventListener('pageshow', refreshFavorites);
  setInterval(() => {
    if (!document.hidden) refreshFavorites();
  }, 10000);
})();
