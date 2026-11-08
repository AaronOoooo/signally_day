"""Signally Day: private LAN dashboard and independent radio player."""
import os
import re
import time
from threading import Lock
from collections import OrderedDict
from datetime import datetime
from zoneinfo import ZoneInfo

from dotenv import load_dotenv
from urllib.parse import urlparse

import requests
from flask import Flask, jsonify, render_template, request
from calendar_feed import get_calendar_events, CalendarFeedError
from news_feed import get_npr_headlines, NewsFeedError

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
CTA_CACHE = {}
CTA_LOCK = Lock()
CTA_TTL_SECONDS = 25



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
    return jsonify(status='ok', app='Signally Day', version='0.1.0-alpha.6')


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



@app.get('/api/cta/arrivals')
def cta_arrivals():
    """Server-side proxy for official CTA Bus Tracker predictions; never expose API key."""
    key = os.getenv('CTA_API_KEY', '').strip()
    if not key:
        return jsonify(error='CTA API key is not configured.'), 503
    stop = request.args.get('stop', '1563').strip()
    if not stop.isascii() or not stop.isdecimal() or not (1 <= len(stop) <= 6):
        return jsonify(error='Enter a valid numeric CTA stop ID.'), 400
    now = time.monotonic()
    with CTA_LOCK:
        cached = CTA_CACHE.get(stop)
        if cached and now - cached['time'] < CTA_TTL_SECONDS:
            return jsonify(cached['data'])
    try:
        upstream = SESSION.get('https://www.ctabustracker.com/bustime/api/v3/getpredictions',
            params={'key': key, 'stpid': stop, 'format': 'json', 'top': 6}, timeout=10)
        upstream.raise_for_status()
        payload = upstream.json()
        envelope = payload.get('bustime-response') if isinstance(payload, dict) else None
        if not isinstance(envelope, dict):
            raise ValueError('Unexpected CTA response')
        errors = envelope.get('error') or []
        if isinstance(errors, dict):
            errors = [errors]
        if errors:
            first = errors[0]
            code = str(first.get('rt', '')) if isinstance(first, dict) else ''
            message = str(first.get('msg', '')) if isinstance(first, dict) else ''
            # Never pass upstream key or request URLs through to the browser.
            if 'No service scheduled' in message or 'No arrival times' in message or 'No predictions' in message:
                arrivals = []
            elif 'Invalid API key' in message or 'Invalid key' in message:
                return jsonify(error='CTA rejected the API key.'), 502
            elif message:
                return jsonify(error='CTA Bus Tracker: ' + message[:100]), 502
            else:
                arrivals = []
        else:
            arrivals = envelope.get('prd') or []
        if isinstance(arrivals, dict):
            arrivals = [arrivals]
        if not isinstance(arrivals, list):
            raise ValueError('Invalid predictions list')
        result = []
        stop_name = 'Indiana & 31st Street (Northbound)' if stop == '1563' else 'CTA Stop ' + stop
        for item in arrivals[:6]:
            if not isinstance(item, dict):
                continue
            destination = str(item.get('des') or 'Destination unavailable')[:70]
            route = str(item.get('rt') or '?')[:12]
            countdown = str(item.get('prdctdn') or '').strip().upper()
            if not (countdown.isdecimal() or countdown == 'DUE'):
                continue
            stop_name = str(item.get('stpnm') or stop_name)[:100]
            # CTA timestamps are Chicago-local (YYYYMMDD HH:MM), not UTC.
            # Return an offset-aware ISO timestamp so the iPad can render
            # the arrival clock time correctly in any time zone.
            predicted_at = None
            raw_time = str(item.get('prdtm') or '').strip()
            if raw_time:
                try:
                    local_dt = datetime.strptime(raw_time, '%Y%m%d %H:%M')
                    predicted_at = local_dt.replace(tzinfo=ZoneInfo('America/Chicago')).isoformat()
                except ValueError:
                    pass
            result.append({'route': route, 'destination': destination,
                           'minutes': 0 if countdown == 'DUE' else int(countdown),
                           'due': countdown == 'DUE',
                           'arrival_time': predicted_at,
                           'delayed': str(item.get('dly') or '').lower() == 'true'})
        result.sort(key=lambda x: x['minutes'])
        data = {'stop_id': stop, 'stop_name': stop_name, 'arrivals': result[:3]}
        with CTA_LOCK:
            CTA_CACHE[stop] = {'time': time.monotonic(), 'data': data}
            if len(CTA_CACHE) > 32:
                oldest = min(CTA_CACHE, key=lambda s: CTA_CACHE[s]['time'])
                del CTA_CACHE[oldest]
        return jsonify(data)
    except (requests.RequestException, ValueError, TypeError, KeyError):
        if cached:
            return jsonify(dict(cached['data'], stale=True))
        return jsonify(error='CTA arrivals are temporarily unavailable.'), 502


