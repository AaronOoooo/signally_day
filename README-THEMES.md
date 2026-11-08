# Signally Day v0.1.0-beta.1 — Color themes

## What's included

Six built-in themes: Sunset Drive (default), Midnight Signal, Electric Lounge, Emerald City, Golden Hour, and Daybreak. A Themes button in the header opens a picker; tapping any palette applies it instantly. The selected theme is stored in this browser's localStorage (`signallyDay.theme`). CTA arrival color thresholds remain green/amber/red.

## Install (Windows, PowerShell)

1. Stop the running app with Ctrl+C.
2. Confirm `git status` and consider a backup/commit before replacing files.
3. Unzip this package and copy its `templates` and `static` folders into your existing `signally_day` repository, allowing matching `templates/dashboard.html` to be replaced.
4. Keep `.env`, `.venv`, `credentials.json`, `token.json`, and all existing application modules untouched. Do not delete `static/js/radio.js` or other scripts.
5. Run `./.venv/Scripts/python.exe app.py` in PowerShell (or `\.venv\Scripts\python.exe app.py`, adjusted for your shell).
6. Refresh Windows browser (Ctrl+F5) and reload Safari on the iPad. If a saved theme exists, it will override the Sunset Drive default.

No new API keys or Python dependencies are required.

## Verify

- Sunset Drive appears initially on a browser where the theme was never saved.
- Header Themes button opens a six-option picker; color changes without refreshing.
- Reload retains your previous selection on that device.
- Daybreak uses dark text on light cards.
- CTA urgency countdown remains green (10+), orange (6–9), red (0–5).
- Weather, CTA, personal calendar, NPR, favorites, radio playback, and YouTube search all still work.
- Check the dashboard in landscape Safari on the actual iPad Air 3.

This changes appearance files only. If a visual regression occurs, restore the old `templates/dashboard.html` and remove `static/css/themes.css` and `static/js/themes.js` (or revert the commit).

## Versioning

Use your next development branch for beta.1 if desired. Keep previous alpha branch safe until the beta passes tests. Do not push secrets.

## Files

- `templates/dashboard.html` — adds theme button/dialog and asset references.
- `static/css/themes.css` — theme palettes and override styling, leaves existing day.css unchanged.
- `static/js/themes.js` — browser-only theme picker and storage.
