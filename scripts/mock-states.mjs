// Mock Home Assistant registries and states shaped like the Transmission, qBittorrent and Deluge integrations, used
// to render the screenshots and by the tests. Entity ids are in French on purpose: the cards never rely on them.
// Torrent names are public, freely licensed content.

// Registries and states of one integration, with helpers adding a device and an entity to them.
export const mockRegistry = (platform) => {
  const r = { states: {}, entities: {}, devices: {} };
  r.device = (id, name, extra = {}) => (r.devices[id] = { id, name, name_by_user: null, config_entries: [`entry_${id}`], ...extra });
  r.entity = (entity_id, device_id, translation_key, state, attributes = {}) => {
    r.entities[entity_id] = { entity_id, device_id, platform, translation_key: translation_key || null };
    r.states[entity_id] = { entity_id, state: String(state), attributes };
  };
  return r;
};

const MBps = { unit_of_measurement: "MB/s", device_class: "data_rate" };
const GiB = { unit_of_measurement: "GiB", device_class: "data_size" };
const TiB = { unit_of_measurement: "TiB", device_class: "data_size" };

// Transmission: the default mock (screenshots, tests).
const tr = mockRegistry("transmission");
export const { states, entities, devices } = tr;
tr.device("tr", "Seedbox");
const torrents = [
  ["debian-13.1.0-amd64-netinst.iso", 1, "downloading", "62.40", "0:04:12", 0.18],
  ["Big Buck Bunny 4K", 2, "seeding", "100.00", null, 2.41],
  ["ubuntu-24.04.3-desktop-amd64.iso", 3, "downloading", "18.75", "0:27:40", 0.03],
  ["Sintel (2010) 1080p", 4, "seeding", "100.00", null, 1.27],
  ["archlinux-2026.11.01-x86_64.iso", 5, "stopped", "100.00", null, 0.92],
  ["Tears of Steel 4K", 6, "download pending", "0.00", null, 0],
  ["fedora-workstation-43-x86_64.iso", 7, "checking", "45.10", null, 0.11],
];
const info = (list) =>
  Object.fromEntries(
    list.map(([name, id, status, percent_done, eta, ratio]) => [
      name,
      { added_date: "2026-11-10T08:00:00+00:00", percent_done, status, id, ratio, ...(eta ? { eta } : {}) },
    ])
  );
const isActive = (s) => s === "downloading" || s === "seeding";
tr.entity("sensor.seedbox_statut", "tr", "transmission_status", "up_down", { options: ["idle", "up_down", "seeding", "downloading"] });
tr.entity("sensor.seedbox_vitesse_de_telechargement", "tr", "download_speed", "8.42", MBps);
tr.entity("sensor.seedbox_vitesse_d_envoi", "tr", "upload_speed", "1.37", MBps);
tr.entity("sensor.seedbox_torrents_actifs", "tr", "active_torrents", torrents.filter((t) => isActive(t[2])).length, { torrent_info: info(torrents.filter((t) => isActive(t[2]))) });
tr.entity("sensor.seedbox_torrents_en_pause", "tr", "paused_torrents", torrents.filter((t) => t[2] === "stopped").length, { torrent_info: info(torrents.filter((t) => t[2] === "stopped")) });
tr.entity("sensor.seedbox_torrents_total", "tr", "total_torrents", torrents.length, { torrent_info: info(torrents) });
tr.entity("sensor.seedbox_torrents_termines", "tr", "completed_torrents", torrents.filter((t) => t[3] === "100.00").length);
tr.entity("sensor.seedbox_torrents_demarres", "tr", "started_torrents", torrents.filter((t) => t[2] !== "stopped").length);
tr.entity("sensor.seedbox_espace_libre", "tr", "download_dir_free_space", "812.4", GiB);
tr.entity("sensor.seedbox_ratio_total", "tr", "total_ratio", "1.284");
tr.entity("sensor.seedbox_telecharge_total", "tr", "total_download", "3.21", TiB);
tr.entity("sensor.seedbox_envoye_total", "tr", "total_upload", "4.12", TiB);
tr.entity("switch.seedbox_marche", "tr", "on_off", "on");
tr.entity("switch.seedbox_mode_tortue", "tr", "turtle_mode", "off");

