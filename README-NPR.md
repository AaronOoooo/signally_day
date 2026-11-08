# Signally Day v0.1.0-alpha.6 — NPR News ticker

A **private, personal noncommercial** RSS headline reader with NPR attribution.

## Installation

1. Stop the Flask server (`Ctrl+C`).
2. Copy these files into the existing `signally_day` repo, preserving their folders:
   - `app.py` (replaces existing app.py)
   - `news_feed.py` (new)
   - `templates/dashboard.html` (replaces existing)
   - `static/css/day.css` (replaces existing)
   - `static/js/news.js` (new)
3. Leave `.env`, `credentials.json`, `token.json`, and your `.venv` alone.
4. Run ` .\.venv\Scripts\python.exe app.py` in PowerShell. Existing `requests` covers dependencies.
5. Browse `http://127.0.0.1:5055/api/news/headlines` (only headlines and NPR links). Then refresh the dashboard, including the iPad. Use Ctrl+F5 in Chrome if old assets remain cached.

## Expected

- Up to 12 NPR News feed headlines; rotates each **5 seconds**, with a gentle fade unless reduced motion is requested.
- Click/tap a headline to open the NPR story in a separate tab.
- Retrieves new feed no more than once per 30 minutes in a running Flask process. Other requests use in-memory cache.
- Up to 6 hours of in-memory stale headlines displayed during feed outages. App restarts clear that cache.
- No API key necessary. Nothing changes in radio, weather, CTA, calendar, or OAuth.
- This is intended **only for personal, noncommercial use**; before using NPR content on a public or commercial app, review NPR's current feed terms/permissions.

## Testing

1. Confirm `/api/news/headlines` returns HTTP 200 and `headlines` with title/url fields. If 503, it reports unavailable NPR RSS; verify Internet access and try later.
2. Watch the headline change after 5 seconds.
3. Tap it to verify the NPR link opens directly.
4. Verify radio keeps playing throughout, including on your iPad.
5. Temporarily disconnect the Internet after first successful feed; during a running session, previously cached headlines should remain.

Do not commit until you've reviewed `git status`, staged files, and ensured `.env`, OAuth credentials and token files remain ignored. Version is displayed as α6 in header.
