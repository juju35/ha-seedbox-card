# Changelog

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
