# Live Gift Counter

A small editable browser overlay and control panel for manually counting TikTok LIVE gifts.

## Dependencies

The project uses only Python 3's standard library. There are no Python packages, npm packages, or other project dependencies to install. You will need a modern browser; OBS is only needed to use the browser-source overlay.

## Start on Windows

Open PowerShell in this project folder and run:

```powershell
py -3 .\server.py
```

If the `py` launcher is unavailable but `python` is installed, run:

```powershell
python .\server.py
```

Keep that PowerShell window open. In a browser, visit `http://127.0.0.1:8765/`. To stop the server, press **Ctrl+C** in the PowerShell window. Alternatively, run `Start-Overlay.ps1`, which starts the server in the background, checks that it responds, and opens the control panel.

## Start on macOS or Linux

From the project folder, run:

```sh
python3 server.py
```

Keep that terminal open and visit `http://127.0.0.1:8765/` in a browser. Press **Ctrl+C** in the terminal to stop the server.

## Add to OBS

Add a **Browser Source** with this URL: `http://127.0.0.1:8765/?overlay`. Set the source size to 1920 × 1080. Its background is transparent by default. Enable **Show scenery in OBS** in the controller to put the selected theme's scenic background behind the counter; disable it for a transparent overlay. Keep the local server running while streaming. The control panel and OBS overlay sync through that server, including names, theme, totals, scenery preference, and animation events.

Use the server mode above for OBS streaming and backend events: `/state` and `/gift-event` need the server.

For a quick animation preview without starting the server, you can open `index.html` directly and use the coin buttons or keybinds; the **Mock 100-coin gift** button also runs locally in this mode. This local-file mode does not sync to OBS or accept backend events; use the server instructions above for streaming. Keep the supplied JavaScript, CSS and `assets/` folder together with `index.html` when copying or extracting the project.

## Scenery

The existing theme bar selects both the effects and the scenery. Christmas uses the supplied snowy village image with ambient snowfall; Halloween uses an illuminated moonlit village with leaves and mist; Normal uses a coastal sunset with soft lighting. Images are local files inside `assets/`, so this also works from `file://`. `theme-scenery.css` contains the scenery and readability layers. Image source notes and generation prompts are in `assets/BACKGROUNDS.md`.

If the mock gift reports that the server is unreachable, confirm the server is running and open the page from `http://127.0.0.1:8765/`. Opening `index.html` directly from File Explorer does not start the server and cannot reach `/gift-event`.

## Payout estimate

The starting estimate follows the assumptions supplied by the user: 1,000 coins = £12 and a 60% platform share, leaving a 40% creator share. This gives an estimated £4.80 per 1,000 coins (£0.0048 per coin). These are editable in `controller.js` in the `addCoins` calculation and coin button estimates, and in `server.py` for backend gifts. TikTok payout amounts can vary; this is an estimate, not an official payout quote.

The live total keeps sub-penny amounts internally and displays rounded pounds and pence. For example, five 1-coin presses add £0.024 internally and display as £0.02.

## Keybinds and controls

Defaults are **Alt+1** through **Alt+6** for 1, 10, 100, 1,000, 5,000, and 10,000 coins. Existing saved shortcuts are preserved when upgrading. The new tier uses Alt+6 unless it is already assigned, in which case an unused shortcut is chosen and shown in Keybinds. Click a displayed key to change it; bindings require a modifier to avoid reacting while typing names. The liker and gifter shortcuts default to **Alt+L** and **Alt+G** and focus their fields without changing the page scroll position.

The controller includes undo and reset buttons, editable overlay text, top liker/gifter fields, and a savings goal. The theme bar at the top switches between Christmas (falling snow), Halloween (falling leaves, bats, and pumpkins), and Normal. State is saved locally on this computer.

Gift previews use the same keybind/button path and a serialized queue. Christmas has a present that opens to reveal a star, a snow curtain, a candy cane heist with original vector elves and snowballs, and a lit tree emerging from a magical gift. Halloween's first three tiers are a bat charm, a carved pumpkin spin near the counter, and a dripping pumpkin-face wash. Normal's first three are a glossy water drop/ripple, a surfboard spin, and a full water wash with foam and bubbles. Their larger tiers retain the floating ghosts/haunted pumpkin and surfing/armored lightning warrior scenes. The larger scenes last about 5–7 seconds. The mock gift button is available for backend event testing. The overlay is transparent outside active effects when scenery is disabled; all scenes use CSS/JavaScript and original inline vector artwork, with no prerecorded video assets.

## Gift animation preview and backend interface

Coin buttons and their existing keybinds still use the same add-coins action. That action records a theme and coin tier in a shared queue; `animation-manager.js` plays one scene at a time. `premium-christmas-scenes.js` and its CSS file contain the Christmas artwork and timelines; `premium-other-scenes.js` and its CSS file contain the larger Halloween and normal scenes. Each module exposes `markup(theme,tier)` and `duration(theme,tier)`, with tier indexes 0–4 for the original five coin values and index 5 for 10,000 coins. Missing mappings are logged and skipped safely. The overlay polls the local server, so this also works in OBS's separate browser storage. The **Mock 100-coin gift** control exercises the backend event path.

