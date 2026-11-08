# Signally Day v0.1.0-alpha.5.1 — Google Calendar API

This is an incremental **calendar-only patch**. It replaces the old feed parser, leaves `app.py` and the current calendar JavaScript/HTML untouched, and uses the existing `/api/calendar/events` endpoint.

## Install (Windows PowerShell)

1. Stop the Flask app with Ctrl+C.
2. Copy `calendar_feed.py`, `authorize_calendar.py`, and `requirements.txt` from this ZIP to the root of your existing `signally_day` repository. Replace only matching files. **Do not copy any old `.env`, `.gitignore`, `credentials.json`, or `token.json` from elsewhere.**
3. Confirm `.gitignore` contains these entries (add them if missing):

   ```gitignore
   credentials.json
   token.json
   ```

4. Verify your credentials file is ignored: `git check-ignore -v credentials.json`.
5. Install packages:

   ```powershell
   .\.venv\Scripts\python.exe -m pip install -r requirements.txt
   ```

6. Run the **one-time desktop authorization**:

   ```powershell
   .\.venv\Scripts\python.exe authorize_calendar.py
   ```

   Choose **aaron.o.hall@gmail.com** when Google's browser sign-in opens. Google may show an unverified-app warning because the app is in testing; verify it is your Signally Day project before consenting. The script creates `token.json` locally. Never upload either JSON file.

7. Verify both authorization files are ignored:

   ```powershell
   git check-ignore -v credentials.json token.json
   git ls-files -- credentials.json token.json
   ```

   The second command must produce no output.

8. Restart Flask:

   ```powershell
   .\.venv\Scripts\python.exe app.py
   ```

9. Open `http://127.0.0.1:5055/api/calendar/events` **privately** (it may display personal event titles). Then open your dashboard and check the calendar panel.

## What changes

- The app retrieves only events overlapping today/tomorrow using Google Calendar API `timeMin`/`timeMax`, expands recurring events via `singleEvents`, and caches for five minutes.
- The code explicitly queries calendar ID `aaron.o.hall@gmail.com`, **not** the Hall Family Calendar. It requires the signed-in Google account to have access to that calendar.
- Date/time display remains in `America/Chicago`.
- The scope is calendar-events read-only. No changes to appointments are possible from this integration.
- `CALENDAR_ICS_URL` and `CALENDAR_ICS_FILE` are no longer used. You may remove them from `.env` after confirming the API connection works. **Do not share the private old ICS URL.**
- `CALENDAR_SHOW_DETAILS=false` in `.env` continues to replace event names with `Busy`.

## Security notes

Your application is still **LAN-only and has no sign-in protection**. Anyone able to open the dashboard on your network can read event titles and times. Do not expose port 5055 publicly. The OAuth desktop-client JSON and the token JSON must never be committed or shared. OAuth testing-mode refresh tokens may expire in 7 days, requiring you to run `authorize_calendar.py` again.

If authentication fails, do not paste a traceback containing credentials, request headers, access tokens, or URLs. Share only a sanitized error name/message.
