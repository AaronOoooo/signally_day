(() => {
  'use strict';
  const zone = 'America/Chicago';
  const $ = id => document.getElementById(id);
  const date = $('today');
  const localButton = $('toggleLocalClock');
  const timeOptions = {hour:'numeric', minute:'2-digit', hour12:true};
  const dateOptions = {weekday:'long', month:'long', day:'numeric', year:'numeric'};
  const chicagoTime = new Intl.DateTimeFormat('en-US', {...timeOptions, timeZone:zone});
  const chicagoDate = new Intl.DateTimeFormat('en-US', {...dateOptions, timeZone:zone});
  const calendarDate = new Intl.DateTimeFormat('en-US', {
    timeZone:zone, weekday:'long', month:'long', day:'numeric',
  });
  let localTime;
  let localDate;

  function fitDate() {
    date.style.fontSize = '';
    if (date.clientWidth && date.scrollWidth > date.clientWidth) {
      const size = parseFloat(getComputedStyle(date).fontSize);
      date.style.fontSize = (size * (date.clientWidth - 1) / date.scrollWidth) + 'px';
    }
  }

  function update() {
    const now = new Date();
    const parts = (localTime || chicagoTime).formatToParts(now);
    const hour = parts.find(part => part.type === 'hour').value;
    const minute = parts.find(part => part.type === 'minute').value;
    $('clock').textContent = hour + ':' + minute;
    $('ampm').textContent = parts.find(part => part.type === 'dayPeriod').value;
    const fullDate = (localDate || chicagoDate).format(now);
    if (date.textContent !== fullDate) {
      date.textContent = fullDate;
      fitDate();
    }
    $('calendarDate').textContent = 'Today · ' + calendarDate.format(now);
  }

  localButton.addEventListener('click', () => {
    const useLocal = !localTime;
    localTime = useLocal ? new Intl.DateTimeFormat('en-US', timeOptions) : null;
    localDate = useLocal ? new Intl.DateTimeFormat('en-US', dateOptions) : null;
    localButton.textContent = useLocal ? 'Chicago' : 'Local';
    $('clockZone').textContent = useLocal ? 'LOCAL TIME' : 'CHICAGO TIME';
    update();
  });
  if (typeof ResizeObserver === 'function') {
    new ResizeObserver(fitDate).observe(date.closest('.clock-card'));
  }
  addEventListener('resize', fitDate);
  function connection() { $('connection').textContent = navigator.onLine ? 'Dashboard ready' : 'Offline'; }
  const calendarToggle = $('toggleCalendar');
  const dashboard = document.documentElement;
  function updateCalendarToggle() {
    const hidden = dashboard.dataset.calendarHidden === 'true';
    const action = hidden ? 'Show' : 'Hide';
    calendarToggle.textContent = action;
    calendarToggle.setAttribute('aria-label', action + ' calendar events');
    calendarToggle.setAttribute('aria-expanded', String(!hidden));
  }
  if (calendarToggle) {
    updateCalendarToggle();
    calendarToggle.addEventListener('click', () => {
      const hidden = dashboard.dataset.calendarHidden !== 'true';
      dashboard.dataset.calendarHidden = String(hidden);
      updateCalendarToggle();
      try {
        localStorage.setItem('signallyDay.calendarHidden', String(hidden));
      } catch (_) {}
    });
  }

  update(); connection();
  setInterval(update, 15000);
  addEventListener('online', connection); addEventListener('offline',connection);
})();
