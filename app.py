"""Signally Day: private LAN dashboard and independent radio player."""
import os
import re
import time
from threading import Lock
from collections import OrderedDict

from dotenv import load_dotenv
from urllib.parse import urlparse

import requests
from flask import Flask, jsonify, render_template, request

load_dotenv()

app = Flask(__name__)
app.json.sort_keys = False
SIGNALLY_BASE = os.getenv('SIGNALLY_BASE_URL', 'https://signallyradio.com').rstrip('/')
RADIO_BROWSER_MIRRORS = [
    'https://de1.api.radio-browser.info',
    'https://nl1.api.radio-browser.info',
    'https://fr1.api.radio-browser.info',
]
UUID_PATTERN = re.compile(r'^[0-9a-fA-F]{8}-[0-9a-fA-F-]{20,40}$')
SESSION = requests.Session()
SESSION.headers.update({'User-Agent': 'SignallyDay/0.1 (+personal dashboard)'})

WEATHER_CACHE = OrderedDict()
WEATHER_LOCK = Lock()
WEATHER_TTL_SECONDS = 600



def valid_station_uuid(value):
    return isinstance(value, str) and bool(UUID_PATTERN.fullmatch(value))


def checked_stream_url(url):
    """Allow ordinary HTTP(S) stream URLs only; never make server-side calls to them."""
    if not isinstance(url, str):
        return ''
    parsed = urlparse(url)
    if parsed.scheme not in ('https', 'http') or not parsed.hostname or parsed.username or parsed.password:
        return ''
    return url


@app.get('/')
def dashboard():
    return render_template('dashboard.html')


@app.get('/health')
def health():
    return jsonify(status='ok', app='Signally Day', version='0.1.0-alpha.3.1')


@app.get('/api/stations/search')
def station_search():
    query = request.args.get('q', '').strip()
    if len(query) < 2 or len(query) > 80:
        return jsonify(error='Enter 2–80 characters to search.'), 400
    for host in RADIO_BROWSER_MIRRORS:
        try:
            response = SESSION.get(
                f'{host}/json/stations/search',
                params={'name': query, 'nameExact': 'false', 'hidebroken': 'true',
                        'limit': 25, 'order': 'votes', 'reverse': 'true'},
                timeout=7,
            )
            response.raise_for_status()
            results = response.json()
            if not isinstance(results, list):
                raise ValueError('Unexpected radio directory response')
            stations = []
            for station in results:
                uuid = station.get('stationuuid')
                if valid_station_uuid(uuid):
                    stations.append({
                        'uuid': uuid,
                        'name': str(station.get('name') or 'Unnamed station')[:130],
                        'country': str(station.get('country') or '')[:50],
                        'tags': str(station.get('tags') or '')[:90],
                    })
            return jsonify(stations=stations)
        except (requests.RequestException, ValueError):
            continue
    return jsonify(error='Station directory is temporarily unavailable.'), 502


@app.get('/api/stations/<uuid>/metadata')
def station_metadata(uuid):
    if not valid_station_uuid(uuid):
        return jsonify(error='Invalid station identifier.'), 400
    try:
        # Only contact the trusted Signally service, never arbitrary user-supplied hosts.
        response = SESSION.get(f'{SIGNALLY_BASE}/metadata/{uuid}', timeout=15)
        response.raise_for_status()
        payload = response.json()
        if not isinstance(payload, dict):
            raise ValueError('Invalid metadata response')
        stream = checked_stream_url(payload.get('streamUrl'))
        if not stream:
            return jsonify(error='Station has no playable stream.'), 502
        graphic = checked_stream_url(payload.get('graphic'))
        result = {
            'uuid': uuid,
            'name': str(payload.get('name') or 'Radio station')[:150],
            'artist': str(payload.get('artist') or '')[:150],
            'song': str(payload.get('song') or '')[:180],
            'graphic': graphic,
            'streamUrl': stream,
        }
        response = jsonify(result)
        response.headers['Cache-Control'] = 'private, max-age=15'
        return response
    except (requests.RequestException, ValueError):
        return jsonify(error='Could not retrieve station information from Signally.'), 502


