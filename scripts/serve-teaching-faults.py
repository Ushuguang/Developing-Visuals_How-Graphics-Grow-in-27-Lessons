"""Local-only fault server for browser QA; never used by GitHub Pages.

python scripts/serve-teaching-faults.py --port 8845 --fault d3
python scripts/serve-teaching-faults.py --port 8846 --fault csv
For the CSV retry test, GET /__allow_csv after observing the failure message.
"""
import argparse
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlsplit

parser = argparse.ArgumentParser()
parser.add_argument('--port', type=int, required=True)
parser.add_argument('--fault', choices=['d3', 'csv'], required=True)
args = parser.parse_args()
root = Path(__file__).resolve().parent.parent
allow_csv = False

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=str(root), **kw)

    def do_GET(self):
        global allow_csv
        path = urlsplit(self.path).path
        if path == '/__allow_csv':
            allow_csv = True
            self.send_response(200); self.end_headers(); self.wfile.write(b'CSV retry enabled'); return
        if path == '/unavailable-d3.js' or (args.fault == 'csv' and not allow_csv and path.endswith('/newstudent.csv')):
            self.send_error(503, 'Intentional local QA fault'); return
        if args.fault == 'd3' and path.startswith('/lesson-') and path.endswith('/lesson.js'):
            source = (root / path.lstrip('/')).read_bytes().replace(b'https://cdn.jsdelivr.net/npm/d3@7/+esm', b'../unavailable-d3.js')
            self.send_response(200); self.send_header('Content-Type', 'text/javascript; charset=utf-8'); self.end_headers(); self.wfile.write(source); return
        super().do_GET()

ThreadingHTTPServer(('127.0.0.1', args.port), Handler).serve_forever()
