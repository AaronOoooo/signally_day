# Signally Day — v0.1.0-alpha.1

**Your music. Your news. Your day.**

Phase 1 is a standalone, private-network Flask dashboard designed for an iPad Air 3 in landscape orientation. It does **not** modify the main Signally Radio application.

## What works now
- Live clock and date in America/Chicago time
- Time-based friendly greeting
- Responsive dashboard layout
- Clearly labeled placeholders for radio, 5 favorite stations, weather, CTA arrivals, calendar and NPR headlines
- `/health` endpoint

**Not functional yet:** radio playback, favorites, news rotation, weather, CTA, and calendar. Controls are disabled intentionally until integrated. There is no API key requirement in Phase 1.

## Windows 11 PowerShell setup

Run these commands from the extracted `signally_day_phase1` directory (or from the root of your cloned `signally_day` repository after copying the files there):

```powershell
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python app.py
```

If PowerShell blocks activation, you can **skip activation** and use:

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe app.py
```

On your PC, open `http://127.0.0.1:5055/`.

On the iPad, connect to the **same Wi-Fi** as the PC and open `http://YOUR-PC-LAN-IP:5055/` in Safari. Find your PC's IPv4 address with `ipconfig`. If Windows Firewall asks, allow Python on **Private networks only**. The app binds to all local interfaces so other devices on your LAN can reach it. **Do not port-forward 5055 or expose it to the public Internet**: there is no authentication yet.

For best results rotate the iPad to landscape. Later you can use Safari's Share → Add to Home Screen.

To stop the server, press `Ctrl+C` in PowerShell.

## GitHub first commit

After copying files to the root of the separate `signally_day` repository:

```powershell
git status
git add app.py requirements.txt .gitignore README.md templates static
git commit -m "feat: establish Signally Day Phase 1 dashboard"
git push origin main
```

If your default Git branch is not `main`, replace it with the branch shown by `git branch --show-current`.

## Next phases
1. Radio integration: evaluate direct station streaming versus a scoped API bridge to Signally Radio; avoid duplicating or competing with the main website player.
2. Weather and CTA (using your keys; secrets stay out of Git and browser code).
3. Private calendar integration.
4. NPR headlines from an approved source with five-second **display rotation** (not feed requests every five seconds).
5. Long-running iPad test and personal launch.

## Assets
The source ZIP supplied for analysis excluded image assets, so the Phase 1 page uses a simple CSS/typographic brand placeholder. Once you supply the official Signally logo file, we can replace it without changing the layout.
