"""One-time desktop authorization for Signally Day personal Google Calendar.

Run this on your Windows PC, NEVER from the iPad or a Flask web endpoint.
"""
from pathlib import Path
import sys

from google.auth.exceptions import RefreshError
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow

SCOPES = ['https://www.googleapis.com/auth/calendar.events.readonly']
ROOT = Path(__file__).resolve().parent
CREDENTIALS = ROOT / 'credentials.json'
TOKEN = ROOT / 'token.json'


def main():
    if not CREDENTIALS.is_file():
        print('Missing credentials.json in the project root.')
        return 1
    try:
        creds = None
        if TOKEN.is_file():
            creds = Credentials.from_authorized_user_file(str(TOKEN), SCOPES)
        if creds and creds.valid:
            print('Google Calendar is already authorized.')
            return 0
        if creds and creds.expired and creds.refresh_token:
            try:
                creds.refresh(Request())
            except RefreshError:
                creds = None
        if not creds or not creds.valid:
            flow = InstalledAppFlow.from_client_secrets_file(str(CREDENTIALS), SCOPES)
            print('Select aaron.o.hall@gmail.com in the browser. Authorization is read-only.')
            creds = flow.run_local_server(host='localhost', port=0, open_browser=True)
        TOKEN.write_text(creds.to_json(), encoding='utf-8')
        print('Calendar authorization saved locally to token.json (do not commit).')
        return 0
    except Exception as exc:
        print('Authorization failed:', type(exc).__name__)
        print('Check your OAuth desktop client and Google Auth Platform test user.')
        return 1


if __name__ == '__main__':
    sys.exit(main())
