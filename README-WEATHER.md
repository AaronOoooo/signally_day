# Signally Day v0.1.0-alpha.3 — Chicago weather

This package updates the working alpha.2 dashboard. It **does not** connect CTA or the calendar.

## Install
1. Stop the Flask server with Ctrl+C.
2. Extract the ZIP into your existing `signally_day` directory, allowing replacement of existing files. Do not delete `.venv` or `.git`.
3. In PowerShell from the project directory:

   ```powershell
   .\.venv\Scripts\python.exe -m pip install -r requirements.txt
   Copy-Item .env.example .env
   notepad .env
   ```

4. Edit `.env` to set `OPENWEATHER_API_KEY` to your real key; remove the placeholder text. Never paste your key into chat or commit `.env`. If you already have an `.env`, **do not overwrite it**: add the variable there instead.
5. Restart: `.\.venv\Scripts\python.exe app.py`
6. Load `http://127.0.0.1:5055` on Windows or `http://YOUR-PC-IP:5055` on iPad.
7. Test `http://127.0.0.1:5055/api/weather`: expect JSON including Chicago temperature, feels_like, description, and humidity, **no API key**.

Weather uses OpenWeatherMap Current Weather Data 2.5 for Chicago coordinates. Values are in Fahrenheit, cached on the server for 10 minutes to conserve API calls. We intentionally do not display the current API's `temp_min`/`temp_max` as today's forecast H/L: those are not daily highs/lows. The weather card instead displays Feels Like and Humidity.

If the key is missing, you'll see a message in the card. If a newly created OpenWeatherMap key returns 401, verify the key and enabled API access in your provider account.

Do not expose the Flask development server on the public internet or forward port 5055.
