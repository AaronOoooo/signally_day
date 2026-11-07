# Signally Day — v0.1.0-alpha.2 (Phase 2: Radio)

A standalone, private-LAN iPad dashboard. Radio playback is independent of Signally's main website, but station metadata is provided by the existing Signally metadata API.

## Upgrade your existing Phase 1 checkout (Windows PowerShell)

1. Stop the running Phase 1 server using `Ctrl+C`.
2. **Keep your existing `.git` folder and `.venv` folder.** Extract this ZIP and copy its contents into the root of your existing `signally_day` repository, replacing files when prompted.
3. Open PowerShell in the repository folder:

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe app.py
```

4. Visit `http://127.0.0.1:5055` on your PC, or `http://YOUR-PC-IP:5055` on the iPad over the same private Wi-Fi.
5. Hard-refresh your browser on Windows (`Ctrl+F5`). On the iPad, reload the page in Safari.

## Test the player

1. Click **Edit favorites**.
2. Choose **Favorite 1**, search a station by name (e.g. `Ella Radio`), and tap a result. The station is saved in that browser's `localStorage` and selected.
3. If Safari does not start sound automatically after selection, tap the large **Play** button. This is expected on some iPads because audio can require a fresh user gesture.
4. Test **Pause**, **Play**, **Mute**, the volume slider, and previous/next favorite controls.
5. Add four more favorites and test switching between them.
6. Reload the page: favorites should remain. They are stored on each device separately (not synced between PC and iPad).
7. Confirm the clock and placeholder weather, CTA, NPR and calendar panels still look correct.

## Implementation notes

- `/api/stations/search`: uses Radio Browser's public directory to find stations and their UUIDs.
- `/api/stations/<uuid>/metadata`: requests station/track/stream information from `https://signallyradio.com/metadata/<uuid>`.
- No API credentials are needed for radio playback. Weather and CTA are unchanged in this release.
- Streams originate from external stations. Some stations will fail, reject HTML5 playback, or use formats unsupported in Safari. Try another station to distinguish player issues from broken streams.
- Station metadata is refreshed every 60 seconds. It may not always include artwork or track information.
- This standalone player does **not** share persistent playback state or analytics with the main Signally site. Those are later integration decisions.
- `SIGNALLY_BASE_URL` may optionally override the upstream Signally site, for example for testing. Use only a trusted URL.
- Do not expose the Flask development server to the internet. Use on a trusted LAN only; the station search endpoint has no authentication.
- Avoid pushing secrets or `.env` files. This project currently requires no secrets.

## Development checks

```powershell
.\.venv\Scripts\python.exe -m py_compile app.py
curl.exe http://127.0.0.1:5055/health
```

## Deferred features

Weather API, CTA arrivals, calendar, NPR feed/rotation, and YouTube/live TV are not implemented in this release.


See README-CITY.md for city switching (v0.1.0-alpha.3.1).