@app.get('/api/calendar/events')
def calendar_events():
    """Private-LAN read-only calendar endpoint; never return the iCal feed URL."""
    try:
        data = get_calendar_events()
        reply = jsonify(data)
        reply.headers['Cache-Control'] = 'private, no-store'
        return reply
    except CalendarFeedError as exc:
        # Deliberately avoid logging or returning the secret feed URL.
        return jsonify(error=str(exc)), 503

@app.get('/api/news/headlines')
def npr_headlines():
    """NPR headlines for private personal use; no feed configuration exposed."""
    try:
        result = get_npr_headlines()
        reply = jsonify(result)
        reply.headers['Cache-Control'] = 'private, no-store'
        return reply
    except NewsFeedError:
        return jsonify(error='NPR headlines are temporarily unavailable.'), 503




# YouTube Data API search: server-only API key, short cache to conserve quota.
_YOUTUBE_CACHE = OrderedDict()
_YOUTUBE_LOCK = Lock()
_YOUTUBE_TTL = 15 * 60


@app.get('/api/youtube/search')
def youtube_search():
    key = os.getenv('YOUTUBE_API_KEY', '').strip()
    if not key:
        return jsonify(error='YouTube search is not configured. Add YOUTUBE_API_KEY to .env.'), 503
    query = request.args.get('q', '').strip()
    if not (2 <= len(query) <= 100) or any(ord(ch) < 32 for ch in query):
        return jsonify(error='Enter a search phrase of 2–100 characters.'), 400
    normalized = ' '.join(query.lower().split())
    now = time.monotonic()
    with _YOUTUBE_LOCK:
        cached = _YOUTUBE_CACHE.get(normalized)
        if cached and now - cached['when'] < _YOUTUBE_TTL:
            _YOUTUBE_CACHE.move_to_end(normalized)
            return jsonify(cached['data'])
    try:
        resp = SESSION.get('https://www.googleapis.com/youtube/v3/search',
            params={'part': 'snippet', 'q': query, 'type': 'video', 'maxResults': 10,
                    'videoEmbeddable': 'true', 'videoSyndicated': 'true',
                    'safeSearch': 'moderate', 'key': key}, timeout=12)
        if resp.status_code in (400, 403, 429):
            return jsonify(error='YouTube search was rejected or its daily limit was reached. Check the Google Cloud API settings.'), 503
        resp.raise_for_status()
        payload = resp.json()
        videos = []
        for item in payload.get('items', []):
            if not isinstance(item, dict):
                continue
            ident = item.get('id') or {}
            snippet = item.get('snippet') or {}
            video_id = ident.get('videoId', '') if isinstance(ident, dict) else ''
            if not re.fullmatch(r'[A-Za-z0-9_-]{11}', video_id):
                continue
            thumbs = snippet.get('thumbnails') or {}
            thumb = (thumbs.get('medium') or thumbs.get('default') or {}).get('url', '')
            if not isinstance(thumb, str) or not thumb.startswith('https://'):
                thumb = ''
            videos.append({'id': video_id,
                           'title': str(snippet.get('title') or 'Untitled video')[:180],
                           'channel': str(snippet.get('channelTitle') or 'YouTube')[:90],
                           'thumbnail': thumb})
        data = {'videos': videos}
        with _YOUTUBE_LOCK:
            _YOUTUBE_CACHE[normalized] = {'when': now, 'data': data}
            _YOUTUBE_CACHE.move_to_end(normalized)
            while len(_YOUTUBE_CACHE) > 60:
                _YOUTUBE_CACHE.popitem(last=False)
        reply = jsonify(data)
        reply.headers['Cache-Control'] = 'private, no-store'
        return reply
    except (requests.RequestException, ValueError, TypeError):
        return jsonify(error='YouTube search is temporarily unavailable.'), 502

if __name__ == '__main__':
    # LAN development only. Do not forward port 5055 to the internet.
    app.run(host=os.getenv('SIGNALLY_DAY_HOST', '0.0.0.0'),
            port=int(os.getenv('SIGNALLY_DAY_PORT', '5055')), debug=False)
