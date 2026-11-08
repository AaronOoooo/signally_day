(() => {
  'use strict';
  const link = document.getElementById('newsText');
  const timing = document.getElementById('newsTiming');
  if (!link || !timing) return;
  let items = [];
  let index = 0;
  let timer = null;
  let fadeTimer = null;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  function display(item) {
    link.textContent = item.title; // Never inject NPR markup.
    link.href = item.url;
    link.setAttribute('aria-label', 'Read on NPR: ' + item.title);
  }
  function rotate() {
    if (items.length < 2 || document.hidden) return;
    index = (index + 1) % items.length;
    if (reduced.matches) { display(items[index]); return; }
    link.classList.add('news-fading');
    clearTimeout(fadeTimer);
    fadeTimer = setTimeout(() => {
      display(items[index]);
      link.classList.remove('news-fading');
    }, 220);
  }
  function startRotation() {
    clearInterval(timer);
    if (items.length > 1) timer = setInterval(rotate, 10000);
  }
  async function refresh() {
    try {
      const response = await fetch('/api/news/headlines', {cache:'no-store'});
      if (!response.ok) throw new Error('News unavailable');
      const data = await response.json();
      const valid = (data.headlines || []).filter(x => typeof x.title === 'string' && typeof x.url === 'string' && /^https:\/\/(?:[a-z0-9-]+\.)*npr\.org\//i.test(x.url));
      if (!valid.length) throw new Error('No headlines');
      const oldUrl = items[index]?.url;
      items = valid;
      const oldIndex = items.findIndex(x => x.url === oldUrl);
      index = oldIndex >= 0 ? oldIndex : 0;
      clearTimeout(fadeTimer);
      link.classList.remove('news-fading');
      display(items[index]);
      timing.textContent = data.stale ? 'Earlier headlines · rotates 10s' : 'NPR · rotates every 10s';
      startRotation();
    } catch (error) {
      if (!items.length) {
        link.textContent = 'NPR headlines are temporarily unavailable. Tap to visit NPR News.';
        link.href = 'https://www.npr.org/sections/news/';
        timing.textContent = 'Will retry';
      } else {
        timing.textContent = 'Earlier headlines · retrying';
      }
    }
  }
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) { refresh(); startRotation(); }
  });
  refresh();
  setInterval(refresh, 30 * 60 * 1000);
})();
