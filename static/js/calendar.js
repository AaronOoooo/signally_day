(() => {
  'use strict';
  const root = document.getElementById('calendarEvents');
  const status = document.getElementById('calendarStatus');
  if (!root || !status) return;

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function showMessage(message) {
    root.replaceChildren(el('p', 'calendar-message', message));
  }

  function showEvents(events) {
    root.replaceChildren();
    if (!events.length) {
      showMessage('No more events today or tomorrow.');
      return;
    }
    for (const day of ['today', 'tomorrow']) {
      const items = events.filter(e => e.day === day);
      if (!items.length) continue;
      const section = el('section', 'calendar-day');
      section.appendChild(el('h3', 'calendar-day-title', day === 'today' ? 'Today' : 'Tomorrow'));
      for (const e of items.slice(0, 8)) {
        const item = el('div', 'calendar-event');
        item.appendChild(el('span', 'calendar-event-time', e.time || ''));
        item.appendChild(el('span', 'calendar-event-title', e.title || 'Untitled event'));
        section.appendChild(item);
      }
      root.appendChild(section);
    }
  }

  async function refreshCalendar() {
    try {
      const response = await fetch('/api/calendar/events', {cache: 'no-store'});
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Calendar temporarily unavailable.');
      showEvents(Array.isArray(data.events) ? data.events : []);
      status.textContent = 'Calendar connected · refreshes every 5 min';
    } catch (error) {
      showMessage(error.message === 'Calendar is not connected yet.' ? 'Connect your private calendar feed to see events.' : 'Calendar currently unavailable.');
      status.textContent = error.message === 'Calendar is not connected yet.' ? 'Not connected yet' : 'Calendar unavailable';
    }
  }

  refreshCalendar();
  setInterval(refreshCalendar, 5 * 60 * 1000);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) refreshCalendar();
  });
})();
