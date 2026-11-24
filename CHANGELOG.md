# Changelog

## 1.1.5 - 2026-11-24

### Maintenance
- The card source is split into ES modules: `src/` (entry `src/index.js`), cut at its sections, with the translations in one file per language (`i18n/<lang>.js`). `scripts/bundle.mjs` concatenates them back, in their original order, into the same single file and per-language files as before; the tests evaluate that bundle.

## 1.1.4 - 2026-11-22

### Performance
- Card picker: the previews are back (`preview: true`), and light. Each card's preview is drawn only once it scrolls into view of Home Assistant's card picker, which otherwise builds the preview of every card at once: until then it holds Home Assistant's state (no render, no history request, no animation). On a dashboard or in the card editor the card is drawn as before.

## 1.1.3 - 2026-11-22

### Performance
- Card picker: the cards no longer ask Home Assistant for a live preview (`preview: false` in `window.customCards`). The picker drew every card at once (history requests, animations), which made the list slow to open; it now shows each card's description instead.

## 1.1.2 - 2026-11-20

### Fixes
- Header icon: only an http(s) address opens in a new tab — a device's `homeassistant://` configuration URL (or a non-web `url`) falls back to the client's website.
- Mini card: the detail button has an accessible name (`aria-label`).
- 24 h history: on a client where nothing changes (no state update), the speed history and an open qBittorrent list are refreshed anyway — checked every minute while the card is on the page, fetched again once stale (5 min, 1 min for the list), drawn only if something changed.

## 1.1.1 - 2026-11-18

### Fixes
- Illustrated header: `auto` now follows the Home Assistant theme alone — a light theme keeps the day picture after sunset, a dark theme still shows the night one.

## 1.1.0 - 2026-11-17

### Features
- Animated illustrated header on the Seedbox Card and the Seedbox Mini Card (90 px): the seedbox in the middle of its swarm of peers over a soil strip, packets flowing in (green) while downloading and out (blue) while seeding, still with a pause sign when paused or idle, red lights when disconnected. The status sits under the title.
- Night picture when the sun is below the horizon or with Home Assistant's dark theme (even while the sun is up), forced with `illustration_theme: day | night`; `illustration: false` keeps the classic header. Both options are in the visual editors. Animations stop with "reduce motion".
- The header icon takes the status colour: green while downloading or seeding, grey when idle or paused (the client's on/off switch off now reads "Paused"), amber when firewalled, red when disconnected.
- On the illustrated header the status is a pill right after the title, in the header icon's colour (*Active* while downloading and seeding, the whole status in its tooltip; beside the title only while the whole title and the pill's whole label fit on that row, measured in the real fonts so in every language, otherwise on its own line under a one-line subtitle, only its dot when even that would not fit above the ground strip and below 200 px; the classic header follows the same rule); the picture steps aside under 300 px. The mini card's detail button is the small frosted round button in the banner's top right corner.

### Fixes
- The 24 h sparklines no longer run under the text: the download / upload tiles draw theirs in a 24 px band of their own under the rate and its total ("3.21 TiB in total"), and the mini card's rate rows behind the bar only, clear of the label and the value.

## 1.0.2 - 2026-11-14

### Fixes
- The mini card's visual editor now offers the full card's options its detail view uses (`show_speeds`, `show_counts`, `show_controls`, `show_torrents`, `expand_torrents`): they could only be set in YAML.

## 1.0.1 - 2026-11-13

### Fixes
- Folding back on a tap elsewhere now works on iOS (Safari and the companion app): a tap on something that is not clickable sent no click to the page, so what a click elsewhere folds (unfolded sections, the detailed view of the mini card, popups) stayed open. The press and the release are caught instead; a slider dragged out of the card and a scroll do not fold anything.
- Leaving the card (another dashboard view, a conditional card hidden) brings it back in its default state.
- A click could do nothing: Home Assistant updates the card several times a second, and a rewrite of the card between the press and the release replaced the element pressed, so that the click was lost. The card is no longer rewritten while a press is in progress; the pending update is drawn right after the click.

## 1.0.0 - 2026-11-13

### Features
- **Seedbox Card** and **Seedbox Mini Card** for the torrent clients of Home Assistant core: Transmission, qBittorrent and Deluge, found through the entity and device registries (several clients, mixed, whatever the language or entity ids).
- Download and upload speeds in decimal units (`kB/s`, `MB/s`), download in green and upload in blue, with qBittorrent's speed limits or the total transferred, and their curves over the last 24 hours (recorder history averaged over 5-minute periods, gaps where data is missing).
- Header status (idle, downloading, seeding, both), qBittorrent's connection when firewalled or disconnected, free space of Transmission's download folder.
- Torrent counters (active, downloading, seeding, paused, inactive, completed, errors, total) and global ratio.
- Resume all / pause all (Transmission, Deluge; pausing asks for confirmation) and alternative speed (Transmission's turtle mode, qBittorrent) buttons.
- Torrents list with progress, status, time left and ratio, a search field, torrents in error first: Transmission's `torrent_info` attribute with resume / pause of each torrent, qBittorrent's `get_torrents` action (read only).
- Mini card: speed and active torrents rows, counters in the footer, detail button switching to the full card and back.
- Visual editors, light and dark themes, 22 languages loaded on demand.