@app.get('/api/weather/cities')
def weather_cities():
    """Search OpenWeatherMap geocoding without exposing the API key."""
    key = os.getenv('OPENWEATHER_API_KEY', '').strip()
    if not key:
        return jsonify(error='Weather API key is not configured.'), 503
    query = request.args.get('q', '').strip()
    if not 2 <= len(query) <= 80 or any(ord(ch) < 32 for ch in query):
        return jsonify(error='Enter a city name (2–80 characters).'), 400
    try:
        upstream = SESSION.get('https://api.openweathermap.org/geo/1.0/direct',
                               params={'q': query, 'limit': 5, 'appid': key}, timeout=9)
        upstream.raise_for_status()
        raw = upstream.json()
        if not isinstance(raw, list):
            raise ValueError('Unexpected city search response')
        matches = []
        for item in raw[:5]:
            try:
                lat, lon = float(item['lat']), float(item['lon'])
                if not (-90 <= lat <= 90 and -180 <= lon <= 180):
                    continue
                name = str(item.get('name') or '').strip()[:80]
                if not name:
                    continue
                matches.append({'name': name,
                                'state': str(item.get('state') or '')[:70],
                                'country': str(item.get('country') or '')[:3],
                                'lat': round(lat, 5), 'lon': round(lon, 5)})
            except (KeyError, TypeError, ValueError):
                continue
        return jsonify(cities=matches)
    except (requests.RequestException, ValueError):
        return jsonify(error='City search is temporarily unavailable.'), 502


@app.get('/api/weather')
def current_weather():
    """Serve cached weather for validated coordinates; API key stays on the server."""
    key = os.getenv('OPENWEATHER_API_KEY', '').strip()
    if not key:
        return jsonify(error='Weather API key is not configured.'), 503
    try:
        lat = float(request.args.get('lat', '41.8781'))
        lon = float(request.args.get('lon', '-87.6298'))
    except (TypeError, ValueError):
        return jsonify(error='Invalid latitude or longitude.'), 400
    if not (-90 <= lat <= 90 and -180 <= lon <= 180):
        return jsonify(error='Location is outside the valid coordinate range.'), 400
    # Round keys to reduce pointless duplication from small coordinate changes.
    cache_key = (round(lat, 4), round(lon, 4))
    now = time.monotonic()
    with WEATHER_LOCK:
        cached = WEATHER_CACHE.get(cache_key)
        if cached and now - cached['time'] < WEATHER_TTL_SECONDS:
            return jsonify(cached['data'])
        try:
            reply = SESSION.get('https://api.openweathermap.org/data/2.5/weather',
                params={'lat': lat, 'lon': lon, 'units': 'imperial', 'appid': key}, timeout=9)
            if reply.status_code == 401:
                return jsonify(error='OpenWeatherMap rejected the API key.'), 502
            reply.raise_for_status()
            raw = reply.json()
            main, condition = raw['main'], raw['weather'][0]
            data = {'city': str(raw.get('name') or 'Selected city')[:90],
                    'temperature': round(float(main['temp'])),
                    'feels_like': round(float(main['feels_like'])),
                    'description': str(condition.get('description', 'Current conditions'))[:75].capitalize(),
                    'condition_id': int(condition['id']),
                    'humidity': int(main.get('humidity', 0)),
                    'observed_at': int(raw.get('dt', 0))}
            WEATHER_CACHE[cache_key] = {'time': now, 'data': data}
            WEATHER_CACHE.move_to_end(cache_key)
            while len(WEATHER_CACHE) > 32:
                WEATHER_CACHE.popitem(last=False)
            response = jsonify(data)
            response.headers['Cache-Control'] = 'private, max-age=60'
            return response
        except (requests.RequestException, ValueError, TypeError, KeyError, IndexError):
            if cached:
                return jsonify(dict(cached['data'], stale=True))
            return jsonify(error='Weather is temporarily unavailable.'), 502


if __name__ == '__main__':
    # LAN development only. Do not forward port 5055 to the internet.
    app.run(host=os.getenv('SIGNALLY_DAY_HOST', '0.0.0.0'),
            port=int(os.getenv('SIGNALLY_DAY_PORT', '5055')), debug=False)
