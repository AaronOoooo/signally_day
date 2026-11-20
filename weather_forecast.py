"""Daily forecast for Signally Day; current conditions remain with OpenWeatherMap."""
import math
import time
from collections import OrderedDict
from datetime import datetime
from threading import Lock
from zoneinfo import ZoneInfo

import requests
from flask import jsonify, request


def register_forecast(app):
    cache = OrderedDict()
    lock = Lock()

    @app.get('/api/weather/forecast')
    def daily_forecast():
        try:
            lat = float(request.args.get('lat', '41.8781'))
            lon = float(request.args.get('lon', '-87.6298'))
            if not (-90 <= lat <= 90 and -180 <= lon <= 180):
                raise ValueError()
        except (TypeError, ValueError):
            return jsonify(error='Invalid forecast coordinates.'), 400
        key = (round(lat, 4), round(lon, 4))
        with lock:
            cached = cache.get(key)
            if cached:
                age = time.monotonic() - cached['time']
                today = datetime.now(ZoneInfo(cached['data']['timezone'])).date().isoformat()
                if age < 600 and cached['data']['date'] == today:
                    return jsonify(cached['data'])
            try:
                response = requests.get('https://api.open-meteo.com/v1/forecast', params={
                    'latitude': lat, 'longitude': lon,
                    'daily': 'temperature_2m_max,temperature_2m_min,precipitation_probability_max',
                    'temperature_unit': 'fahrenheit', 'timezone': 'auto', 'forecast_days': 1,
                }, timeout=9)
                response.raise_for_status()
                raw = response.json()
                daily = raw['daily']
                zone = str(raw['timezone'])
                today = datetime.now(ZoneInfo(zone)).date().isoformat()
                if daily['time'][0] != today:
                    raise ValueError('Forecast does not cover today')

                def number(field):
                    value = daily[field][0]
                    if value is None:
                        return None
                    if isinstance(value, bool) or not math.isfinite(float(value)):
                        raise ValueError('Invalid forecast value')
                    return round(float(value))

                high = number('temperature_2m_max')
                low = number('temperature_2m_min')
                precip = number('precipitation_probability_max')
                if high is not None and low is not None and high < low:
                    raise ValueError('Invalid temperature range')
                if precip is not None and not 0 <= precip <= 100:
                    raise ValueError('Invalid precipitation probability')
                data = dict(high=high, low=low, precip=precip, date=today,
                            timezone=zone, source='Open-Meteo')
                cache[key] = {'time': time.monotonic(), 'data': data}
                cache.move_to_end(key)
                while len(cache) > 32:
                    cache.popitem(last=False)
                return jsonify(data)
            except (requests.RequestException, ValueError, TypeError, KeyError, IndexError, OverflowError):
                # Do not label a previous day's forecast as today's.
                return jsonify(error='Daily forecast temporarily unavailable.'), 503
