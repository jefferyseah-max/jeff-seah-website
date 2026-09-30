# Static preview server that tells the browser never to cache, so edits always show on reload.
# Usage (from the site root): python scripts/nocache_server.py [port]   (default 5173)
import http.server
import sys


class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


port = int(sys.argv[1]) if len(sys.argv) > 1 else 5173
print(f'Serving {port} with no-store')
http.server.ThreadingHTTPServer(('', port), NoCache).serve_forever()
