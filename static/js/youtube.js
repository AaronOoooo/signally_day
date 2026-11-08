/* Signally Day - YouTube panel (v0.1.0-alpha.7).
   Browser-only preferences; no YouTube API key or Google sign-in required. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const panel = $('youtubeCard');
  const slot = $('youtubeSlot');
  const empty = $('youtubeEmpty');
  const status = $('youtubeStatus');
  const toggle = $('toggleVideo');
  const edit = $('editVideo');
  const dialog = $('videoDialog');
  const form = $('videoForm');
  const field = $('videoUrl');
  const message = $('videoMessage');
  const clear = $('clearVideo');
  const openLink = $('openVideoOnYouTube');
  const searchForm = $('youtubeSearchForm');
  const searchInput = $('youtubeSearchQuery');
  const searchMessage = $('youtubeSearchMessage');
  const searchResults = $('youtubeSearchResults');
  const radio = $('radioAudio');
  if (!panel || !slot || !toggle || !dialog || !form || !radio) return;

  const ID_KEY = 'signally-day.youtube.video-id.v1';
  const HIDE_KEY = 'signally-day.youtube.hidden.v1';
  let videoId = null;
  let player = null;
  let playerReady = false;
  let apiRequested = false;
  let apiFailed = false;
  let hidden = false;

  function safeGet(key) { try { return localStorage.getItem(key); } catch (_) { return null; } }
  function safeSet(key, value) { try { localStorage.setItem(key, value); } catch (_) {} }
  function safeRemove(key) { try { localStorage.removeItem(key); } catch (_) {} }
  function setStatus(value) { status.textContent = value; }

  function parseVideoId(value) {
    const source = String(value || '').trim();
    if (/^[a-zA-Z0-9_-]{11}$/.test(source)) return source;
    let url;
    try { url = new URL(source); } catch (_) { return null; }
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    const host = url.hostname.toLowerCase();
    let id = null;
    if (host === 'youtu.be' || host === 'www.youtu.be') {
      id = url.pathname.split('/')[1];
    } else if (['youtube.com','www.youtube.com','m.youtube.com','www.youtube-nocookie.com','youtube-nocookie.com'].includes(host)) {
      const pieces = url.pathname.split('/').filter(Boolean);
      if (pieces[0] === 'watch') id = url.searchParams.get('v');
      else if (['shorts','live','embed','v'].includes(pieces[0])) id = pieces[1];
    }
    return /^[a-zA-Z0-9_-]{11}$/.test(id || '') ? id : null;
  }

  function pauseVideo() {
    if (!playerReady || !player || typeof player.pauseVideo !== 'function') return;
    try { player.pauseVideo(); } catch (_) { /* Player may be loading. */ }
  }

  // One coordinated media policy: whichever source starts playing owns audio.
  radio.addEventListener('play', pauseVideo);
  radio.addEventListener('playing', pauseVideo);

  function updateControls() {
    panel.classList.toggle('video-collapsed', hidden);
    toggle.textContent = hidden ? '▾ Show' : '▴ Hide';
    toggle.setAttribute('aria-expanded', String(!hidden));
    toggle.setAttribute('aria-label', hidden ? 'Show YouTube player' : 'Hide YouTube player');
    openLink.hidden = !videoId;
    if (videoId) openLink.href = 'https://www.youtube.com/watch?v=' + encodeURIComponent(videoId);
    empty.hidden = !!videoId;
    slot.hidden = hidden || !videoId;
    if (!videoId) setStatus('Choose a video to begin');
  }

  function readyForPlayer() {
    return !!(window.YT && window.YT.Player);
  }
  function loadApi() {
    if (readyForPlayer()) { createPlayer(); return; }
    if (apiRequested || apiFailed) return;
    apiRequested = true;
    setStatus('Loading YouTube…');
    // Explicitly load only Google's official iframe API.
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    script.onerror = () => { apiFailed = true; setStatus('YouTube unavailable · Open on YouTube'); };
    document.head.appendChild(script);
  }

  function createPlayer() {
    if (!videoId || hidden || !readyForPlayer()) return;
    if (player) return;
    playerReady = false;
    const target = document.createElement('div');
    target.id = 'youtubePlayer';
    slot.replaceChildren(target);
    setStatus('Loading video…');
    player = new window.YT.Player(target, {
      width: '100%', height: '100%', videoId,
      host: 'https://www.youtube-nocookie.com',
      playerVars: { playsinline: 1, autoplay: 0, origin: window.location.origin, rel: 0 },
      events: {
        onReady: () => { playerReady = true; setStatus('Ready · tap Play'); },
        onStateChange: event => {
          if (event.data === window.YT.PlayerState.PLAYING) {
            radio.pause();
            setStatus('Playing YouTube');
          } else if (event.data === window.YT.PlayerState.PAUSED) {
            setStatus('Video paused');
          } else if (event.data === window.YT.PlayerState.ENDED) {
            setStatus('Video ended');
          }
        },
        onError: () => setStatus('Video cannot be embedded · Open on YouTube')
      }
    });
  }
  function resetPlayer() {
    if (player && typeof player.destroy === 'function') {
      try { player.destroy(); } catch (_) {}
    }
    player = null;
    playerReady = false;
    slot.replaceChildren();
  }

  // The IFrame API invokes this global callback when its script is loaded.
  window.onYouTubeIframeAPIReady = () => { createPlayer(); };

  function chooseVideo(id) {
    pauseVideo();
    resetPlayer();
    videoId = id;
    if (id) safeSet(ID_KEY, id);
    else safeRemove(ID_KEY);
    updateControls();
    if (id && !hidden) loadApi();
  }

  toggle.addEventListener('click', () => {
    if (!hidden) pauseVideo();
    hidden = !hidden;
    safeSet(HIDE_KEY, String(hidden));
    updateControls();
    if (!hidden && videoId) loadApi();
  });
  edit.addEventListener('click', () => {
    field.value = videoId ? 'https://www.youtube.com/watch?v=' + videoId : '';
    message.textContent = 'Videos may occasionally prohibit embedded playback.';
    dialog.showModal();
    searchInput.focus();
  });
  // Search only on explicit submission, never on every keystroke (saves API quota).
  let searchSerial = 0;
  searchForm.addEventListener('submit', async event => {
    event.preventDefault();
    const query = searchInput.value.trim();
    if (query.length < 2 || query.length > 100) {
      searchMessage.textContent = 'Enter 2–100 characters.';
      return;
    }
    const serial = ++searchSerial;
    searchMessage.textContent = 'Searching YouTube…';
    searchResults.replaceChildren();
    try {
      const response = await fetch('/api/youtube/search?q=' + encodeURIComponent(query), {cache:'no-store'});
      const data = await response.json();
      if (serial !== searchSerial || !dialog.open) return;
      if (!response.ok) throw new Error(data.error || 'Search is unavailable.');
      const videos = Array.isArray(data.videos) ? data.videos : [];
      searchMessage.textContent = videos.length ? `Found ${videos.length} videos · tap one to load` : 'No playable video results found. Try different words.';
      for (const video of videos) {
        if (!/^[a-zA-Z0-9_-]{11}$/.test(video.id || '')) continue;
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'youtube-result';
        const image = document.createElement('img');
        if (video.thumbnail && /^https:\/\//.test(video.thumbnail)) image.src = video.thumbnail;
        image.alt = '';
        image.loading = 'lazy';
        const content = document.createElement('span');
        const title = document.createElement('span');
        title.className = 'youtube-result-title';
        title.textContent = video.title || 'Untitled video';
        const channel = document.createElement('span');
        channel.className = 'youtube-result-channel';
        channel.textContent = video.channel || 'YouTube';
        content.append(title, channel);
        button.append(image, content);
        button.addEventListener('click', () => {
          chooseVideo(video.id);
          dialog.close();
        });
        searchResults.append(button);
      }
    } catch (error) {
      if (serial === searchSerial) searchMessage.textContent = error.message || 'Search failed.';
    }
  });
  dialog.addEventListener('close', () => { searchSerial += 1; });

  form.addEventListener('submit', event => {
    event.preventDefault();
    const id = parseVideoId(field.value);
    if (!id) {
      message.textContent = 'Enter a valid YouTube video URL or 11-character video ID.';
      return;
    }
    chooseVideo(id);
    dialog.close();
  });
  clear.addEventListener('click', () => { chooseVideo(null); dialog.close(); });

  const saved = safeGet(ID_KEY);
  videoId = /^[a-zA-Z0-9_-]{11}$/.test(saved || '') ? saved : null;
  hidden = safeGet(HIDE_KEY) === 'true';
  updateControls();
  if (videoId && !hidden) loadApi();
})();
