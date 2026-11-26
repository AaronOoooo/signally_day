(() => {
  const overlay = document.getElementById('smartScreen');
  if (!overlay || typeof overlay.showModal !== 'function') return;

  const action = new URLSearchParams(window.location.search).get('smart-screen');
  const dimButton = document.getElementById('dimNow');
  let manuallyDimmed = false;

  const testDimsAt = Date.now() + 15_000;
  const revealDuration = 5 * 60_000;
  let revealUntil = action === 'test' ? 0 : Date.now() + revealDuration;
  const chicagoClock = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  const weekdayWindows = [[6 * 60, 9 * 60], [17 * 60, 19 * 60]];
  const weekendWindows = [[7 * 60, 9 * 60], [16 * 60 + 30, 18 * 60 + 30]];

  function inDisplayWindow(now) {
    if (action === 'test') return now < testDimsAt;

    const parts = Object.fromEntries(
      chicagoClock.formatToParts(now).map(({ type, value }) => [type, value])
    );
    const minute = Number(parts.hour) * 60 + Number(parts.minute);
    const weekend = parts.weekday === 'Sat' || parts.weekday === 'Sun';
    const windows = weekend ? weekendWindows : weekdayWindows;
    return windows.some(([start, end]) => start <= minute && minute < end);
  }

  function update() {
    const now = Date.now();
    const scheduledDisplay = action === 'off' || inDisplayWindow(now);
    if (!manuallyDimmed && (scheduledDisplay || now < revealUntil)) {
      if (overlay.open) overlay.close();
    } else if (!overlay.open) {
      overlay.showModal();
    }
  }

  function revealDashboard() {
    manuallyDimmed = false;
    revealUntil = Date.now() + revealDuration;
    update();
  }

  dimButton.hidden = false;
  dimButton.addEventListener('click', () => {
    manuallyDimmed = true;
    update();
  });
  overlay.querySelector('button').addEventListener('click', revealDashboard);
  overlay.addEventListener('cancel', (event) => {
    event.preventDefault();
    revealDashboard();
  });
  document.addEventListener('visibilitychange', update);
  window.addEventListener('pageshow', update);
  setInterval(update, 1_000);
  update();
})();
