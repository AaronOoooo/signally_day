# Signally Day — v0.1.0-alpha.7 (YouTube panel)

## What's included

This is a small **patch** for the working v0.1.0-alpha.6 app, not a replacement application. The patch contains exactly these existing/new application files:

- `templates/dashboard.html` — YouTube panel below Calendar, Edit and Show/Hide buttons, video dialog, script reference, version label.
- `static/css/day.css` — iPad-friendly right column layout, video frame and controls, scrollable calendar.
- `static/js/youtube.js` — video URL parsing, saved selection, YouTube IFrame Player API, player coordination.

**It does not include `radio.js`, `app.py`, `calendar_feed.py`, `.env`, OAuth credentials or token files. Leave those untouched.** The radio is coordinated using the `<audio id="radioAudio">` element already present in your dashboard. No new Python dependency or API key is required.

## Install on Windows

1. In PowerShell inside `C:\Users\tucky\Code\signally_day`, run `git status` and check that the current working changes are committed. Ideally use your `v0.1.0-alpha.7` development branch.
2. Stop the Flask app with `Ctrl+C`.
3. Extract the ZIP and copy its **`templates` and `static` folders** into the root of `signally_day`, merging folders and replacing `templates/dashboard.html` and `static/css/day.css`.
4. Verify that `static/js/youtube.js` now exists. Do **not** delete or replace your existing `static/js/radio.js`.
5. Restart from the repository root:

```powershell
.\.venv\Scripts\python.exe app.py
```

6. Open `http://127.0.0.1:5055` on Windows and `http://YOUR-PC-IP:5055` on your iPad connected to the same private Wi-Fi. Hard-refresh Windows with `Ctrl+F5`; reload Safari on iPad.

## Test in order

1. The **YouTube** card appears below Calendar and is visible by default, with the placeholder “Choose a video to watch”. Calendar events remain in the scrollable top part of the right column.
2. Click **Edit**, paste a normal YouTube link (e.g. `https://www.youtube.com/watch?v=M7lc1UVf-VE`) and click **Save**. The built-in YouTube player should appear. **It will not autoplay.**
3. Tap the YouTube **Play** button. If radio is playing, radio should pause as soon as YouTube reports it has started.
4. With YouTube playing, tap any favorite station or the radio Play button. YouTube should pause when the radio element starts.
5. Click **Hide**. Video pauses and the player panel collapses to its header. Click **Show**: the panel returns but video must not automatically restart.
6. Reload the dashboard; the selected video and visibility choice should persist **on that browser/device**. Windows and iPad selections are independent.
7. Click **Edit → Clear saved video**; placeholder returns.
8. Confirm weather, CTA, calendar, NPR (10-second rotation), radio favorites and clock still work.

## Notes and limitations

- YouTube's IFrame Player API requires internet access. Videos marked private, age-restricted or embedding-disabled may not play inside the dashboard. Use **Open on YouTube** for those.
- Some live/Shorts videos may refuse embedding even though the URL is accepted. This release supports individual video links, **not** playlists, YouTube search, or ABC7 yet.
- The IFrame API can be blocked by browser privacy settings or network filtering. If the player never loads, test in Chrome then Safari with content blocking temporarily disabled for your private dashboard address.
- iPad Safari has autoplay/user-gesture limits. Always start video by tapping its native Play button. Automatic mutual exclusion is best-effort and should be tested on the actual iPad.
- If video controls feel crowded at your iPad's display size, capture a screenshot before changing the rest of the layout.
- The design keeps the Calendar above video; if many appointments are shown, calendar events scroll inside their panel.
- This remains a local, trusted-LAN Flask development app. Do not expose port 5055 to the public internet: your calendar API endpoint does not provide authentication.
- The YouTube video ID and collapsed state are saved in browser `localStorage`. No new secret credentials are stored.

## Validation performed for this patch

- JavaScript syntax check via `node --check`.
- Browser control checks: Show/Hide, open Edit, reject unrelated URLs, accept YouTube URL, clear selected video.
- Layout measurements at 1112×834 and 1024×768: no horizontal/vertical overflow; visible empty video viewport 200px high and over 200px wide.

Live YouTube playback and coordination with your existing `radio.js` were **not** tested against the real YouTube network in the build environment. Please validate on Windows and iPad before committing.
