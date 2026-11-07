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
  update(); connection();
  setInterval(update, 15000);
  addEventListener('online', connection); addEventListener('offline',connection);
})();
