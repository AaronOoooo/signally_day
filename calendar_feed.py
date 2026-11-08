"""Read-only Google Calendar events for Signally Day's private LAN dashboard.

OAuth occurs only via authorize_calendar.py on the Windows computer; never via
an HTTP request from the iPad. Only the designated personal calendar is queried.
"""
import os
import time
from datetime import date, datetime, time as dt_time, timedelta
from pathlib import Path
from threading import Lock
from zoneinfo import ZoneInfo

from google.auth.exceptions import RefreshError
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

CHICAGO = ZoneInfo('America/Chicago')
SCOPES = ['https://www.googleapis.com/auth/calendar.events.readonly']
# Explicit ID prevents accidentally querying another account's 'primary' calendar.
PERSONAL_CALENDAR_ID = 'aaron.o.hall@gmail.com'
TOKEN_FILE = Path(__file__).resolve().parent / 'token.json'
CACHE_TTL = 300
_LOCK = Lock()
_CACHE = {'when': 0.0, 'payload': None, 'show_details': None}


class CalendarFeedError(Exception):
    """Safe error description for local UI; no credentials are included."""


def _credentials():
    if not TOKEN_FILE.is_file():
        raise CalendarFeedError('Calendar not authorized yet. Run authorize_calendar.py on Windows.')
    try:
        creds = Credentials.from_authorized_user_file(str(TOKEN_FILE), SCOPES)
        if not creds.valid:
            if creds.expired and creds.refresh_token:
                creds.refresh(Request())
                TOKEN_FILE.write_text(creds.to_json(), encoding='utf-8')
            else:
                raise CalendarFeedError('Calendar authorization expired. Run authorize_calendar.py again.')
        return creds
    except CalendarFeedError:
        raise
    except (ValueError, OSError, RefreshError) as exc:
        raise CalendarFeedError('Calendar authorization needs renewal. Run authorize_calendar.py.') from exc


def _event_datetime(start_data):
    if 'dateTime' in start_data:
        dt = datetime.fromisoformat(start_data['dateTime'].replace('Z', '+00:00'))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=CHICAGO)
        return dt.astimezone(CHICAGO), False
    if 'date' in start_data:
        return datetime.combine(date.fromisoformat(start_data['date']), dt_time.min, CHICAGO), True
    raise ValueError('Event does not have a date')


def _fetch_events(now, show_details):
    try:
        service = build('calendar', 'v3', credentials=_credentials(), cache_discovery=False)
        start_day = now.date()
        # Query only today and tomorrow, including events already in progress.
        from_midnight = datetime.combine(start_day, dt_time.min, CHICAGO)
        to_midnight = datetime.combine(start_day + timedelta(days=2), dt_time.min, CHICAGO)
        entries = []
        token = None
        for _ in range(10):
            response = service.events().list(
                calendarId=PERSONAL_CALENDAR_ID,
                timeMin=from_midnight.isoformat(),
                timeMax=to_midnight.isoformat(),
                singleEvents=True,
                orderBy='startTime',
                maxResults=100,
                pageToken=token,
                fields='nextPageToken,items(status,summary,start,end)',
            ).execute()
            for event in response.get('items', []):
                if event.get('status') == 'cancelled':
                    continue
                try:
                    begins, all_day = _event_datetime(event.get('start') or {})
                    ends, _ = _event_datetime(event.get('end') or {})
                    if ends <= now or begins >= to_midnight:
                        continue
                    # Events spanning today and tomorrow appear under today.
                    day = 'today' if begins.date() <= start_day else 'tomorrow'
                    title = str(event.get('summary') or 'Untitled event').strip()[:120]
                    entries.append({
                        'title': title if show_details else 'Busy',
                        'day': day,
                        'all_day': all_day,
                        'time': 'All day' if all_day else begins.strftime('%I:%M %p').lstrip('0'),
                        'starts_at': begins.isoformat(),
                        'ends_at': ends.isoformat(),
                    })
                except (TypeError, ValueError, KeyError):
                    continue
            token = response.get('nextPageToken')
            if not token:
                break
        entries.sort(key=lambda e: e['starts_at'])
        return {
            'timezone': 'America/Chicago',
            'events': entries[:18],
            'refreshed_at': now.isoformat(),
        }
    except CalendarFeedError:
        raise
    except HttpError as exc:
        if exc.resp.status in (401, 403):
            message = 'Google Calendar access denied or expired. Reauthorize on Windows.'
        elif exc.resp.status == 404:
            message = 'Personal calendar not found for the authorized account.'
        else:
            message = 'Google Calendar is temporarily unavailable.'
        raise CalendarFeedError(message) from exc
    except (OSError, ValueError, RefreshError) as exc:
        raise CalendarFeedError('Could not retrieve Google Calendar events.') from exc


def get_calendar_events():
    show_details = os.getenv('CALENDAR_SHOW_DETAILS', 'true').lower() == 'true'
    now = datetime.now(CHICAGO)
    with _LOCK:
        payload = _CACHE['payload']
        if (payload is not None and _CACHE['show_details'] == show_details
                and time.monotonic() - _CACHE['when'] < CACHE_TTL):
            return payload
        data = _fetch_events(now, show_details)
        _CACHE.update(when=time.monotonic(), payload=data, show_details=show_details)
        return data
