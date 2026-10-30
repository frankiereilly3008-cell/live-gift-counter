# Live Gift Counter

A small editable browser overlay and control panel for manually counting TikTok LIVE gifts. The project uses only Python 3's standard library. It has no Python, npm, or other project dependencies. Use a modern browser; OBS is only needed for the browser-source overlay.

## Start on Windows

Open PowerShell in this folder and run:

```powershell
py -3 .\server.py
```

If the `py` launcher is unavailable but `python` is installed, run `python .\server.py` instead. Keep the PowerShell window open and visit <http://127.0.0.1:8765/>. Press **Ctrl+C** to stop the server. You can also run `Start-Overlay.ps1` to launch the server in the background, wait for its health check, and open the control panel.

## Start on macOS or Linux

From this folder, run:

```sh
python3 server.py
```

Keep the terminal open and visit <http://127.0.0.1:8765/>. Press **Ctrl+C** to stop the server.

## Add to OBS

Add a **Browser Source** with this URL: <http://127.0.0.1:8765/?overlay>. Set the source size to 1920 × 1080. The background is transparent. Keep the local server running while streaming. The controller and OBS overlay sync through the local server, including names, theme, totals, goal, and gift animation events.

Do not open `index.html` directly from File Explorer. The page needs the local server for `/state` and `/gift-event`. If a mock gift reports that the server is unreachable, confirm the server is running and use <http://127.0.0.1:8765/>.

## Payout estimate

The estimate uses the supplied assumptions: 1,000 coins = £12 and a 60% platform share, leaving 40% for the creator. That gives £4.80 per 1,000 coins (£0.0048 per coin). Amounts keep sub-penny precision internally and display rounded to pounds and pence. For example, five 1-coin presses add £0.024 and display as £0.02. This is an estimate, not an official TikTok payout quote; actual payouts can vary.

## Controls

- Alt+1 through Alt+5 add 1, 10, 100, 1,000, and 5,000 coins. Click a displayed shortcut to change it; a modifier key is required so shortcuts do not fire while typing names.
- Alt+L and Alt+G focus the top liker and top gifter fields without changing page scroll position. Their shortcuts can also be changed.
- Use **Undo last** and **Reset total** to correct the count. Edit the headline, message, top liker/gifter, and savings goal in the control panel. State is saved to `gift-counter-state.json` on this computer.
- The theme bar switches between Normal, Christmas (falling snow), and Halloween (falling leaves, bats, and pumpkins). Sound effects are short synthesized tones and can be muted in the controller.
- Gift effects run through a serialized queue. The 10-coin tier spins a themed gift; 100 coins creates a broad sweep; 1,000 coins plays a reveal; and 5,000 coins plays a larger spectacle. The overlay stays transparent outside its content and active effects. Animations are created with CSS and JavaScript, with no prerecorded video.
- **Mock 100-coin gift** exercises the backend event path.

## Backend event interface

For a local backend or bridge, send JSON to `POST http://127.0.0.1:8765/gift-event` with `Content-Type: application/json` and a body such as:

```json
{"eventId":"unique-id-from-source","coins":100}
```

Accepted tiers are 1, 10, 100, 1000, and 5000. The server rejects invalid and duplicate event IDs and returns HTTP 202 for accepted events. Keep any TikTok connection in that backend/bridge; this overlay does not connect directly to TikTok.