// qBittorrent: speed limits, connection status and an errored torrent; the torrents come from get_torrents.
export const qbittorrent = mockRegistry("qbittorrent");
qbittorrent.device("qb", "qBittorrent");
qbittorrent.entity("sensor.qbittorrent_statut", "qb", "current_status", "downloading");
qbittorrent.entity("sensor.qbittorrent_connexion", "qb", "connection_status", "connected");
qbittorrent.entity("sensor.qbittorrent_reception", "qb", "download_speed", "24.6", MBps);
qbittorrent.entity("sensor.qbittorrent_envoi", "qb", "upload_speed", "0.84", MBps);
qbittorrent.entity("sensor.qbittorrent_limite_reception", "qb", "download_speed_limit", "40", MBps);
qbittorrent.entity("sensor.qbittorrent_limite_envoi", "qb", "upload_speed_limit", "2.5", MBps);
qbittorrent.entity("sensor.qbittorrent_total_recu", "qb", "alltime_download", "12.8", TiB);
qbittorrent.entity("sensor.qbittorrent_total_envoye", "qb", "alltime_upload", "9.6", TiB);
qbittorrent.entity("sensor.qbittorrent_ratio", "qb", "global_ratio", "0.75");
qbittorrent.entity("sensor.qbittorrent_tous", "qb", "all_torrents", "5");
qbittorrent.entity("sensor.qbittorrent_actifs", "qb", "active_torrents", "2");
qbittorrent.entity("sensor.qbittorrent_inactifs", "qb", "inactive_torrents", "1");
qbittorrent.entity("sensor.qbittorrent_en_pause", "qb", "paused_torrents", "1");
qbittorrent.entity("sensor.qbittorrent_en_erreur", "qb", "errored_torrents", "1");
qbittorrent.entity("switch.qbittorrent_vitesse_alternative", "qb", "alternative_speed", "on");
// get_torrents response (qbittorrent.helpers.format_torrent).
qbittorrent.torrents = {
  "openSUSE-Tumbleweed-DVD-x86_64.iso": { id: "a1", added_date: "2026-11-12T10:00:00+00:00", percent_done: "71.30", status: "downloading", eta: "00:03:05", ratio: "0.04" },
  "Cosmos Laundromat 1080p": { id: "b2", added_date: "2026-11-11T10:00:00+00:00", percent_done: "100.00", status: "uploading", eta: "None", ratio: "1.92" },
  "linuxmint-22.2-cinnamon-64bit.iso": { id: "c3", added_date: "2026-11-10T10:00:00+00:00", percent_done: "100.00", status: "stalledUP", eta: "None", ratio: "0.66" },
  "Elephants Dream 1080p": { id: "d4", added_date: "2026-11-09T10:00:00+00:00", percent_done: "34.00", status: "missingFiles", eta: "None", ratio: "0.00" },
  "kali-linux-2026.3-installer-amd64.iso": { id: "e5", added_date: "2026-11-08T10:00:00+00:00", percent_done: "100.00", status: "stoppedUP", eta: "None", ratio: "2.05" },
};

// Deluge: speeds in kB/s, downloading and seeding counts, a web UI address and a switch without translation_key.
export const deluge = mockRegistry("deluge");
deluge.device("dl", "Deluge", { configuration_url: "http://192.168.1.20:8112" });
deluge.entity("sensor.deluge_statut", "dl", "status", "seeding_and_downloading");
deluge.entity("sensor.deluge_vitesse_reception", "dl", "download_speed", "3120.5", { unit_of_measurement: "kB/s" });
deluge.entity("sensor.deluge_vitesse_envoi", "dl", "upload_speed", "940.2", { unit_of_measurement: "kB/s" });
deluge.entity("sensor.deluge_en_reception", "dl", "downloading_count", "2");
deluge.entity("sensor.deluge_en_partage", "dl", "seeding_count", "9");
deluge.entity("switch.deluge", "dl", null, "on");
