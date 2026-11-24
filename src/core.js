/*
 * Seedbox Card for Home Assistant
 * https://github.com/juju35/ha-seedbox-card
 *
 * Lovelace cards for the torrent clients of Home Assistant core: Transmission, qBittorrent and Deluge.
 * Their entities are resolved through the entity and device registries (platform and translation_key), so the
 * cards work whatever the Home Assistant language or entity ids.
 */

export const VERSION = "__VERSION__";

// Each client: its name (icon tooltip, editor list), the site the icon opens when nothing better is known, and its
// entities by translation_key -> the card's own keys. A switch without translation_key (Deluge's) is `_switch`.
export const SOURCES = {
  transmission: {
    name: "Transmission",
    site: "https://transmissionbt.com",
    keys: {
      transmission_status: "status",
      download_speed: "down",
      upload_speed: "up",
      active_torrents: "active",
      paused_torrents: "paused",
      total_torrents: "total",
      completed_torrents: "completed",
      started_torrents: "started",
      download_dir_free_space: "free",
      total_ratio: "ratio",
      total_download: "down_total",
      total_upload: "up_total",
      on_off: "power",
      turtle_mode: "alt",
    },
  },
  qbittorrent: {
    name: "qBittorrent",
    site: "https://www.qbittorrent.org",
    keys: {
      current_status: "status",
      connection_status: "connection",
      download_speed: "down",
      upload_speed: "up",
      download_speed_limit: "down_limit",
      upload_speed_limit: "up_limit",
      alltime_download: "down_total",
      alltime_upload: "up_total",
      global_ratio: "ratio",
      all_torrents: "total",
      active_torrents: "active",
      inactive_torrents: "inactive",
      paused_torrents: "paused",
      errored_torrents: "errored",
      alternative_speed: "alt",
    },
  },
  deluge: {
    name: "Deluge",
    site: "https://deluge-torrent.org",
    keys: {
      status: "status",
      download_speed: "down",
      upload_speed: "up",
      downloading_count: "downloading",
      seeding_count: "seeding",
      _switch: "power",
    },
  },
};

export const ICONS = {
  // mdi:download-network, the header icon.
  seedbox:
    "M17,3A2,2 0 0,1 19,5V15A2,2 0 0,1 17,17H13V19H14A1,1 0 0,1 15,20H22V22H15A1,1 0 0,1 14,23H10A1,1 0 0,1 9,22H2V20H9A1,1 0 0,1 10,19H11V17H7C5.89,17 5,16.1 5,15V5A2,2 0 0,1 7,3H17M12,14.5L16.5,10H13V6H11V10H7.5L12,14.5Z",
  down: "M9,4H15V12H19.84L12,19.84L4.16,12H9V4Z",
  up: "M15,20H9V12H4.16L12,4.16L19.84,12H15V20Z",
  play: "M8,5.14V19.14L19,12.14L8,5.14Z",
  pause: "M14,19H18V5H14M6,19H10V5H6V19Z",
  power:
    "M16.56,5.44L15.11,6.89C16.84,7.94 18,9.83 18,12A6,6 0 0,1 12,18A6,6 0 0,1 6,12C6,9.83 7.16,7.94 8.88,6.88L7.44,5.44C5.36,6.88 4,9.28 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12C20,9.28 18.64,6.88 16.56,5.44M13,3H11V13H13",
  turtle:
    "M8.47,5.95C8.95,5.67 9.47,5.44 10,5.28V4C10,2.9 10.87,2 11.97,1.97C13.13,2 14,2.9 14,4V5.28C14.53,5.45 15.05,5.67 15.53,5.95L13.93,8.07H10.07L8.47,5.95M19,12C19,12.5 18.95,12.95 18.86,13.4L16.33,12.62L15.14,8.96L16.74,6.85C17.17,7.25 17.55,7.7 17.88,8.2C18.67,8.13 19.43,8.25 20.11,8.59C21.14,9.12 21.84,10.13 22,11.28L19,11.64C19,11.76 19,11.88 19,12M5,12C5,11.88 5,11.76 5,11.65L2,11.28C2.16,10.13 2.86,9.12 3.89,8.59C4.57,8.25 5.34,8.13 6.08,8.26C6.41,7.75 6.79,7.28 7.24,6.87L8.86,8.95L7.67,12.62L5.14,13.4C5.05,12.95 5,12.5 5,12M10.24,9.57H13.76L14.85,12.93L12,15L9.15,12.93L10.24,9.57M8.13,14.05L11.25,16.31V18.96C10.68,18.9 10.13,18.77 9.62,18.58L8.39,21.34C7.33,20.87 6.57,19.9 6.37,18.76C6.23,18 6.35,17.24 6.69,16.56C6.24,16.04 5.87,15.46 5.59,14.82L8.13,14.05M15.87,14.05L18.41,14.82C18.13,15.46 17.76,16.04 17.31,16.56C17.65,17.24 17.77,18 17.64,18.76C17.43,19.9 16.67,20.87 15.61,21.34L14.39,18.58C13.86,18.77 13.33,18.94 12.75,19V16.31L15.87,14.05Z",
  chevron: "M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z",
  search:
    "M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z",
  list: "M7,5H21V7H7V5M7,13V11H21V13H7M4,4.5A1.5,1.5 0 0,1 5.5,6A1.5,1.5 0 0,1 4,7.5A1.5,1.5 0 0,1 2.5,6A1.5,1.5 0 0,1 4,4.5M4,10.5A1.5,1.5 0 0,1 5.5,12A1.5,1.5 0 0,1 4,13.5A1.5,1.5 0 0,1 2.5,12A1.5,1.5 0 0,1 4,10.5M7,19V17H21V19H7M4,16.5A1.5,1.5 0 0,1 5.5,18A1.5,1.5 0 0,1 4,19.5A1.5,1.5 0 0,1 2.5,18A1.5,1.5 0 0,1 4,16.5Z",
  active: "M10,16.5V7.5L16,12M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z",
  paused: "M15,16H13V8H15M11,16H9V8H11M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z",
  completed: "M12 2C6.5 2 2 6.5 2 12S6.5 22 12 22 22 17.5 22 12 17.5 2 12 2M10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z",
  errored: "M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z",
  total: "M18,6H8.83L14.83,12L8.83,18H18V20H6V18L12,12L6,6V4H18V6Z",
  ratio: "M9,3L5,7H8V14H10V7H13M16,17V10H14V17H11L15,21L19,17H16Z",
  downloading: "M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z",
  seeding: "M9,16V10H5L12,3L19,10H15V16H9M5,20V18H19V20H5Z",
  inactive:
    "M6,2H18V8H18V8L14,12L18,16V16H18V22H6V16H6V16L10,12L6,8V8H6V2M16,16.5L12,12.5L8,16.5V20H16V16.5M12,11.5L16,7.5V4H8V7.5L12,11.5M10,6H14V6.75L12,8.75L10,6.75V6Z",
  // mdi:arrow-expand and mdi:arrow-collapse, the mini card's detail button.
  expand: "M10,21V19H6.41L10.91,14.5L9.5,13.09L5,17.59V14H3V21H10M14.5,10.91L19,6.41V10H21V3H14V5H17.59L13.09,9.5L14.5,10.91Z",
  collapse: "M19.5,3.09L15,7.59V4H13V11H20V9H16.41L20.91,4.5L19.5,3.09M4,13V15H7.59L3.09,19.5L4.5,20.91L9,16.41V20H11V13H4Z",
};