For a local backend or bridge, send JSON to `POST http://127.0.0.1:8765/gift-event` with `Content-Type: application/json` and a body such as `{"eventId":"unique-id-from-source","coins":100}`. Accepted tiers are 1, 10, 100, 1000, 5000, and 10000. The server rejects invalid and duplicate event IDs and returns HTTP 202 for accepted events. Keep any TikTok connection in that backend/bridge; this overlay does not connect directly to TikTok. Sound effects are synthesized bells, tones, and wind cues. The mute control silences the shared audio output immediately, including cues already scheduled for the active scene. Reduced-motion mode shortens playback and skips sound cues.

## Normal 10,000-coin finale: The Perfect Wave

Select **Normal**, then press the **10,000 coins** button or its displayed shortcut (Alt+6 by default). A sunset swell builds into a curling turquoise wave, a surfer carves across it, and the breaking wave rushes towards the viewer before the foam clears. The effect lasts about 9–10 seconds. Under the current payout estimate, a 10,000-coin press adds **£48.00**. **Preview 10K wave** plays the same queued effect without changing the total or undo history. In server mode the preview also appears in OBS.

The separate `normal-finale.js` / `normal-finale.css` files contain the artwork and timeline. The module exposes the same markup/duration interface as the other scene modules, for Normal tier index 5. All three themes now have a 10,000-coin animation. The existing tier indexes 0–4 remain unchanged. No extra dependency or installation is required. If upgrading from a version before the 10,000-coin tier was added, restart the local server so it accepts the new gift tier. Refresh the controller and OBS browser source after each upgrade.

## Halloween 10,000-coin finale: The Haunted Moon

Select **Halloween**, then press the same **10,000 coins** button or its existing shortcut (Alt+6 by default). A blood-red moon rises through mist, a spectral face appears, and bats spiral around it. Green fissures crack open the moon before a shockwave sends fragments, leaves and mist towards the viewer. The effects clear after about 9–10 seconds. The new `halloween-finale.js` / `halloween-finale.css` module handles Halloween tier index 5.

The existing preview button changes to **Preview 10K moon** when Halloween is selected. It uses the same animation queue without changing your total or undo history, and syncs the preview to OBS in server mode. The coin button/keybind adds the estimated **£48.00** as usual. Low rumble, eerie tones, wing gusts and a moon-crack sound use the shared mute control. Reduced-motion mode shows a brief static title instead of the animated sequence.

## Christmas 10,000-coin finale: The Village Lights Up

Select **Christmas** and use the same 10,000-coin button/shortcut, or **Preview 10K Christmas** to watch without adding money. A snowy village wakes window by window, a shooting star arcs across the sky, a golden star blooms over rippling aurora, and sparkling snow rushes towards the viewer before clearing. The scene lasts 9.8 seconds and lives in `christmas-finale.js` / `christmas-finale.css`.

## Click to edit, currency, animations and live timer

- **Direct editing:** Scroll to **Live preview** on the controller page and click the heading, money caption, appreciation note, names, liker/gifter labels, savings label/target, message or timer label. Type in place; press Enter or click elsewhere to finish, or Escape to cancel. Text stays editable in the OBS source through OBS's **Interact** window. Changes sync through the local server; no name-edit shortcut or scrolling back to the form is needed. The existing form and keybinds still work. Custom headings/messages are remembered separately for each theme.
- **Amounts:** Click the displayed total or savings target and enter a nonnegative number. Editing the total establishes a new starting amount and clears undo history. Invalid amounts keep the previous value. Merely focusing an amount or cancelling leaves its history intact.
- **Currency:** **Currency: £ GBP / $ USD** switches the symbol everywhere, including the total, coin amounts and goal. Per the user's preference, this is a display change only: no conversion rate is applied, and saved amounts/history stay the same. A 1,000-coin gift adds 4.80 in either display mode.
- **Animations:** **Coin animations: on/off** stops active and queued coin effects and their audio. Gifts continue to count while effects are off. Re-enabling effects plays future gifts; gifts received while off do not replay. The scenery and ambient weather have their existing independent setting. The 10K preview is disabled while coin effects are off.
- **Timer:** **Add live timer** starts a saved timer and shows it in the overlay. If already live, use **Live started at** to set the actual start time, or click the timer digits and type an elapsed duration such as `01:25:00`. The clock keeps running across refreshes and syncs to OBS. **Hide live timer** only hides it; **Restart timer** starts it from zero. The timer does not reset the money total.

`controller.js` now contains the controller code previously inline in `index.html`; `studio-controls.css` adds the preview editing, bigger savings label and timer styling. Keep both files with the project when copying it.

## Motion improvements

The requested scenes now use movement within the artwork as well as overall travel: flowing ghost cloth and arms; pumpkin impact recoil and stem follow-through; independently articulated surfers and flexing boards/waves; elf limbs, head, hat and throwing motion; unfolding Christmas-tree branches, swaying ornaments and a springing gift lid. The 100-coin effects have staggered, accelerating drips/curtains in all three themes. Their original tier mappings and scene durations are retained.
