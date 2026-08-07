"""
furlong-scanner HTTP shim — POST /scan with raw file bytes; responds with a
JSON verdict from clamd's INSTREAM protocol. Stateless: bytes are streamed to
clamd and discarded; nothing touches disk, nothing is logged beyond verdicts.

  200 {"clean": true}
  200 {"clean": false, "signature": "Eicar-Signature"}
  503 {"error": "scanner-unavailable"}   (clamd not ready)

GET /healthz returns 200 once clamd answers PING — used as the readiness probe.
"""

import json
import os
import socket
import struct
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

CLAMD_ADDR = ("127.0.0.1", 3310)
CHUNK = 64 * 1024
MAX_BYTES = 55 * 1024 * 1024  # slightly above the app's 50MB cap


def clamd_ping() -> bool:
    try:
        with socket.create_connection(CLAMD_ADDR, timeout=5) as s:
            s.sendall(b"zPING\0")
            return s.recv(64).startswith(b"PONG")
    except OSError:
        return False


def scan_stream(handler: BaseHTTPRequestHandler, length: int):
    with socket.create_connection(CLAMD_ADDR, timeout=120) as s:
        s.sendall(b"zINSTREAM\0")
        remaining = length
        while remaining > 0:
            chunk = handler.rfile.read(min(CHUNK, remaining))
            if not chunk:
                break
            remaining -= len(chunk)
            s.sendall(struct.pack("!I", len(chunk)) + chunk)
        s.sendall(struct.pack("!I", 0))
        verdict = s.recv(512).decode("utf-8", "replace").strip("\0").strip()
    # e.g. "stream: OK" | "stream: Eicar-Signature FOUND"
    if verdict.endswith("OK"):
        return {"clean": True}
    if verdict.endswith("FOUND"):
        sig = verdict.split(":", 1)[1].rsplit("FOUND", 1)[0].strip()
        return {"clean": False, "signature": sig}
    return {"error": f"unexpected-verdict:{verdict[:120]}"}


class Handler(BaseHTTPRequestHandler):
    server_version = "furlong-scanner/1.0"

    def log_message(self, *_args):  # verdicts only; no request logging
        pass

    def _json(self, code: int, payload: dict):
        body = json.dumps(payload).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path == "/healthz":
            self._json(200 if clamd_ping() else 503, {"ok": clamd_ping()})
        else:
            self._json(404, {"error": "not-found"})

    def do_POST(self):
        if self.path != "/scan":
            return self._json(404, {"error": "not-found"})
        length = int(self.headers.get("Content-Length") or 0)
        if length <= 0 or length > MAX_BYTES:
            return self._json(400, {"error": "invalid-length"})
        if not clamd_ping():
            return self._json(503, {"error": "scanner-unavailable"})
        try:
            result = scan_stream(self, length)
        except OSError:
            return self._json(503, {"error": "scanner-unavailable"})
        self._json(200 if "clean" in result else 502, result)


if __name__ == "__main__":
    # Wait for clamd to load its database (baked at build; loads in seconds).
    for _ in range(120):
        if clamd_ping():
            break
        time.sleep(1)
    port = int(os.environ.get("PORT", "8080"))
    ThreadingHTTPServer(("0.0.0.0", port), Handler).serve_forever()
