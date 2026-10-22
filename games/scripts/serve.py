"""Repository-root preview with enough connection backlog for ES-module browsers."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


class PreviewHandler(SimpleHTTPRequestHandler):
    protocol_version = 'HTTP/1.1'

    def setup(self):
        super().setup()
        self.connection.settimeout(15)


class PreviewServer(ThreadingHTTPServer):
    request_queue_size = 128
    daemon_threads = True


if __name__ == '__main__':
    root = str(Path(__file__).resolve().parents[2])
    print('Preview: http://127.0.0.1:8090', flush=True)
    PreviewServer(('127.0.0.1', 8090), partial(PreviewHandler, directory=root)).serve_forever()
