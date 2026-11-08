# Signally Day v0.1.0-alpha.7.1 — YouTube search

## Before install
- Enable **YouTube Data API v3** in your existing Google Cloud project `signally-day`.
- Create a new **API key** (not OAuth credentials); restrict it to the **YouTube Data API v3** under API restrictions. Because requests originate from Python on your own PC, don't set a website/referrer restriction. You may optionally use an IP restriction only if your public IP is stable. Keep the key private.
- Add `YOUTUBE_API_KEY=your_key_here` to the existing `.env`. Do **not** add it to `.env.example` or commit it. Verify `.env` is ignored.

## Install
1. Commit or back up your current working alpha.7 files first. Work on `v0.1.0-alpha.7` branch.
2. Stop Flask with Ctrl+C.
3. Merge `app.py`, `templates/`, and `static/` from this ZIP into your repository root, replacing matching files. **Do not touch** `.env`, `credentials.json`, `token.json`, `.git` or `.venv`.
4. Run ` .\.venv\Scripts\python.exe app.py ` in PowerShell.
5. Reload Signally Day in Windows and on iPad. If it still shows older assets, hard-refresh.

## How to use
1. Click **Search** in YouTube card; type e.g. `Charlie Parker jazz documentary`.
2. Click **Search** to get up to 10 thumbnails, titles and channels, then tap one.
3. Tap **Play** in the embedded video. Playback doesn't autoplay. Radio should pause when video starts; starting radio should pause YouTube.
4. Hide pauses video; Show restores its frame. The chosen video persists in each browser's local storage.
5. Pasting a link is still available under **Have a YouTube link?**.

## Troubleshooting
- `http://127.0.0.1:5055/api/youtube/search?q=jazz` returns `videos` or a JSON error (never returns the API key).
- `503`: Missing key, API not enabled, restriction mismatch, or quota exhausted. The response has a generic error.
- Some videos block embedding despite being returned by search. Use Open on YouTube.
- Search only fires when you press Search, not on each keystroke, and identical queries are cached 15 minutes to conserve quota. Google documents a default 100 search calls per day; check the Console for your actual quota.
- Keep port 5055 private to your home Wi-Fi. Your dashboard and personal calendar endpoints have no login.

## Test before committing
Check video thumbnails, click-to-load, iPad touch, radio-video pausing, Hide/Show, saved selection, weather, CTA, calendar, NPR. Review `git status` and `git diff --cached --name-only` for secrets.
