# Changelog

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
