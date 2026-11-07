# Signally Day — Phase 3B CTA arrivals (v0.1.0-alpha.4.1)

## Installing
1. Stop your running Flask server (Ctrl+C).
2. Back up your current project files. Extract this update into your existing `signally_day` folder, **replacing application files but preserving `.env`, `.git`, and `.venv`**.
3. In your local `.env`, add `CTA_API_KEY=YOUR_ACTUAL_CTA_BUS_TRACKER_API_KEY`. Do not share the key or commit `.env`.
4. No additional Python libraries are required. Launch with `.\.venv\Scripts\python.exe app.py`.
5. Test `http://127.0.0.1:5055/api/cta/arrivals?stop=1563` on the PC, then load the dashboard on your iPad. A valid response has `stop_id`, `stop_name`, and `arrivals` fields. An empty `arrivals` array may simply mean no service/predictions at this time.
6. Tap **Edit** in the CTA card to set another CTA Bus Tracker stop ID. The selection is saved only in that browser.

### What to expect
Default: stop **1563**, Indiana & 31st Street, **northbound**. Up to three arrivals displayed (route, destination, ETA). Automatic refresh every 30 seconds while the dashboard is visible.

### Security and caveats
- The CTA key stays server-side in `.env`; browser calls only the local `/api/cta/arrivals` endpoint.
- CTA estimates are approximate; an empty list does not prove buses are not running.
- Only numeric stop IDs are supported in this release. No stop-search functionality yet.
- Keep port 5055 limited to a trusted local network.
- Your existing weather, radio, favorites, and dashboard files are retained.
- Before committing, run `git status` and confirm `.env` is ignored.

### Arrival times and urgency colors (alpha.4.1)
- Each route displays its CTA-estimated **Chicago local arrival time** (for example, `2:42 PM`) and minutes remaining.
- **Green:** 10 minutes or more. **Orange:** 6–9 minutes. **Red:** 0–5 minutes, including `Due`.
- Color applies to the time/countdown, not to the route badge. Values refresh from CTA about every 30 seconds; the visual countdown updates between requests.
- CTA predictions can change, be delayed or unavailable. If CTA omits a usable timestamp, the clock displays `Time unavailable` while the countdown uses CTA's minutes estimate.
