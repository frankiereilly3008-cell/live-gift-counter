from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import json
import threading
import time
import uuid

ROOT = Path(__file__).resolve().parent
STATE_FILE = ROOT / "live-state.json"
STATE_LOCK = threading.Lock()
COIN_TIERS = {1: 0, 10: 1, 100: 2, 1000: 3, 5000: 4, 10000: 5}

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):
        if self.path == "/state":
            try:
                data = STATE_FILE.read_bytes()
            except FileNotFoundError:
                data = b"{}"
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(data)
            return
        return super().do_GET()

    def do_POST(self):
        if self.path not in ("/state", "/gift-event"):
            self.send_error(404)
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            payload = json.loads(self.rfile.read(length))
            if not isinstance(payload, dict):
                raise ValueError("Payload must be an object")
            with STATE_LOCK:
                if self.path == "/state":
                    state = payload
                else:
                    event_id = payload.get("eventId")
                    coins = payload.get("coins")
                    if not isinstance(event_id, str) or not 1 <= len(event_id) <= 128:
                        raise ValueError("eventId must be a string between 1 and 128 characters")
                    if type(coins) is not int or coins not in COIN_TIERS:
                        raise ValueError("coins must match a configured tier: 1, 10, 100, 1000, 5000, or 10000")
                    try:
                        state = json.loads(STATE_FILE.read_text(encoding="utf-8"))
                    except FileNotFoundError:
                        state = {}
                    seen = state.setdefault("processedEventIds", [])
                    if event_id in seen:
                        self.send_error(409, "Duplicate gift event")
                        return
                    state.setdefault("total", 0)
                    state.setdefault("history", []).append(coins)
                    state["total"] += coins * 12 / 1000 * .4
                    state.setdefault("animationQueue", []).append({"id": str(uuid.uuid4()), "coins": coins, "theme": state.get("theme", "normal"), "tier": COIN_TIERS[coins], "source": "backend", "at": int(time.time() * 1000), "eventId": event_id})
                    state["animationQueue"] = state["animationQueue"][-40:]
                    state["processedEventIds"] = (seen + [event_id])[-500:]
                STATE_FILE.write_text(json.dumps(state), encoding="utf-8")
        except (ValueError, json.JSONDecodeError):
            self.send_error(400, "Invalid request")
            return
        self.send_response(204 if self.path == "/state" else 202)
        self.send_header("Cache-Control", "no-store")
        self.end_headers()

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, format, *args):
        pass

if __name__ == "__main__":
    ThreadingHTTPServer(("127.0.0.1", 8765), Handler).serve_forever()
