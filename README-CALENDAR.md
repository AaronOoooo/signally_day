# Signally Day — Phase 3C: private calendar (v0.1.0-alpha.5)

This version supports a **read-only Google Calendar iCal feed**, or a local `.ics` file for testing. No Google password or OAuth credentials are requested.

## Install

1. Stop the Flask server. Back up your repository if desired.
2. Copy the files from this ZIP into your existing `signally_day` root. **Keep your existing `.env`, `.venv`, and `.git`.**
3. Install dependencies:

   ```powershell
   .\.venv\Scripts\python.exe -m pip install -r requirements.txt
   ```

4. Add one of these settings to `.env` (not both):

   - **Google Calendar:** `CALENDAR_ICS_URL=` followed by the **Secret address in iCal format** for a calendar you own. Find it in Google Calendar on a desktop: Settings → Settings for my calendars → select calendar → Integrate calendar. Treat it like a password. Never paste it into chat or GitHub. If it's missing, your organization may restrict it.
   - **Local test:** create folder `calendar_data` in project root, copy `examples/sample-calendar.ics` to `calendar_data/sample.ics`, and set `CALENDAR_ICS_FILE=sample.ics` in `.env`. The sample has an event on 2026-11-07 and only appears on that date; change its times for testing on another day. This folder is gitignored.

5. For your calendar's event titles, use `CALENDAR_SHOW_DETAILS=true`; for extra privacy, set it to `false` to show only Busy.
6. Restart Flask and visit `http://127.0.0.1:5055/api/calendar/events` to check JSON; then view the iPad dashboard.

## Privacy and limitations

- This is **private-LAN use only**; do not expose port 5055 on the Internet or host this dashboard unprotected on Render.
- **Anyone with access to your dashboard on the LAN can see calendar titles and times** when details are enabled. This alpha does not implement authentication. Use a non-sensitive calendar or `CALENDAR_SHOW_DETAILS=false` if needed.
- The secret ICS URL remains in `.env`, and the browser only sees parsed event details (not the URL). `.env` and `calendar_data/` are ignored by Git.
- Google Calendar feeds may update with delays; data is cached for 5 minutes in Signally Day.
- Read-only, today and tomorrow in **Chicago time**; recurring appointments are expanded.
- This alpha supports **Google Calendar secret HTTPS feed URL** or a local file, not Microsoft 365 OAuth/iCloud feeds yet. Don't publish a work calendar without organizational approval.
- If the feed URL gets exposed, reset it in Google Calendar settings.
- If you want multiple calendars or sign-in later, we can add Google Calendar OAuth as a separate milestone.

## Troubleshooting

- `503 Calendar is not connected yet`: add one calendar setting to `.env` and restart Flask.
- `503 Calendar feed could not be retrieved`: confirm the URL is the full **Secret address in iCal format** and is not expired.
- No events: the right panel shows events still ongoing or upcoming today and tomorrow; check the event date and Chicago time.
- Avoid sending screenshots of your `.env` or sharing the secret feed URL.
