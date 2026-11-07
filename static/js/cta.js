(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const storageKey = 'signallyDay.ctaStop.v1';
  let stop = '1563';
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved && /^[0-9]{1,6}$/.test(saved)) stop = saved;
  } catch (_) {}
  let lastQuery = 0;
  let renderedArrivals = [];
  let fetchedAt = 0;
  const dialog = $('transitDialog');
  function showStop() {
    $('transitStop').textContent = `Stop #${stop}`;
    if (stop === '1563') $('transitPlace').textContent = 'Indiana & 31st · Northbound';
    else $('transitPlace').textContent = `CTA Stop #${stop}`;
  }
  async function refresh() {
    const requestedStop = stop;
    const version = ++lastQuery;
    $('transitStatus').textContent = 'Updating arrivals…';
    try {
      const response = await fetch('/api/cta/arrivals?stop=' + encodeURIComponent(requestedStop), {cache: 'no-store'});
      const payload = await response.json();
      if (version !== lastQuery) return;
      if (!response.ok) throw new Error(payload.error || 'CTA unavailable');
      if (requestedStop !== '1563') $('transitPlace').textContent = payload.stop_name || `CTA Stop #${requestedStop}`;
      const box = $('transitArrivals');
      box.replaceChildren();
      if (!payload.arrivals.length) {
        const p = document.createElement('p');
        p.className = 'muted';
        p.textContent = 'No predicted arrivals right now.';
        box.appendChild(p);
      }
      renderedArrivals = payload.arrivals;
      fetchedAt = Date.now();
      for (const a of renderedArrivals) {
        const row = document.createElement('div'); row.className = 'transit-arrival';
        const route = document.createElement('strong'); route.className = 'transit-route'; route.textContent = a.route;
        const destination = document.createElement('span'); destination.className = 'transit-destination'; destination.textContent = a.destination;
        const timeColumn = document.createElement('span'); timeColumn.className = 'transit-time-column';
        const clock = document.createElement('span'); clock.className = 'transit-clock';
        const eta = document.createElement('b'); eta.className = 'transit-eta';
        timeColumn.append(clock, eta);
        row.append(route, destination, timeColumn); box.appendChild(row);
      }
      updateArrivalTimes();
      $('transitStatus').textContent = payload.stale ? 'Last available arrivals' : 'CTA Bus Tracker · refreshes every 30s';
    } catch (error) {
      if (version !== lastQuery) return;
      renderedArrivals = [];
      const box = $('transitArrivals'); box.replaceChildren();
      const p = document.createElement('p'); p.className = 'muted';
      p.textContent = error.message || 'Unable to load CTA arrivals'; box.appendChild(p);
      $('transitStatus').textContent = 'Arrivals unavailable';
    }
  }
  const chicagoTime = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric', minute: '2-digit', timeZone: 'America/Chicago'
  });
  function updateArrivalTimes() {
    const rows = $('transitArrivals').querySelectorAll('.transit-arrival');
    rows.forEach((row, index) => {
      const arrival = renderedArrivals[index];
      if (!arrival) return;
      const clock = row.querySelector('.transit-clock');
      const eta = row.querySelector('.transit-eta');
      let mins;
      if (arrival.arrival_time) {
        const instant = new Date(arrival.arrival_time);
        if (!Number.isNaN(instant.getTime())) {
          clock.textContent = chicagoTime.format(instant);
          mins = Math.max(0, Math.ceil((instant.getTime() - Date.now()) / 60000));
        }
      }
      // ETA countdown fallback if CTA doesn't include a parseable arrival time.
      if (mins === undefined) {
        clock.textContent = 'Time unavailable';
        mins = Math.max(0, Number(arrival.minutes || 0) - Math.floor((Date.now() - fetchedAt) / 60000));
      }
      const due = mins === 0 || (arrival.due && mins <= 1);
      eta.textContent = due ? 'Due' : `${mins} min`;
      const urgency = mins >= 10 ? 'far' : mins >= 6 ? 'soon' : 'imminent';
      const col = row.querySelector('.transit-time-column');
      col.classList.remove('far', 'soon', 'imminent');
      col.classList.add(urgency);
      eta.setAttribute('aria-label', due ? 'Bus due now' : `${mins} minutes until arrival`);
    });
  }
  function selectStop(value) {
    stop = value;
    try { localStorage.setItem(storageKey, value); } catch (_) {}
    showStop(); dialog.close(); refresh();
  }
  $('editTransit').addEventListener('click', () => {
    $('transitStopInput').value = stop;
    $('transitEditMessage').textContent = 'Enter a numeric stop ID, then tap Save.';
    dialog.showModal(); $('transitStopInput').focus();
  });
  $('transitStopForm').addEventListener('submit', event => {
    event.preventDefault();
    const value = $('transitStopInput').value.trim();
    if (!/^[0-9]{1,6}$/.test(value)) {
      $('transitEditMessage').textContent = 'Please enter a valid numeric stop ID.'; return;
    }
    selectStop(value);
  });
  $('transitReset').addEventListener('click', () => selectStop('1563'));
  showStop(); refresh();
  setInterval(() => { if (!document.hidden) refresh(); }, 30000);
  setInterval(() => { if (!document.hidden) updateArrivalTimes(); }, 15000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
})();
