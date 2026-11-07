# Signally Day v0.1.0-alpha.3.1 — Selectable Weather City

Your existing weather feature is expanded with a **✎ Edit** button. It uses OpenWeatherMap's Geocoding API to find cities. Weather is fetched by coordinates and cached for 10 minutes **per city**. The API key stays on the Flask server. Your selected city is saved in that device's browser localStorage; each device can choose a different city.

## Upgrade
1. Stop your local Flask server (`Ctrl+C`).
2. Unzip this package over your existing `signally_day` repository, replacing matching app and static/template files. **Do not remove your `.git`, `.venv`, or `.env`**. No changes to the API key are required. If prompted, keep your existing `.env`.
3. Start ` .\.venv\Scripts\python.exe app.py ` in PowerShell (same as before).
4. Reload Safari on the iPad. If the older version appears, close/reopen the tab and refresh.
5. Tap **✎ Edit** beside Weather. Search `Lexington, KY, US`, choose **Lexington, Kentucky** and check the new temperature. Repeat with Chicago to verify switching.
6. Refresh the dashboard. Lexington should remain selected on that device. The Windows browser will still show Chicago until changed separately.
7. The clock intentionally continues to show Chicago time. Calendar and radio are unchanged.

## Troubleshooting
- City search: `http://127.0.0.1:5055/api/weather/cities?q=Lexington,KY,US`
- Current selected-city weather endpoint is `GET /api/weather?lat=38.0406&lon=-84.5037` (coordinates shown here are illustrative).
- On an OpenWeatherMap 401, verify your API key and API permissions. No key should appear in browser-visible requests.
- This private LAN Flask server should not be exposed to the internet.
