"""Signally Day personal dashboard (Phase 1)."""
import os
from flask import Flask, render_template

app = Flask(__name__)

@app.get('/')
def dashboard():
    return render_template('dashboard.html')

@app.get('/health')
def health():
    return {'status': 'ok', 'app': 'Signally Day', 'version': '0.1.0-alpha.1'}

if __name__ == '__main__':
    # Development only: bind on LAN to test with the iPad.
    app.run(host=os.getenv('SIGNALLY_DAY_HOST', '0.0.0.0'), port=int(os.getenv('SIGNALLY_DAY_PORT', '5055')), debug=False)
