(() => {
  'use strict';
  const zone = 'America/Chicago';
  const timeFmt = new Intl.DateTimeFormat('en-US', {timeZone:zone,hour:'numeric',minute:'2-digit',hour12:true});
  const dateFmt = new Intl.DateTimeFormat('en-US', {timeZone:zone,weekday:'long',month:'long',day:'numeric',year:'numeric'});
  const weekdayFmt = new Intl.DateTimeFormat('en-US', {timeZone:zone,weekday:'long',month:'long',day:'numeric'});
  const hourFmt = new Intl.DateTimeFormat('en-US', {timeZone:zone,hour:'numeric',hourCycle:'h23'});
  const $ = id => document.getElementById(id);
  function update() {
    const now = new Date();
    const parts = timeFmt.formatToParts(now);
    $('clock').textContent = parts.filter(p => ['hour','literal','minute'].includes(p.type)).map(p=>p.value).join('');
    $('ampm').textContent = parts.find(p=>p.type==='dayPeriod')?.value || '';
    $('today').textContent = dateFmt.format(now);
    $('calendarDate').textContent = 'Today · ' + weekdayFmt.format(now);
    const hour = Number(hourFmt.format(now));
    $('greeting').textContent = hour < 12 ? 'Good morning! Make today sound great.' : hour < 17 ? 'Good afternoon! Enjoy your day.' : 'Good evening! Settle in and listen.';
  }
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
