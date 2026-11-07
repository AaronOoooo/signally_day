"""Signally Day: private LAN dashboard and independent radio player."""
import os
import re
from urllib.parse import urlparse

import requests
from flask import Flask, jsonify, render_template, request

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
    return jsonify(status='ok', app='Signally Day', version='0.1.0-alpha.2')


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


if __name__ == '__main__':
    # LAN development only. Do not forward port 5055 to the internet.
    app.run(host=os.getenv('SIGNALLY_DAY_HOST', '0.0.0.0'),
            port=int(os.getenv('SIGNALLY_DAY_PORT', '5055')), debug=False)
