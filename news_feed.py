"""Bounded, cached read-only NPR RSS headlines for private noncommercial Signally Day."""
import time
from threading import Lock
from urllib.parse import urlparse
from xml.etree import ElementTree as ET
import requests

FEED_URL = 'https://feeds.npr.org/1001/rss.xml'
TTL_SECONDS = 1800  # fetch every 30 minutes at most
STALE_SECONDS = 6 * 3600  # temporary NPR outage
MAX_FEED_BYTES = 1024 * 1024
_LOCK = Lock()
_CACHE = {'at': 0.0, 'items': []}

class NewsFeedError(Exception):
    pass


def _safe_link(link):
    parsed = urlparse(link)
    host = (parsed.hostname or '').lower()
    if parsed.scheme != 'https' or (host != 'npr.org' and not host.endswith('.npr.org')) or parsed.username or parsed.password:
        return None
    return link


def _parse_headlines(raw):
    try:
        root = ET.fromstring(raw)
    except ET.ParseError as exc:
        raise NewsFeedError('Invalid NPR feed') from exc
    items = []
    seen = set()
    for item in root.findall('./channel/item'):
        title = ' '.join((item.findtext('title') or '').split())[:240]
        link = _safe_link((item.findtext('link') or '').strip())
        if title and link and link not in seen:
            items.append({'title': title, 'url': link})
            seen.add(link)
        if len(items) >= 12:
            break
    if not items:
        raise NewsFeedError('No valid NPR headlines')
    return items


def _download():
    # A single fixed NPR feed is requested; never fetch user-supplied URLs.
    try:
        with requests.get(FEED_URL, stream=True, timeout=(5, 12),
                          headers={'User-Agent': 'SignallyDay/0.1 (personal RSS reader)'}) as response:
            response.raise_for_status()
            if not _safe_link(response.url):
                raise NewsFeedError('Unexpected feed redirect')
            chunks, size = [], 0
            for chunk in response.iter_content(chunk_size=16384):
                if not chunk:
                    continue
                size += len(chunk)
                if size > MAX_FEED_BYTES:
                    raise NewsFeedError('NPR feed exceeded limit')
                chunks.append(chunk)
            return _parse_headlines(b''.join(chunks))
    except requests.RequestException as exc:
        raise NewsFeedError('NPR feed unavailable') from exc


def get_npr_headlines():
    now = time.monotonic()
    with _LOCK:
        items = _CACHE['items']
        age = now - _CACHE['at']
        if items and age < TTL_SECONDS:
            return {'headlines': items, 'stale': False, 'source': 'NPR'}
        try:
            items = _download()
        except NewsFeedError:
            if _CACHE['items'] and age < STALE_SECONDS:
                return {'headlines': _CACHE['items'], 'stale': True, 'source': 'NPR'}
            raise
        _CACHE.update(at=time.monotonic(), items=items)
        return {'headlines': items, 'stale': False, 'source': 'NPR'}
