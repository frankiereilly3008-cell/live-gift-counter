#!/usr/bin/env python3
"""Local server for the Live Gift Counter browser overlay."""

from __future__ import annotations

import json
import threading
import time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

HOST = "127.0.0.1"
PORT = 8765
ROOT = Path(__file__).resolve().parent
STATE_FILE = ROOT / "gift-counter-state.json"
TIERS = {1, 10, 100, 1000, 5000, 10000}
DEFAULT_STATE = {
    "theme": "normal", "title": "LIVE GIFT COUNTER", "subtitle": "Thanks for the love!",
    "liker": "", "gifter": "", "savingsLabel": "Savings goal", "goal": 500, "totalCoins": 0,
    "muted": True, "currency": "USD", "showScenery": True, "animations": True, "liveTimer": False, "liveTimerAt": 0,
}

lock = threading.RLock()
state = DEFAULT_STATE.copy()
events: list[dict] = []
event_ids: set[str] = set()
next_seq = 1


def load_state() -> None:
    global state, events, event_ids, next_seq
    try:
        data = json.loads(STATE_FILE.read_text(encoding="utf-8"))
        state.update({k: v for k, v in data.get("state", {}).items() if k in DEFAULT_STATE})
        events = data.get("events", [])[-200:]
        event_ids = set(data.get("eventIds", []))
        event_ids.update(str(e["eventId"]) for e in events if "eventId" in e)
        next_seq = max((int(e.get("seq", 0)) for e in events), default=0) + 1
    except (OSError, ValueError, TypeError):
        pass


def persist() -> None:
    STATE_FILE.write_text(json.dumps({"state": state, "events": events[-200:], "eventIds": sorted(event_ids)}, ensure_ascii=False), encoding="utf-8")


def snapshot(after: int = 0) -> dict:
    with lock:
        return {"state": state.copy(), "events": [e.copy() for e in events if int(e.get("seq", 0)) > after], "latestSeq": next_seq - 1}


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, fmt, *args):
        print(f"[{self.log_date_time_string()}] {args[0]}")

    def send_json(self, status: int, payload: dict):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def read_json(self):
        length = int(self.headers.get("Content-Length", "0"))
        if length <= 0 or length > 65536:
            raise ValueError("Request body must be between 1 and 65536 bytes")
        data = json.loads(self.rfile.read(length).decode("utf-8"))
        if not isinstance(data, dict):
            raise ValueError("JSON body must be an object")
        return data

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/state":
            try:
                from urllib.parse import parse_qs
                query = parse_qs(parsed.query)
                # New clients synchronize current data without replaying saved effects.
                after = max(0, int(query.get("after", [str(next_seq - 1)])[0]))
                self.send_json(200, snapshot(after))
            except ValueError:
                self.send_json(400, {"error": "Invalid event cursor"})
            return
        if parsed.path == "/health":
            self.send_json(200, {"ok": True})
            return
        if parsed.path == "/":
            self.path = "/index.html"
        super().do_GET()

    def do_POST(self):
        global next_seq
        parsed = urlparse(self.path)
        if parsed.path not in ("/state", "/gift-event"):
            self.send_json(404, {"error": "Not found"})
            return
        try:
            payload = self.read_json()
        except (ValueError, json.JSONDecodeError, UnicodeDecodeError) as exc:
            self.send_json(400, {"error": str(exc)})
            return

        if parsed.path == "/state":
            incoming = payload.get("state")
            if not isinstance(incoming, dict):
                self.send_json(400, {"error": "Expected a state object"})
                return
            with lock:
                for key in DEFAULT_STATE:
                    if key in incoming:
                        state[key] = incoming[key]
                state["theme"] = state["theme"] if state["theme"] in ("normal", "christmas", "halloween") else "normal"
                state["totalCoins"] = max(0, int(state["totalCoins"]))
                state["goal"] = max(1, int(state["goal"]))
                persist()
                result = snapshot()
            self.send_json(200, result)
            return

        event_id = payload.get("eventId")
        coins = payload.get("coins")
        if not isinstance(event_id, str) or not event_id.strip() or len(event_id) > 200:
            self.send_json(400, {"error": "eventId must be a non-empty string of at most 200 characters"})
            return
        if isinstance(coins, bool) or not isinstance(coins, int) or coins not in TIERS:
            self.send_json(400, {"error": "coins must be one of 1, 10, 100, 1000, 5000, or 10000"})
            return
        with lock:
            if event_id in event_ids:
                self.send_json(409, {"error": "Duplicate eventId", "duplicate": True})
                return
            event = {"eventId": event_id, "coins": coins, "theme": state["theme"], "seq": next_seq, "createdAt": time.time()}
            next_seq += 1
            event_ids.add(event_id)
            events.append(event)
            if len(events) > 200:
                events.pop(0)
            state["totalCoins"] = max(0, int(state["totalCoins"])) + coins
            persist()
            result = snapshot(event["seq"] - 1)
        self.send_json(202, result)


def main():
    load_state()
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"Live Gift Counter running at http://{HOST}:{PORT}/")
    print("Press Ctrl+C to stop the server.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server…")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
