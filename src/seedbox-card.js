/*
 * Seedbox Card for Home Assistant
 * https://github.com/juju35/ha-seedbox-card
 *
 * Lovelace cards for the torrent clients of Home Assistant core: Transmission, qBittorrent and Deluge.
 * Their entities are resolved through the entity and device registries (platform and translation_key), so the
 * cards work whatever the Home Assistant language or entity ids.
 */

const VERSION = "__VERSION__";

// Each client: its name (icon tooltip, editor list), the site the icon opens when nothing better is known, and its
// entities by translation_key -> the card's own keys. A switch without translation_key (Deluge's) is `_switch`.
const SOURCES = {
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

const ICONS = {
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

const STRINGS = {
  en: {
    download: "Download",
    upload: "Upload",
    torrents: "Torrents",
    active: "Active",
    paused: "Paused",
    total: "Total",
    completed: "Completed",
    downloading: "Downloading",
    seeding: "Seeding",
    inactive: "Inactive",
    errored: "Errors",
    ratio: "Ratio",
    free: "{size} free",
    limit: "Limit {rate}",
    transferred: "{size} in total",
    status_idle: "Idle",
    status_downloading: "Downloading",
    status_seeding: "Seeding",
    status_up_down: "Downloading and seeding",
    conn_firewalled: "Firewalled",
    conn_disconnected: "Disconnected",
    state_unavailable: "Unavailable",
    state_unknown: "Unknown",
    t_downloading: "Downloading",
    t_seeding: "Seeding",
    t_paused: "Paused",
    t_queued: "Queued",
    t_checking: "Checking",
    t_stalled: "Stalled",
    t_error: "Error",
    eta: "{time} left",
    start_all: "Resume all",
    stop_all: "Pause all",
    alt_speed: "Alternative speed",
    resume: "Resume",
    pause: "Pause",
    cancel: "Cancel",
    confirm_stop_all: "Pause every torrent of {name}?",
    confirm_pause: "Pause {name}?",
    search: "Search torrents",
    no_match: "No matching torrent",
    no_torrent: "No torrent",
    no_client: "No torrent client found. Is the Transmission, qBittorrent or Deluge integration installed?",
    unknown_client: "Torrent client not found",
    no_registry: "This card needs Home Assistant 2024.8 or later.",
    zoom_in: "Show the full card",
    zoom_out: "Back to the compact view",
    // Editor
    client: "Torrent client",
    title: "Title (optional, defaults to the client name)",
    url: "URL opened by the icon (optional, detected from the integration)",
    show_title: "Show title",
    show_subtitle: "Show subtitle",
    show_speeds: "Show download and upload speeds",
    show_history: "Show the 24 h speed history",
    show_counts: "Show torrent counts",
    show_controls: "Show resume / pause and alternative speed buttons",
    show_torrents: "Show the torrents list",
    expand_torrents: "Torrents list expanded by default",
    show_footer: "Show torrent counts in the footer",
    zoom: "Detail button",
    zoom_helper: "Switches the mini card to the full card and back",
    language: "Language",
    lang_auto: "Automatic",
  },
  fr: {
    download: "Réception",
    upload: "Envoi",
    torrents: "Torrents",
    active: "Actifs",
    paused: "En pause",
    total: "Total",
    completed: "Terminés",
    downloading: "En réception",
    seeding: "En partage",
    inactive: "Inactifs",
    errored: "Erreurs",
    ratio: "Ratio",
    free: "{size} libres",
    limit: "Limite {rate}",
    transferred: "{size} au total",
    status_idle: "Inactif",
    status_downloading: "Téléchargement",
    status_seeding: "Partage",
    status_up_down: "Téléchargement et partage",
    conn_firewalled: "Derrière un pare-feu",
    conn_disconnected: "Déconnecté",
    state_unavailable: "Indisponible",
    state_unknown: "Inconnu",
    t_downloading: "Téléchargement",
    t_seeding: "Partage",
    t_paused: "En pause",
    t_queued: "En file d'attente",
    t_checking: "Vérification",
    t_stalled: "Bloqué",
    t_error: "Erreur",
    eta: "{time} restant",
    start_all: "Tout reprendre",
    stop_all: "Tout mettre en pause",
    alt_speed: "Vitesse alternative",
    resume: "Reprendre",
    pause: "Pause",
    cancel: "Annuler",
    confirm_stop_all: "Mettre en pause tous les torrents de {name} ?",
    confirm_pause: "Mettre en pause {name} ?",
    search: "Rechercher un torrent",
    no_match: "Aucun torrent correspondant",
    no_torrent: "Aucun torrent",
    no_client: "Aucun client torrent trouvé. L'intégration Transmission, qBittorrent ou Deluge est-elle installée ?",
    unknown_client: "Client torrent introuvable",
    no_registry: "Cette carte nécessite Home Assistant 2024.8 ou plus récent.",
    zoom_in: "Afficher la carte complète",
    zoom_out: "Revenir à la vue compacte",
    client: "Client torrent",
    title: "Titre (facultatif, nom du client par défaut)",
    url: "Adresse ouverte par l'icône (facultative, détectée depuis l'intégration)",
    show_title: "Afficher le titre",
    show_subtitle: "Afficher le sous-titre",
    show_speeds: "Afficher les débits de réception et d'envoi",
    show_history: "Afficher l'historique des débits sur 24 h",
    show_counts: "Afficher le nombre de torrents",
    show_controls: "Afficher les boutons reprendre / pause et vitesse alternative",
    show_torrents: "Afficher la liste des torrents",
    expand_torrents: "Liste des torrents dépliée par défaut",
    show_footer: "Afficher le nombre de torrents en pied de carte",
    zoom: "Bouton détail",
    zoom_helper: "Bascule la mini-carte vers la carte complète et inversement",
    language: "Langue",
    lang_auto: "Automatique",
  },
  de: {
    download: "Download",
    upload: "Upload",
    torrents: "Torrents",
    active: "Aktiv",
    paused: "Pausiert",
    total: "Gesamt",
    completed: "Fertig",
    downloading: "Lädt herunter",
    seeding: "Seedet",
    inactive: "Inaktiv",
    errored: "Fehler",
    ratio: "Verhältnis",
    free: "{size} frei",
    limit: "Limit {rate}",
    transferred: "{size} insgesamt",
    status_idle: "Untätig",
    status_downloading: "Lädt herunter",
    status_seeding: "Seedet",
    status_up_down: "Lädt herunter und seedet",
    conn_firewalled: "Hinter Firewall",
    conn_disconnected: "Getrennt",
    state_unavailable: "Nicht verfügbar",
    state_unknown: "Unbekannt",
    t_downloading: "Lädt herunter",
    t_seeding: "Seedet",
    t_paused: "Pausiert",
    t_queued: "Warteschlange",
    t_checking: "Wird geprüft",
    t_stalled: "Blockiert",
    t_error: "Fehler",
    eta: "noch {time}",
    start_all: "Alle fortsetzen",
    stop_all: "Alle pausieren",
    alt_speed: "Alternative Geschwindigkeit",
    resume: "Fortsetzen",
    pause: "Pausieren",
    cancel: "Abbrechen",
    confirm_stop_all: "Alle Torrents von {name} pausieren?",
    confirm_pause: "{name} pausieren?",
    search: "Torrents suchen",
    no_match: "Kein passender Torrent",
    no_torrent: "Kein Torrent",
    no_client: "Kein Torrent-Client gefunden. Ist die Integration Transmission, qBittorrent oder Deluge installiert?",
    unknown_client: "Torrent-Client nicht gefunden",
    no_registry: "Diese Karte benötigt Home Assistant 2024.8 oder neuer.",
    zoom_in: "Vollständige Karte anzeigen",
    zoom_out: "Zurück zur kompakten Ansicht",
    client: "Torrent-Client",
    title: "Titel (optional, standardmäßig der Name des Clients)",
    url: "Vom Symbol geöffnete URL (optional, aus der Integration erkannt)",
    show_title: "Titel anzeigen",
    show_subtitle: "Untertitel anzeigen",
    show_speeds: "Download- und Upload-Geschwindigkeit anzeigen",
    show_history: "Geschwindigkeitsverlauf der letzten 24 h anzeigen",
    show_counts: "Anzahl der Torrents anzeigen",
    show_controls: "Schaltflächen Fortsetzen / Pausieren und alternative Geschwindigkeit anzeigen",
    show_torrents: "Torrent-Liste anzeigen",
    expand_torrents: "Torrent-Liste standardmäßig ausgeklappt",
    show_footer: "Anzahl der Torrents in der Fußzeile anzeigen",
    zoom: "Detail-Schaltfläche",
    zoom_helper: "Schaltet die Mini-Karte zur vollständigen Karte und zurück",
    language: "Sprache",
    lang_auto: "Automatisch",
  },
  es: {
    download: "Descarga",
    upload: "Subida",
    torrents: "Torrents",
    active: "Activos",
    paused: "En pausa",
    total: "Total",
    completed: "Completados",
    downloading: "Descargando",
    seeding: "Compartiendo",
    inactive: "Inactivos",
    errored: "Errores",
    ratio: "Ratio",
    free: "{size} libres",
    limit: "Límite {rate}",
    transferred: "{size} en total",
    status_idle: "Inactivo",
    status_downloading: "Descargando",
    status_seeding: "Compartiendo",
    status_up_down: "Descargando y compartiendo",
    conn_firewalled: "Tras un cortafuegos",
    conn_disconnected: "Desconectado",
    state_unavailable: "No disponible",
    state_unknown: "Desconocido",
    t_downloading: "Descargando",
    t_seeding: "Compartiendo",
    t_paused: "En pausa",
    t_queued: "En cola",
    t_checking: "Comprobando",
    t_stalled: "Atascado",
    t_error: "Error",
    eta: "quedan {time}",
    start_all: "Reanudar todo",
    stop_all: "Pausar todo",
    alt_speed: "Velocidad alternativa",
    resume: "Reanudar",
    pause: "Pausar",
    cancel: "Cancelar",
    confirm_stop_all: "¿Pausar todos los torrents de {name}?",
    confirm_pause: "¿Pausar {name}?",
    search: "Buscar torrents",
    no_match: "Ningún torrent coincide",
    no_torrent: "Ningún torrent",
    no_client: "No se ha encontrado ningún cliente torrent. ¿Está instalada la integración Transmission, qBittorrent o Deluge?",
    unknown_client: "Cliente torrent no encontrado",
    no_registry: "Esta tarjeta necesita Home Assistant 2024.8 o posterior.",
    zoom_in: "Mostrar la tarjeta completa",
    zoom_out: "Volver a la vista compacta",
    client: "Cliente torrent",
    title: "Título (opcional, nombre del cliente por defecto)",
    url: "URL abierta por el icono (opcional, detectada desde la integración)",
    show_title: "Mostrar el título",
    show_subtitle: "Mostrar el subtítulo",
    show_speeds: "Mostrar las velocidades de descarga y subida",
    show_history: "Mostrar el historial de velocidad de 24 h",
    show_counts: "Mostrar el número de torrents",
    show_controls: "Mostrar los botones reanudar / pausar y velocidad alternativa",
    show_torrents: "Mostrar la lista de torrents",
    expand_torrents: "Lista de torrents desplegada por defecto",
    show_footer: "Mostrar el número de torrents en el pie",
    zoom: "Botón de detalle",
    zoom_helper: "Cambia la minitarjeta a la tarjeta completa y viceversa",
    language: "Idioma",
    lang_auto: "Automático",
  },
  sr: {
    download: "Преузимање",
    upload: "Отпремање",
    torrents: "Торенти",
    active: "Активни",
    paused: "Паузирани",
    total: "Укупно",
    completed: "Завршени",
    downloading: "Преузимају се",
    seeding: "Деле се",
    inactive: "Неактивни",
    errored: "Грешке",
    ratio: "Однос",
    free: "{size} слободно",
    limit: "Ограничење {rate}",
    transferred: "{size} укупно",
    status_idle: "Неактиван",
    status_downloading: "Преузимање",
    status_seeding: "Дељење",
    status_up_down: "Преузимање и дељење",
    conn_firewalled: "Иза заштитног зида",
    conn_disconnected: "Веза прекинута",
    state_unavailable: "Недоступно",
    state_unknown: "Непознато",
    t_downloading: "Преузимање",
    t_seeding: "Дељење",
    t_paused: "Паузирано",
    t_queued: "На чекању",
    t_checking: "Провера",
    t_stalled: "Заглављено",
    t_error: "Грешка",
    eta: "још {time}",
    start_all: "Настави све",
    stop_all: "Паузирај све",
    alt_speed: "Алтернативна брзина",
    resume: "Настави",
    pause: "Паузирај",
    cancel: "Откажи",
    confirm_stop_all: "Паузирати све торенте за {name}?",
    confirm_pause: "Паузирати {name}?",
    search: "Претражи торенте",
    no_match: "Нема одговарајућег торента",
    no_torrent: "Нема торената",
    no_client: "Није пронађен торент клијент. Да ли је инсталирана интеграција Transmission, qBittorrent или Deluge?",
    unknown_client: "Торент клијент није пронађен",
    no_registry: "Ова картица захтева Home Assistant 2024.8 или новији.",
    zoom_in: "Прикажи целу картицу",
    zoom_out: "Назад на сажети приказ",
    client: "Торент клијент",
    title: "Наслов (опционо, подразумевано име клијента)",
    url: "Адреса коју отвара икона (опционо, препозната из интеграције)",
    show_title: "Прикажи наслов",
    show_subtitle: "Прикажи поднаслов",
    show_speeds: "Прикажи брзине преузимања и отпремања",
    show_history: "Прикажи историју брзине за 24 ч",
    show_counts: "Прикажи број торената",
    show_controls: "Прикажи дугмад настави / паузирај и алтернативну брзину",
    show_torrents: "Прикажи листу торената",
    expand_torrents: "Листа торената подразумевано отворена",
    show_footer: "Прикажи број торената у подножју",
    zoom: "Дугме за детаље",
    zoom_helper: "Пребацује мини картицу на целу картицу и назад",
    language: "Језик",
    lang_auto: "Аутоматски",
  },
  "sr-Latn": {
    download: "Preuzimanje",
    upload: "Otpremanje",
    torrents: "Torenti",
    active: "Aktivni",
    paused: "Pauzirani",
    total: "Ukupno",
    completed: "Završeni",
    downloading: "Preuzimaju se",
    seeding: "Dele se",
    inactive: "Neaktivni",
    errored: "Greške",
    ratio: "Odnos",
    free: "{size} slobodno",
    limit: "Ograničenje {rate}",
    transferred: "{size} ukupno",
    status_idle: "Neaktivan",
    status_downloading: "Preuzimanje",
    status_seeding: "Deljenje",
    status_up_down: "Preuzimanje i deljenje",
    conn_firewalled: "Iza zaštitnog zida",
    conn_disconnected: "Veza prekinuta",
    state_unavailable: "Nedostupno",
    state_unknown: "Nepoznato",
    t_downloading: "Preuzimanje",
    t_seeding: "Deljenje",
    t_paused: "Pauzirano",
    t_queued: "Na čekanju",
    t_checking: "Provera",
    t_stalled: "Zaglavljeno",
    t_error: "Greška",
    eta: "još {time}",
    start_all: "Nastavi sve",
    stop_all: "Pauziraj sve",
    alt_speed: "Alternativna brzina",
    resume: "Nastavi",
    pause: "Pauziraj",
    cancel: "Otkaži",
    confirm_stop_all: "Pauzirati sve torente za {name}?",
    confirm_pause: "Pauzirati {name}?",
    search: "Pretraži torente",
    no_match: "Nema odgovarajućeg torenta",
    no_torrent: "Nema torenata",
    no_client: "Nije pronađen torent klijent. Da li je instalirana integracija Transmission, qBittorrent ili Deluge?",
    unknown_client: "Torent klijent nije pronađen",
    no_registry: "Ova kartica zahteva Home Assistant 2024.8 ili noviji.",
    zoom_in: "Prikaži celu karticu",
    zoom_out: "Nazad na sažeti prikaz",
    client: "Torent klijent",
    title: "Naslov (opciono, podrazumevano ime klijenta)",
    url: "Adresa koju otvara ikona (opciono, prepoznata iz integracije)",
    show_title: "Prikaži naslov",
    show_subtitle: "Prikaži podnaslov",
    show_speeds: "Prikaži brzine preuzimanja i otpremanja",
    show_history: "Prikaži istoriju brzine za 24 č",
    show_counts: "Prikaži broj torenata",
    show_controls: "Prikaži dugmad nastavi / pauziraj i alternativnu brzinu",
    show_torrents: "Prikaži listu torenata",
    expand_torrents: "Lista torenata podrazumevano otvorena",
    show_footer: "Prikaži broj torenata u podnožju",
    zoom: "Dugme za detalje",
    zoom_helper: "Prebacuje mini karticu na celu karticu i nazad",
    language: "Jezik",
    lang_auto: "Automatski",
  },
  it: {
    download: "Download",
    upload: "Upload",
    torrents: "Torrent",
    active: "Attivi",
    paused: "In pausa",
    total: "Totale",
    completed: "Completati",
    downloading: "In download",
    seeding: "In condivisione",
    inactive: "Inattivi",
    errored: "Errori",
    ratio: "Rapporto",
    free: "{size} liberi",
    limit: "Limite {rate}",
    transferred: "{size} in totale",
    status_idle: "Inattivo",
    status_downloading: "Download in corso",
    status_seeding: "Condivisione",
    status_up_down: "Download e condivisione",
    conn_firewalled: "Dietro firewall",
    conn_disconnected: "Disconnesso",
    state_unavailable: "Non disponibile",
    state_unknown: "Sconosciuto",
    t_downloading: "Download",
    t_seeding: "Condivisione",
    t_paused: "In pausa",
    t_queued: "In coda",
    t_checking: "Verifica",
    t_stalled: "Bloccato",
    t_error: "Errore",
    eta: "{time} rimanenti",
    start_all: "Riprendi tutto",
    stop_all: "Metti tutto in pausa",
    alt_speed: "Velocità alternativa",
    resume: "Riprendi",
    pause: "Pausa",
    cancel: "Annulla",
    confirm_stop_all: "Mettere in pausa tutti i torrent di {name}?",
    confirm_pause: "Mettere in pausa {name}?",
    search: "Cerca torrent",
    no_match: "Nessun torrent corrispondente",
    no_torrent: "Nessun torrent",
    no_client: "Nessun client torrent trovato. L'integrazione Transmission, qBittorrent o Deluge è installata?",
    unknown_client: "Client torrent non trovato",
    no_registry: "Questa scheda richiede Home Assistant 2024.8 o successivo.",
    zoom_in: "Mostra la scheda completa",
    zoom_out: "Torna alla vista compatta",
    client: "Client torrent",
    title: "Titolo (facoltativo, nome del client per impostazione predefinita)",
    url: "URL aperto dall'icona (facoltativo, rilevato dall'integrazione)",
    show_title: "Mostra il titolo",
    show_subtitle: "Mostra il sottotitolo",
    show_speeds: "Mostra le velocità di download e upload",
    show_history: "Mostra la cronologia della velocità di 24 h",
    show_counts: "Mostra il numero di torrent",
    show_controls: "Mostra i pulsanti riprendi / pausa e velocità alternativa",
    show_torrents: "Mostra l'elenco dei torrent",
    expand_torrents: "Elenco dei torrent aperto per impostazione predefinita",
    show_footer: "Mostra il numero di torrent nel piè di pagina",
    zoom: "Pulsante dettaglio",
    zoom_helper: "Passa dalla mini scheda alla scheda completa e viceversa",
    language: "Lingua",
    lang_auto: "Automatica",
  },
  nl: {
    download: "Download",
    upload: "Upload",
    torrents: "Torrents",
    active: "Actief",
    paused: "Gepauzeerd",
    total: "Totaal",
    completed: "Voltooid",
    downloading: "Downloaden",
    seeding: "Seeden",
    inactive: "Inactief",
    errored: "Fouten",
    ratio: "Ratio",
    free: "{size} vrij",
    limit: "Limiet {rate}",
    transferred: "{size} in totaal",
    status_idle: "Inactief",
    status_downloading: "Downloaden",
    status_seeding: "Seeden",
    status_up_down: "Downloaden en seeden",
    conn_firewalled: "Achter firewall",
    conn_disconnected: "Verbroken",
    state_unavailable: "Niet beschikbaar",
    state_unknown: "Onbekend",
    t_downloading: "Downloaden",
    t_seeding: "Seeden",
    t_paused: "Gepauzeerd",
    t_queued: "In wachtrij",
    t_checking: "Controleren",
    t_stalled: "Vastgelopen",
    t_error: "Fout",
    eta: "nog {time}",
    start_all: "Alles hervatten",
    stop_all: "Alles pauzeren",
    alt_speed: "Alternatieve snelheid",
    resume: "Hervatten",
    pause: "Pauzeren",
    cancel: "Annuleren",
    confirm_stop_all: "Alle torrents van {name} pauzeren?",
    confirm_pause: "{name} pauzeren?",
    search: "Torrents zoeken",
    no_match: "Geen overeenkomende torrent",
    no_torrent: "Geen torrent",
    no_client: "Geen torrentclient gevonden. Is de integratie Transmission, qBittorrent of Deluge geïnstalleerd?",
    unknown_client: "Torrentclient niet gevonden",
    no_registry: "Deze kaart vereist Home Assistant 2024.8 of nieuwer.",
    zoom_in: "Volledige kaart tonen",
    zoom_out: "Terug naar de compacte weergave",
    client: "Torrentclient",
    title: "Titel (optioneel, standaard de naam van de client)",
    url: "URL geopend door het pictogram (optioneel, herkend uit de integratie)",
    show_title: "Titel tonen",
    show_subtitle: "Ondertitel tonen",
    show_speeds: "Download- en uploadsnelheid tonen",
    show_history: "Snelheidsgeschiedenis van 24 u tonen",
    show_counts: "Aantal torrents tonen",
    show_controls: "Knoppen hervatten / pauzeren en alternatieve snelheid tonen",
    show_torrents: "Torrentlijst tonen",
    expand_torrents: "Torrentlijst standaard uitgeklapt",
    show_footer: "Aantal torrents in de voettekst tonen",
    zoom: "Detailknop",
    zoom_helper: "Schakelt de minikaart naar de volledige kaart en terug",
    language: "Taal",
    lang_auto: "Automatisch",
  },
  pt: {
    download: "Transferência",
    upload: "Envio",
    torrents: "Torrents",
    active: "Ativos",
    paused: "Em pausa",
    total: "Total",
    completed: "Concluídos",
    downloading: "A transferir",
    seeding: "A partilhar",
    inactive: "Inativos",
    errored: "Erros",
    ratio: "Rácio",
    free: "{size} livres",
    limit: "Limite {rate}",
    transferred: "{size} no total",
    status_idle: "Inativo",
    status_downloading: "A transferir",
    status_seeding: "A partilhar",
    status_up_down: "A transferir e a partilhar",
    conn_firewalled: "Atrás de firewall",
    conn_disconnected: "Desligado",
    state_unavailable: "Indisponível",
    state_unknown: "Desconhecido",
    t_downloading: "A transferir",
    t_seeding: "A partilhar",
    t_paused: "Em pausa",
    t_queued: "Em fila",
    t_checking: "A verificar",
    t_stalled: "Parado",
    t_error: "Erro",
    eta: "faltam {time}",
    start_all: "Retomar tudo",
    stop_all: "Pausar tudo",
    alt_speed: "Velocidade alternativa",
    resume: "Retomar",
    pause: "Pausar",
    cancel: "Cancelar",
    confirm_stop_all: "Pausar todos os torrents de {name}?",
    confirm_pause: "Pausar {name}?",
    search: "Procurar torrents",
    no_match: "Nenhum torrent corresponde",
    no_torrent: "Nenhum torrent",
    no_client: "Nenhum cliente torrent encontrado. A integração Transmission, qBittorrent ou Deluge está instalada?",
    unknown_client: "Cliente torrent não encontrado",
    no_registry: "Este cartão requer o Home Assistant 2024.8 ou posterior.",
    zoom_in: "Mostrar o cartão completo",
    zoom_out: "Voltar à vista compacta",
    client: "Cliente torrent",
    title: "Título (opcional, nome do cliente por predefinição)",
    url: "URL aberto pelo ícone (opcional, detetado a partir da integração)",
    show_title: "Mostrar o título",
    show_subtitle: "Mostrar o subtítulo",
    show_speeds: "Mostrar as velocidades de transferência e envio",
    show_history: "Mostrar o histórico de velocidade de 24 h",
    show_counts: "Mostrar o número de torrents",
    show_controls: "Mostrar os botões retomar / pausar e velocidade alternativa",
    show_torrents: "Mostrar a lista de torrents",
    expand_torrents: "Lista de torrents aberta por predefinição",
    show_footer: "Mostrar o número de torrents no rodapé",
    zoom: "Botão de detalhe",
    zoom_helper: "Muda o minicartão para o cartão completo e vice-versa",
    language: "Idioma",
    lang_auto: "Automático",
  },
  pl: {
    download: "Pobieranie",
    upload: "Wysyłanie",
    torrents: "Torrenty",
    active: "Aktywne",
    paused: "Wstrzymane",
    total: "Razem",
    completed: "Ukończone",
    downloading: "Pobierane",
    seeding: "Udostępniane",
    inactive: "Nieaktywne",
    errored: "Błędy",
    ratio: "Współczynnik",
    free: "{size} wolne",
    limit: "Limit {rate}",
    transferred: "{size} łącznie",
    status_idle: "Bezczynny",
    status_downloading: "Pobieranie",
    status_seeding: "Udostępnianie",
    status_up_down: "Pobieranie i udostępnianie",
    conn_firewalled: "Za zaporą",
    conn_disconnected: "Rozłączony",
    state_unavailable: "Niedostępny",
    state_unknown: "Nieznany",
    t_downloading: "Pobieranie",
    t_seeding: "Udostępnianie",
    t_paused: "Wstrzymany",
    t_queued: "W kolejce",
    t_checking: "Sprawdzanie",
    t_stalled: "Zablokowany",
    t_error: "Błąd",
    eta: "pozostało {time}",
    start_all: "Wznów wszystkie",
    stop_all: "Wstrzymaj wszystkie",
    alt_speed: "Alternatywna prędkość",
    resume: "Wznów",
    pause: "Wstrzymaj",
    cancel: "Anuluj",
    confirm_stop_all: "Wstrzymać wszystkie torrenty klienta {name}?",
    confirm_pause: "Wstrzymać {name}?",
    search: "Szukaj torrentów",
    no_match: "Brak pasującego torrenta",
    no_torrent: "Brak torrentów",
    no_client: "Nie znaleziono klienta torrent. Czy integracja Transmission, qBittorrent lub Deluge jest zainstalowana?",
    unknown_client: "Nie znaleziono klienta torrent",
    no_registry: "Ta karta wymaga Home Assistant 2024.8 lub nowszego.",
    zoom_in: "Pokaż pełną kartę",
    zoom_out: "Wróć do widoku kompaktowego",
    client: "Klient torrent",
    title: "Tytuł (opcjonalny, domyślnie nazwa klienta)",
    url: "Adres otwierany przez ikonę (opcjonalny, wykrywany z integracji)",
    show_title: "Pokaż tytuł",
    show_subtitle: "Pokaż podtytuł",
    show_speeds: "Pokaż prędkość pobierania i wysyłania",
    show_history: "Pokaż historię prędkości z 24 h",
    show_counts: "Pokaż liczbę torrentów",
    show_controls: "Pokaż przyciski wznów / wstrzymaj i alternatywnej prędkości",
    show_torrents: "Pokaż listę torrentów",
    expand_torrents: "Lista torrentów domyślnie rozwinięta",
    show_footer: "Pokaż liczbę torrentów w stopce",
    zoom: "Przycisk szczegółów",
    zoom_helper: "Przełącza mini kartę na pełną kartę i z powrotem",
    language: "Język",
    lang_auto: "Automatyczny",
  },
  ro: {
    download: "Descărcare",
    upload: "Încărcare",
    torrents: "Torrente",
    active: "Active",
    paused: "În pauză",
    total: "Total",
    completed: "Finalizate",
    downloading: "Se descarcă",
    seeding: "Se partajează",
    inactive: "Inactive",
    errored: "Erori",
    ratio: "Raport",
    free: "{size} liberi",
    limit: "Limită {rate}",
    transferred: "{size} în total",
    status_idle: "Inactiv",
    status_downloading: "Descărcare",
    status_seeding: "Partajare",
    status_up_down: "Descărcare și partajare",
    conn_firewalled: "În spatele unui firewall",
    conn_disconnected: "Deconectat",
    state_unavailable: "Indisponibil",
    state_unknown: "Necunoscut",
    t_downloading: "Descărcare",
    t_seeding: "Partajare",
    t_paused: "În pauză",
    t_queued: "În coadă",
    t_checking: "Verificare",
    t_stalled: "Blocat",
    t_error: "Eroare",
    eta: "încă {time}",
    start_all: "Reia tot",
    stop_all: "Pune tot pe pauză",
    alt_speed: "Viteză alternativă",
    resume: "Reia",
    pause: "Pauză",
    cancel: "Anulează",
    confirm_stop_all: "Puneți pe pauză toate torrentele din {name}?",
    confirm_pause: "Puneți pe pauză {name}?",
    search: "Caută torrente",
    no_match: "Niciun torrent corespunzător",
    no_torrent: "Niciun torrent",
    no_client: "Niciun client torrent găsit. Este instalată integrarea Transmission, qBittorrent sau Deluge?",
    unknown_client: "Clientul torrent nu a fost găsit",
    no_registry: "Acest card necesită Home Assistant 2024.8 sau mai nou.",
    zoom_in: "Afișează cardul complet",
    zoom_out: "Înapoi la vizualizarea compactă",
    client: "Client torrent",
    title: "Titlu (opțional, implicit numele clientului)",
    url: "Adresa deschisă de pictogramă (opțională, detectată din integrare)",
    show_title: "Afișează titlul",
    show_subtitle: "Afișează subtitlul",
    show_speeds: "Afișează vitezele de descărcare și încărcare",
    show_history: "Afișează istoricul vitezei pe 24 h",
    show_counts: "Afișează numărul de torrente",
    show_controls: "Afișează butoanele reia / pauză și viteză alternativă",
    show_torrents: "Afișează lista de torrente",
    expand_torrents: "Lista de torrente deschisă implicit",
    show_footer: "Afișează numărul de torrente în subsol",
    zoom: "Buton de detalii",
    zoom_helper: "Comută mini-cardul la cardul complet și înapoi",
    language: "Limbă",
    lang_auto: "Automat",
  },
  da: {
    download: "Download",
    upload: "Upload",
    torrents: "Torrents",
    active: "Aktive",
    paused: "Sat på pause",
    total: "I alt",
    completed: "Færdige",
    downloading: "Downloader",
    seeding: "Seeder",
    inactive: "Inaktive",
    errored: "Fejl",
    ratio: "Ratio",
    free: "{size} ledig",
    limit: "Grænse {rate}",
    transferred: "{size} i alt",
    status_idle: "Inaktiv",
    status_downloading: "Downloader",
    status_seeding: "Seeder",
    status_up_down: "Downloader og seeder",
    conn_firewalled: "Bag firewall",
    conn_disconnected: "Afbrudt",
    state_unavailable: "Utilgængelig",
    state_unknown: "Ukendt",
    t_downloading: "Downloader",
    t_seeding: "Seeder",
    t_paused: "På pause",
    t_queued: "I kø",
    t_checking: "Kontrollerer",
    t_stalled: "Gået i stå",
    t_error: "Fejl",
    eta: "{time} tilbage",
    start_all: "Genoptag alle",
    stop_all: "Sæt alle på pause",
    alt_speed: "Alternativ hastighed",
    resume: "Genoptag",
    pause: "Pause",
    cancel: "Annuller",
    confirm_stop_all: "Sæt alle torrents i {name} på pause?",
    confirm_pause: "Sæt {name} på pause?",
    search: "Søg i torrents",
    no_match: "Ingen matchende torrent",
    no_torrent: "Ingen torrent",
    no_client: "Ingen torrentklient fundet. Er integrationen Transmission, qBittorrent eller Deluge installeret?",
    unknown_client: "Torrentklient ikke fundet",
    no_registry: "Dette kort kræver Home Assistant 2024.8 eller nyere.",
    zoom_in: "Vis hele kortet",
    zoom_out: "Tilbage til kompakt visning",
    client: "Torrentklient",
    title: "Titel (valgfri, klientens navn som standard)",
    url: "URL åbnet af ikonet (valgfri, fundet fra integrationen)",
    show_title: "Vis titel",
    show_subtitle: "Vis undertitel",
    show_speeds: "Vis download- og uploadhastighed",
    show_history: "Vis hastighedshistorik for 24 t",
    show_counts: "Vis antal torrents",
    show_controls: "Vis knapperne genoptag / pause og alternativ hastighed",
    show_torrents: "Vis listen over torrents",
    expand_torrents: "Listen over torrents udfoldet som standard",
    show_footer: "Vis antal torrents i bunden",
    zoom: "Detaljeknap",
    zoom_helper: "Skifter minikortet til hele kortet og tilbage",
    language: "Sprog",
    lang_auto: "Automatisk",
  },
  sv: {
    download: "Nedladdning",
    upload: "Uppladdning",
    torrents: "Torrenter",
    active: "Aktiva",
    paused: "Pausade",
    total: "Totalt",
    completed: "Klara",
    downloading: "Laddar ner",
    seeding: "Seedar",
    inactive: "Inaktiva",
    errored: "Fel",
    ratio: "Kvot",
    free: "{size} ledigt",
    limit: "Gräns {rate}",
    transferred: "{size} totalt",
    status_idle: "Inaktiv",
    status_downloading: "Laddar ner",
    status_seeding: "Seedar",
    status_up_down: "Laddar ner och seedar",
    conn_firewalled: "Bakom brandvägg",
    conn_disconnected: "Frånkopplad",
    state_unavailable: "Inte tillgänglig",
    state_unknown: "Okänd",
    t_downloading: "Laddar ner",
    t_seeding: "Seedar",
    t_paused: "Pausad",
    t_queued: "I kö",
    t_checking: "Kontrollerar",
    t_stalled: "Stillastående",
    t_error: "Fel",
    eta: "{time} kvar",
    start_all: "Återuppta alla",
    stop_all: "Pausa alla",
    alt_speed: "Alternativ hastighet",
    resume: "Återuppta",
    pause: "Pausa",
    cancel: "Avbryt",
    confirm_stop_all: "Pausa alla torrenter i {name}?",
    confirm_pause: "Pausa {name}?",
    search: "Sök torrenter",
    no_match: "Ingen matchande torrent",
    no_torrent: "Ingen torrent",
    no_client: "Ingen torrentklient hittades. Är integrationen Transmission, qBittorrent eller Deluge installerad?",
    unknown_client: "Torrentklienten hittades inte",
    no_registry: "Det här kortet kräver Home Assistant 2024.8 eller senare.",
    zoom_in: "Visa hela kortet",
    zoom_out: "Tillbaka till kompakt vy",
    client: "Torrentklient",
    title: "Titel (valfri, klientens namn som standard)",
    url: "URL som öppnas av ikonen (valfri, hämtad från integrationen)",
    show_title: "Visa titel",
    show_subtitle: "Visa undertitel",
    show_speeds: "Visa nedladdnings- och uppladdningshastighet",
    show_history: "Visa hastighetshistorik för 24 h",
    show_counts: "Visa antal torrenter",
    show_controls: "Visa knapparna återuppta / pausa och alternativ hastighet",
    show_torrents: "Visa listan med torrenter",
    expand_torrents: "Listan med torrenter utfälld som standard",
    show_footer: "Visa antal torrenter i sidfoten",
    zoom: "Detaljknapp",
    zoom_helper: "Växlar minikortet till hela kortet och tillbaka",
    language: "Språk",
    lang_auto: "Automatiskt",
  },
  bg: {
    download: "Изтегляне",
    upload: "Качване",
    torrents: "Торенти",
    active: "Активни",
    paused: "На пауза",
    total: "Общо",
    completed: "Завършени",
    downloading: "Изтеглят се",
    seeding: "Споделят се",
    inactive: "Неактивни",
    errored: "Грешки",
    ratio: "Съотношение",
    free: "{size} свободни",
    limit: "Ограничение {rate}",
    transferred: "{size} общо",
    status_idle: "Неактивен",
    status_downloading: "Изтегляне",
    status_seeding: "Споделяне",
    status_up_down: "Изтегляне и споделяне",
    conn_firewalled: "Зад защитна стена",
    conn_disconnected: "Прекъсната връзка",
    state_unavailable: "Недостъпно",
    state_unknown: "Неизвестно",
    t_downloading: "Изтегляне",
    t_seeding: "Споделяне",
    t_paused: "На пауза",
    t_queued: "На опашка",
    t_checking: "Проверка",
    t_stalled: "Блокиран",
    t_error: "Грешка",
    eta: "остават {time}",
    start_all: "Продължи всички",
    stop_all: "Пауза на всички",
    alt_speed: "Алтернативна скорост",
    resume: "Продължи",
    pause: "Пауза",
    cancel: "Отказ",
    confirm_stop_all: "Пауза на всички торенти на {name}?",
    confirm_pause: "Пауза на {name}?",
    search: "Търсене на торенти",
    no_match: "Няма съвпадащ торент",
    no_torrent: "Няма торенти",
    no_client: "Не е намерен торент клиент. Инсталирана ли е интеграцията Transmission, qBittorrent или Deluge?",
    unknown_client: "Торент клиентът не е намерен",
    no_registry: "Тази карта изисква Home Assistant 2024.8 или по-нова версия.",
    zoom_in: "Покажи цялата карта",
    zoom_out: "Назад към компактния изглед",
    client: "Торент клиент",
    title: "Заглавие (по избор, по подразбиране името на клиента)",
    url: "Адрес, отварян от иконата (по избор, открит от интеграцията)",
    show_title: "Показвай заглавието",
    show_subtitle: "Показвай подзаглавието",
    show_speeds: "Показвай скоростите на изтегляне и качване",
    show_history: "Показвай историята на скоростта за 24 ч",
    show_counts: "Показвай броя на торентите",
    show_controls: "Показвай бутоните продължи / пауза и алтернативна скорост",
    show_torrents: "Показвай списъка с торенти",
    expand_torrents: "Списъкът с торенти е отворен по подразбиране",
    show_footer: "Показвай броя на торентите в долната част",
    zoom: "Бутон за подробности",
    zoom_helper: "Превключва мини картата към цялата карта и обратно",
    language: "Език",
    lang_auto: "Автоматично",
  },
  ru: {
    download: "Загрузка",
    upload: "Отдача",
    torrents: "Торренты",
    active: "Активные",
    paused: "На паузе",
    total: "Всего",
    completed: "Завершённые",
    downloading: "Загружаются",
    seeding: "Раздаются",
    inactive: "Неактивные",
    errored: "Ошибки",
    ratio: "Рейтинг",
    free: "{size} свободно",
    limit: "Ограничение {rate}",
    transferred: "{size} всего",
    status_idle: "Простой",
    status_downloading: "Загрузка",
    status_seeding: "Раздача",
    status_up_down: "Загрузка и раздача",
    conn_firewalled: "За брандмауэром",
    conn_disconnected: "Отключено",
    state_unavailable: "Недоступно",
    state_unknown: "Неизвестно",
    t_downloading: "Загрузка",
    t_seeding: "Раздача",
    t_paused: "На паузе",
    t_queued: "В очереди",
    t_checking: "Проверка",
    t_stalled: "Застопорился",
    t_error: "Ошибка",
    eta: "осталось {time}",
    start_all: "Возобновить все",
    stop_all: "Приостановить все",
    alt_speed: "Альтернативная скорость",
    resume: "Возобновить",
    pause: "Приостановить",
    cancel: "Отмена",
    confirm_stop_all: "Приостановить все торренты {name}?",
    confirm_pause: "Приостановить {name}?",
    search: "Поиск торрентов",
    no_match: "Нет подходящего торрента",
    no_torrent: "Нет торрентов",
    no_client: "Торрент-клиент не найден. Установлена ли интеграция Transmission, qBittorrent или Deluge?",
    unknown_client: "Торрент-клиент не найден",
    no_registry: "Для этой карточки нужен Home Assistant 2024.8 или новее.",
    zoom_in: "Показать полную карточку",
    zoom_out: "Вернуться к компактному виду",
    client: "Торрент-клиент",
    title: "Заголовок (необязательно, по умолчанию имя клиента)",
    url: "Адрес, открываемый значком (необязательно, определяется из интеграции)",
    show_title: "Показывать заголовок",
    show_subtitle: "Показывать подзаголовок",
    show_speeds: "Показывать скорость загрузки и отдачи",
    show_history: "Показывать историю скорости за 24 ч",
    show_counts: "Показывать число торрентов",
    show_controls: "Показывать кнопки возобновить / пауза и альтернативной скорости",
    show_torrents: "Показывать список торрентов",
    expand_torrents: "Список торрентов развёрнут по умолчанию",
    show_footer: "Показывать число торрентов внизу",
    zoom: "Кнопка подробностей",
    zoom_helper: "Переключает мини-карточку на полную и обратно",
    language: "Язык",
    lang_auto: "Автоматически",
  },
  uk: {
    download: "Завантаження",
    upload: "Віддача",
    torrents: "Торенти",
    active: "Активні",
    paused: "На паузі",
    total: "Усього",
    completed: "Завершені",
    downloading: "Завантажуються",
    seeding: "Роздаються",
    inactive: "Неактивні",
    errored: "Помилки",
    ratio: "Співвідношення",
    free: "{size} вільно",
    limit: "Обмеження {rate}",
    transferred: "{size} усього",
    status_idle: "Простій",
    status_downloading: "Завантаження",
    status_seeding: "Роздача",
    status_up_down: "Завантаження і роздача",
    conn_firewalled: "За брандмауером",
    conn_disconnected: "Від'єднано",
    state_unavailable: "Недоступно",
    state_unknown: "Невідомо",
    t_downloading: "Завантаження",
    t_seeding: "Роздача",
    t_paused: "На паузі",
    t_queued: "У черзі",
    t_checking: "Перевірка",
    t_stalled: "Застряг",
    t_error: "Помилка",
    eta: "залишилось {time}",
    start_all: "Відновити всі",
    stop_all: "Призупинити всі",
    alt_speed: "Альтернативна швидкість",
    resume: "Відновити",
    pause: "Призупинити",
    cancel: "Скасувати",
    confirm_stop_all: "Призупинити всі торенти {name}?",
    confirm_pause: "Призупинити {name}?",
    search: "Пошук торентів",
    no_match: "Немає відповідного торента",
    no_torrent: "Немає торентів",
    no_client: "Торент-клієнт не знайдено. Чи встановлено інтеграцію Transmission, qBittorrent або Deluge?",
    unknown_client: "Торент-клієнт не знайдено",
    no_registry: "Для цієї картки потрібен Home Assistant 2024.8 або новіший.",
    zoom_in: "Показати повну картку",
    zoom_out: "Повернутися до компактного вигляду",
    client: "Торент-клієнт",
    title: "Заголовок (необов'язково, типово ім'я клієнта)",
    url: "Адреса, яку відкриває значок (необов'язково, визначається з інтеграції)",
    show_title: "Показувати заголовок",
    show_subtitle: "Показувати підзаголовок",
    show_speeds: "Показувати швидкість завантаження і віддачі",
    show_history: "Показувати історію швидкості за 24 год",
    show_counts: "Показувати кількість торентів",
    show_controls: "Показувати кнопки відновити / пауза і альтернативної швидкості",
    show_torrents: "Показувати список торентів",
    expand_torrents: "Список торентів типово розгорнуто",
    show_footer: "Показувати кількість торентів унизу",
    zoom: "Кнопка подробиць",
    zoom_helper: "Перемикає міні-картку на повну і назад",
    language: "Мова",
    lang_auto: "Автоматично",
  },
  hu: {
    download: "Letöltés",
    upload: "Feltöltés",
    torrents: "Torrentek",
    active: "Aktív",
    paused: "Szüneteltetve",
    total: "Összesen",
    completed: "Kész",
    downloading: "Letöltés alatt",
    seeding: "Megosztás alatt",
    inactive: "Inaktív",
    errored: "Hibák",
    ratio: "Arány",
    free: "{size} szabad",
    limit: "Korlát {rate}",
    transferred: "{size} összesen",
    status_idle: "Tétlen",
    status_downloading: "Letöltés",
    status_seeding: "Megosztás",
    status_up_down: "Letöltés és megosztás",
    conn_firewalled: "Tűzfal mögött",
    conn_disconnected: "Leválasztva",
    state_unavailable: "Nem elérhető",
    state_unknown: "Ismeretlen",
    t_downloading: "Letöltés",
    t_seeding: "Megosztás",
    t_paused: "Szüneteltetve",
    t_queued: "Sorban áll",
    t_checking: "Ellenőrzés",
    t_stalled: "Elakadt",
    t_error: "Hiba",
    eta: "még {time}",
    start_all: "Összes folytatása",
    stop_all: "Összes szüneteltetése",
    alt_speed: "Alternatív sebesség",
    resume: "Folytatás",
    pause: "Szüneteltetés",
    cancel: "Mégse",
    confirm_stop_all: "Szünetelteti {name} összes torrentjét?",
    confirm_pause: "Szünetelteti: {name}?",
    search: "Torrentek keresése",
    no_match: "Nincs egyező torrent",
    no_torrent: "Nincs torrent",
    no_client: "Nem található torrentkliens. Telepítve van a Transmission, qBittorrent vagy Deluge integráció?",
    unknown_client: "A torrentkliens nem található",
    no_registry: "Ehhez a kártyához Home Assistant 2024.8 vagy újabb szükséges.",
    zoom_in: "Teljes kártya megjelenítése",
    zoom_out: "Vissza a kompakt nézethez",
    client: "Torrentkliens",
    title: "Cím (nem kötelező, alapértelmezés a kliens neve)",
    url: "Az ikon által megnyitott URL (nem kötelező, az integrációból felismerve)",
    show_title: "Cím megjelenítése",
    show_subtitle: "Alcím megjelenítése",
    show_speeds: "Letöltési és feltöltési sebesség megjelenítése",
    show_history: "24 órás sebességelőzmény megjelenítése",
    show_counts: "Torrentek számának megjelenítése",
    show_controls: "Folytatás / szüneteltetés és alternatív sebesség gombok megjelenítése",
    show_torrents: "Torrentlista megjelenítése",
    expand_torrents: "Torrentlista alapértelmezetten kinyitva",
    show_footer: "Torrentek számának megjelenítése a láblécben",
    zoom: "Részletek gomb",
    zoom_helper: "A mini kártyát a teljes kártyára váltja és vissza",
    language: "Nyelv",
    lang_auto: "Automatikus",
  },
  sk: {
    download: "Sťahovanie",
    upload: "Odosielanie",
    torrents: "Torrenty",
    active: "Aktívne",
    paused: "Pozastavené",
    total: "Spolu",
    completed: "Dokončené",
    downloading: "Sťahujú sa",
    seeding: "Zdieľajú sa",
    inactive: "Neaktívne",
    errored: "Chyby",
    ratio: "Pomer",
    free: "{size} voľných",
    limit: "Limit {rate}",
    transferred: "{size} spolu",
    status_idle: "Nečinný",
    status_downloading: "Sťahovanie",
    status_seeding: "Zdieľanie",
    status_up_down: "Sťahovanie a zdieľanie",
    conn_firewalled: "Za firewallom",
    conn_disconnected: "Odpojený",
    state_unavailable: "Nedostupné",
    state_unknown: "Neznáme",
    t_downloading: "Sťahovanie",
    t_seeding: "Zdieľanie",
    t_paused: "Pozastavený",
    t_queued: "V poradí",
    t_checking: "Kontrola",
    t_stalled: "Zaseknutý",
    t_error: "Chyba",
    eta: "zostáva {time}",
    start_all: "Obnoviť všetky",
    stop_all: "Pozastaviť všetky",
    alt_speed: "Alternatívna rýchlosť",
    resume: "Obnoviť",
    pause: "Pozastaviť",
    cancel: "Zrušiť",
    confirm_stop_all: "Pozastaviť všetky torrenty klienta {name}?",
    confirm_pause: "Pozastaviť {name}?",
    search: "Hľadať torrenty",
    no_match: "Žiadny zodpovedajúci torrent",
    no_torrent: "Žiadny torrent",
    no_client: "Nenašiel sa žiadny torrentový klient. Je nainštalovaná integrácia Transmission, qBittorrent alebo Deluge?",
    unknown_client: "Torrentový klient sa nenašiel",
    no_registry: "Táto karta vyžaduje Home Assistant 2024.8 alebo novší.",
    zoom_in: "Zobraziť celú kartu",
    zoom_out: "Späť na kompaktné zobrazenie",
    client: "Torrentový klient",
    title: "Názov (voliteľný, predvolene názov klienta)",
    url: "Adresa otváraná ikonou (voliteľná, zistená z integrácie)",
    show_title: "Zobraziť názov",
    show_subtitle: "Zobraziť podnadpis",
    show_speeds: "Zobraziť rýchlosť sťahovania a odosielania",
    show_history: "Zobraziť históriu rýchlosti za 24 h",
    show_counts: "Zobraziť počet torrentov",
    show_controls: "Zobraziť tlačidlá obnoviť / pozastaviť a alternatívnej rýchlosti",
    show_torrents: "Zobraziť zoznam torrentov",
    expand_torrents: "Zoznam torrentov predvolene rozbalený",
    show_footer: "Zobraziť počet torrentov v pätičke",
    zoom: "Tlačidlo podrobností",
    zoom_helper: "Prepne mini kartu na celú kartu a späť",
    language: "Jazyk",
    lang_auto: "Automaticky",
  },
  cs: {
    download: "Stahování",
    upload: "Odesílání",
    torrents: "Torrenty",
    active: "Aktivní",
    paused: "Pozastavené",
    total: "Celkem",
    completed: "Dokončené",
    downloading: "Stahují se",
    seeding: "Sdílejí se",
    inactive: "Neaktivní",
    errored: "Chyby",
    ratio: "Poměr",
    free: "{size} volných",
    limit: "Limit {rate}",
    transferred: "{size} celkem",
    status_idle: "Nečinný",
    status_downloading: "Stahování",
    status_seeding: "Sdílení",
    status_up_down: "Stahování a sdílení",
    conn_firewalled: "Za firewallem",
    conn_disconnected: "Odpojeno",
    state_unavailable: "Nedostupné",
    state_unknown: "Neznámé",
    t_downloading: "Stahování",
    t_seeding: "Sdílení",
    t_paused: "Pozastaveno",
    t_queued: "Ve frontě",
    t_checking: "Kontrola",
    t_stalled: "Zaseknuto",
    t_error: "Chyba",
    eta: "zbývá {time}",
    start_all: "Obnovit vše",
    stop_all: "Pozastavit vše",
    alt_speed: "Alternativní rychlost",
    resume: "Obnovit",
    pause: "Pozastavit",
    cancel: "Zrušit",
    confirm_stop_all: "Pozastavit všechny torrenty klienta {name}?",
    confirm_pause: "Pozastavit {name}?",
    search: "Hledat torrenty",
    no_match: "Žádný odpovídající torrent",
    no_torrent: "Žádný torrent",
    no_client: "Nebyl nalezen žádný torrentový klient. Je nainstalována integrace Transmission, qBittorrent nebo Deluge?",
    unknown_client: "Torrentový klient nebyl nalezen",
    no_registry: "Tato karta vyžaduje Home Assistant 2024.8 nebo novější.",
    zoom_in: "Zobrazit celou kartu",
    zoom_out: "Zpět na kompaktní zobrazení",
    client: "Torrentový klient",
    title: "Název (volitelný, výchozí je název klienta)",
    url: "Adresa otevíraná ikonou (volitelná, zjištěná z integrace)",
    show_title: "Zobrazit název",
    show_subtitle: "Zobrazit podtitul",
    show_speeds: "Zobrazit rychlost stahování a odesílání",
    show_history: "Zobrazit historii rychlosti za 24 h",
    show_counts: "Zobrazit počet torrentů",
    show_controls: "Zobrazit tlačítka obnovit / pozastavit a alternativní rychlosti",
    show_torrents: "Zobrazit seznam torrentů",
    expand_torrents: "Seznam torrentů ve výchozím stavu rozbalený",
    show_footer: "Zobrazit počet torrentů v zápatí",
    zoom: "Tlačítko podrobností",
    zoom_helper: "Přepne mini kartu na celou kartu a zpět",
    language: "Jazyk",
    lang_auto: "Automaticky",
  },
  sl: {
    download: "Prenos",
    upload: "Pošiljanje",
    torrents: "Torrenti",
    active: "Aktivni",
    paused: "Zaustavljeni",
    total: "Skupaj",
    completed: "Dokončani",
    downloading: "Prenašajo se",
    seeding: "Delijo se",
    inactive: "Neaktivni",
    errored: "Napake",
    ratio: "Razmerje",
    free: "{size} prosto",
    limit: "Omejitev {rate}",
    transferred: "{size} skupaj",
    status_idle: "Nedejaven",
    status_downloading: "Prenašanje",
    status_seeding: "Deljenje",
    status_up_down: "Prenašanje in deljenje",
    conn_firewalled: "Za požarnim zidom",
    conn_disconnected: "Prekinjeno",
    state_unavailable: "Ni na voljo",
    state_unknown: "Neznano",
    t_downloading: "Prenašanje",
    t_seeding: "Deljenje",
    t_paused: "Zaustavljeno",
    t_queued: "V čakalni vrsti",
    t_checking: "Preverjanje",
    t_stalled: "Zastalo",
    t_error: "Napaka",
    eta: "še {time}",
    start_all: "Nadaljuj vse",
    stop_all: "Zaustavi vse",
    alt_speed: "Alternativna hitrost",
    resume: "Nadaljuj",
    pause: "Zaustavi",
    cancel: "Prekliči",
    confirm_stop_all: "Zaustavim vse torrente odjemalca {name}?",
    confirm_pause: "Zaustavim {name}?",
    search: "Iskanje torrentov",
    no_match: "Ni ustreznega torrenta",
    no_torrent: "Ni torrentov",
    no_client: "Ni najdenega odjemalca torrent. Ali je nameščena integracija Transmission, qBittorrent ali Deluge?",
    unknown_client: "Odjemalec torrent ni najden",
    no_registry: "Ta kartica potrebuje Home Assistant 2024.8 ali novejši.",
    zoom_in: "Prikaži celotno kartico",
    zoom_out: "Nazaj na strnjen prikaz",
    client: "Odjemalec torrent",
    title: "Naslov (neobvezno, privzeto ime odjemalca)",
    url: "Naslov, ki ga odpre ikona (neobvezno, zaznan iz integracije)",
    show_title: "Prikaži naslov",
    show_subtitle: "Prikaži podnaslov",
    show_speeds: "Prikaži hitrost prenosa in pošiljanja",
    show_history: "Prikaži zgodovino hitrosti za 24 h",
    show_counts: "Prikaži število torrentov",
    show_controls: "Prikaži gumba nadaljuj / zaustavi in alternativno hitrost",
    show_torrents: "Prikaži seznam torrentov",
    expand_torrents: "Seznam torrentov privzeto razprt",
    show_footer: "Prikaži število torrentov v nogi",
    zoom: "Gumb za podrobnosti",
    zoom_helper: "Preklopi mini kartico na celotno kartico in nazaj",
    language: "Jezik",
    lang_auto: "Samodejno",
  },
  lv: {
    download: "Lejupielāde",
    upload: "Augšupielāde",
    torrents: "Torenti",
    active: "Aktīvie",
    paused: "Pauzēti",
    total: "Kopā",
    completed: "Pabeigti",
    downloading: "Lejupielādē",
    seeding: "Koplieto",
    inactive: "Neaktīvie",
    errored: "Kļūdas",
    ratio: "Attiecība",
    free: "{size} brīvi",
    limit: "Ierobežojums {rate}",
    transferred: "{size} kopā",
    status_idle: "Dīkstāve",
    status_downloading: "Lejupielāde",
    status_seeding: "Koplietošana",
    status_up_down: "Lejupielāde un koplietošana",
    conn_firewalled: "Aiz ugunsmūra",
    conn_disconnected: "Atvienots",
    state_unavailable: "Nav pieejams",
    state_unknown: "Nezināms",
    t_downloading: "Lejupielāde",
    t_seeding: "Koplietošana",
    t_paused: "Pauzēts",
    t_queued: "Rindā",
    t_checking: "Pārbaude",
    t_stalled: "Iestrēdzis",
    t_error: "Kļūda",
    eta: "atlicis {time}",
    start_all: "Atsākt visus",
    stop_all: "Pauzēt visus",
    alt_speed: "Alternatīvais ātrums",
    resume: "Atsākt",
    pause: "Pauzēt",
    cancel: "Atcelt",
    confirm_stop_all: "Pauzēt visus klienta {name} torentus?",
    confirm_pause: "Pauzēt {name}?",
    search: "Meklēt torentus",
    no_match: "Nav atbilstoša torenta",
    no_torrent: "Nav torentu",
    no_client: "Torentu klients nav atrasts. Vai ir instalēta integrācija Transmission, qBittorrent vai Deluge?",
    unknown_client: "Torentu klients nav atrasts",
    no_registry: "Šai kartītei nepieciešams Home Assistant 2024.8 vai jaunāka versija.",
    zoom_in: "Rādīt pilno kartīti",
    zoom_out: "Atpakaļ uz kompakto skatu",
    client: "Torentu klients",
    title: "Virsraksts (neobligāts, pēc noklusējuma klienta nosaukums)",
    url: "Ikonas atvērtā adrese (neobligāta, noteikta no integrācijas)",
    show_title: "Rādīt virsrakstu",
    show_subtitle: "Rādīt apakšvirsrakstu",
    show_speeds: "Rādīt lejupielādes un augšupielādes ātrumu",
    show_history: "Rādīt ātruma vēsturi par 24 h",
    show_counts: "Rādīt torentu skaitu",
    show_controls: "Rādīt pogas atsākt / pauzēt un alternatīvā ātruma pogu",
    show_torrents: "Rādīt torentu sarakstu",
    expand_torrents: "Torentu saraksts pēc noklusējuma izvērsts",
    show_footer: "Rādīt torentu skaitu kājenē",
    zoom: "Detaļu poga",
    zoom_helper: "Pārslēdz mini kartīti uz pilno kartīti un atpakaļ",
    language: "Valoda",
    lang_auto: "Automātiski",
  },
  el: {
    download: "Λήψη",
    upload: "Αποστολή",
    torrents: "Torrent",
    active: "Ενεργά",
    paused: "Σε παύση",
    total: "Σύνολο",
    completed: "Ολοκληρωμένα",
    downloading: "Λαμβάνονται",
    seeding: "Διαμοιράζονται",
    inactive: "Ανενεργά",
    errored: "Σφάλματα",
    ratio: "Αναλογία",
    free: "{size} ελεύθερα",
    limit: "Όριο {rate}",
    transferred: "{size} συνολικά",
    status_idle: "Αδρανές",
    status_downloading: "Λήψη",
    status_seeding: "Διαμοιρασμός",
    status_up_down: "Λήψη και διαμοιρασμός",
    conn_firewalled: "Πίσω από τείχος προστασίας",
    conn_disconnected: "Αποσυνδεδεμένο",
    state_unavailable: "Μη διαθέσιμο",
    state_unknown: "Άγνωστο",
    t_downloading: "Λήψη",
    t_seeding: "Διαμοιρασμός",
    t_paused: "Σε παύση",
    t_queued: "Σε αναμονή",
    t_checking: "Έλεγχος",
    t_stalled: "Κολλημένο",
    t_error: "Σφάλμα",
    eta: "απομένουν {time}",
    start_all: "Συνέχιση όλων",
    stop_all: "Παύση όλων",
    alt_speed: "Εναλλακτική ταχύτητα",
    resume: "Συνέχιση",
    pause: "Παύση",
    cancel: "Ακύρωση",
    confirm_stop_all: "Παύση όλων των torrent του {name};",
    confirm_pause: "Παύση του {name};",
    search: "Αναζήτηση torrent",
    no_match: "Κανένα αντίστοιχο torrent",
    no_torrent: "Κανένα torrent",
    no_client: "Δεν βρέθηκε πρόγραμμα torrent. Είναι εγκατεστημένη η ενσωμάτωση Transmission, qBittorrent ή Deluge;",
    unknown_client: "Το πρόγραμμα torrent δεν βρέθηκε",
    no_registry: "Αυτή η κάρτα απαιτεί Home Assistant 2024.8 ή νεότερο.",
    zoom_in: "Εμφάνιση πλήρους κάρτας",
    zoom_out: "Επιστροφή στη συμπαγή προβολή",
    client: "Πρόγραμμα torrent",
    title: "Τίτλος (προαιρετικός, από προεπιλογή το όνομα του προγράμματος)",
    url: "Διεύθυνση που ανοίγει το εικονίδιο (προαιρετική, από την ενσωμάτωση)",
    show_title: "Εμφάνιση τίτλου",
    show_subtitle: "Εμφάνιση υπότιτλου",
    show_speeds: "Εμφάνιση ταχυτήτων λήψης και αποστολής",
    show_history: "Εμφάνιση ιστορικού ταχύτητας 24 ωρών",
    show_counts: "Εμφάνιση αριθμού torrent",
    show_controls: "Εμφάνιση κουμπιών συνέχισης / παύσης και εναλλακτικής ταχύτητας",
    show_torrents: "Εμφάνιση λίστας torrent",
    expand_torrents: "Λίστα torrent ανοιχτή από προεπιλογή",
    show_footer: "Εμφάνιση αριθμού torrent στο υποσέλιδο",
    zoom: "Κουμπί λεπτομερειών",
    zoom_helper: "Αλλάζει τη μίνι κάρτα στην πλήρη κάρτα και πίσω",
    language: "Γλώσσα",
    lang_auto: "Αυτόματα",
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const esc = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const lang = (hass, config) => {
  const l = config?.language || (hass && (hass.locale?.language || hass.language)) || "en";
  return STRINGS[l] ? l : STRINGS[l.split("-")[0]] ? l.split("-")[0] : "en";
};

const t = (hass, config, key, vars = {}) =>
  String(STRINGS[lang(hass, config)][key] ?? STRINGS.en[key] ?? key).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");

// Locale of the numbers: Home Assistant's own language when its base matches the card's language (keeps the
// region, e.g. de-CH or fr-CA), otherwise the card's language. Home Assistant's "pt" is European Portuguese,
// which Intl would format as Brazilian, so bare "pt" becomes "pt-PT".
const fmtLang = (hass, config) => {
  const l = lang(hass, config);
  const ha = hass && (hass.locale?.language || hass.language);
  const loc = ha && ha.split("-")[0] === l ? ha : l;
  return loc === "pt" ? "pt-PT" : loc;
};

const known = (s) => !!s && s.state !== "unknown" && s.state !== "unavailable";

const num = (s) => {
  if (!known(s)) return null;
  const v = parseFloat(s.state);
  return Number.isFinite(v) ? v : null;
};

// Number in the card's language ("1,5" in French): at most `max` decimals, exactly `max` when `fixed`.
const _numFormats = new Map();
const fmtNum = (v, locale, max, fixed = false) => {
  const key = `${locale}|${max}|${fixed}`;
  let f = _numFormats.get(key);
  if (!f) {
    f = new Intl.NumberFormat(locale, { maximumFractionDigits: max, minimumFractionDigits: fixed ? max : 0 });
    _numFormats.set(key, f);
  }
  return f.format(v);
};

// Data size (bytes) in binary units, 2 decimals under 10, 1 under 100, none above, as the other ha-* cards.
const fmtBytes = (b, locale = "en") => {
  if (b === null || b === undefined || !Number.isFinite(Number(b))) return "—";
  let v = Number(b);
  const units = ["B", "KiB", "MiB", "GiB", "TiB", "PiB"];
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${fmtNum(v, locale, v >= 100 || i === 0 ? 0 : v >= 10 ? 1 : 2)} ${units[i]}`;
};

// Transfer rate (bytes per second) in decimal units, kB/s at least: one decimal under 100, none above.
const rateParts = (bps, locale = "en") => {
  if (bps === null || bps === undefined || !Number.isFinite(Number(bps))) return null;
  let v = Math.max(0, Number(bps)) / 1000;
  const units = ["kB/s", "MB/s", "GB/s"];
  let i = 0;
  while (v >= 1000 && i < units.length - 1) {
    v /= 1000;
    i++;
  }
  return [fmtNum(v, locale, v >= 100 ? 0 : 1, v < 100), units[i]];
};
const fmtRate = (bps, locale) => rateParts(bps, locale)?.join(" ") ?? "—";

// A state in bytes, or in bytes per second, whatever unit Home Assistant displays it in (the integrations suggest
// MB/s, GiB, TiB; Deluge reports kB/s).
const UNITS = {
  B: 1,
  kB: 1e3,
  KB: 1e3,
  MB: 1e6,
  GB: 1e9,
  TB: 1e12,
  PB: 1e15,
  KiB: 1024,
  MiB: 1024 ** 2,
  GiB: 1024 ** 3,
  TiB: 1024 ** 4,
  PiB: 1024 ** 5,
  bit: 1 / 8,
  kbit: 125,
  Kbit: 125,
  Mbit: 125e3,
  Gbit: 125e6,
};
const unitFactor = (unit) => UNITS[String(unit ?? "B").replace(/\/s$/, "")] ?? null;
const bytesOf = (s) => {
  const v = num(s);
  const k = unitFactor(s?.attributes?.unit_of_measurement);
  return v === null || k === null ? null : v * k;
};

// Progress (0-100) as a percentage in the card's language ("45.5%", "45,5 %"), whole once done.
const fmtPercent = (v, locale = "en") =>
  new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: v < 100 ? 1 : 0 }).format(v / 100);

// "1 day, 2:03:04", "2:03:04" (Transmission) or "02:03:04" (qBittorrent) -> seconds; null when unknown ("None").
const etaSeconds = (eta) => {
  const m = /^(?:(\d+) days?, )?(\d+):(\d{2}):(\d{2})/.exec(String(eta ?? "").trim());
  if (!m) return null;
  return (Number(m[1] || 0) * 24 + Number(m[2])) * 3600 + Number(m[3]) * 60 + Number(m[4]);
};

// A duration in its two largest units, in the card's language ("2 d 5 h", "1 h 05 min" -> "1 h 5 min").
const fmtDuration = (sec, locale = "en") => {
  if (sec === null || sec === undefined || !Number.isFinite(sec) || sec < 0) return null;
  const parts = [
    ["day", Math.floor(sec / 86400)],
    ["hour", Math.floor((sec % 86400) / 3600)],
    ["minute", Math.floor((sec % 3600) / 60)],
  ];
  const first = parts.findIndex(([, v]) => v > 0);
  if (first < 0) return new Intl.NumberFormat(locale, { style: "unit", unit: "minute", unitDisplay: "narrow" }).format(1);
  return parts
    .slice(first, first + 2)
    .filter(([, v], i) => v > 0 || i === 0)
    .map(([unit, v]) => new Intl.NumberFormat(locale, { style: "unit", unit, unitDisplay: "narrow" }).format(v))
    .join(" ");
};

// Client status: idle, downloading, seeding or up_down (Deluge says "seeding_and_downloading").
const clientStatus = (state) => (state === "seeding_and_downloading" ? "up_down" : state);

// Torrent status of Transmission or qBittorrent -> the card's own: [label key, color class].
const TORRENT_STATES = {
  // Transmission
  downloading: ["downloading", "ok"],
  seeding: ["seeding", "ok"],
  stopped: ["paused", "idle"],
  "download pending": ["queued", "warn"],
  "seed pending": ["queued", "warn"],
  "check pending": ["checking", "warn"],
  checking: ["checking", "warn"],
  // qBittorrent
  forcedDL: ["downloading", "ok"],
  metaDL: ["downloading", "ok"],
  forcedMetaDL: ["downloading", "ok"],
  uploading: ["seeding", "ok"],
  forcedUP: ["seeding", "ok"],
  stalledUP: ["seeding", "ok"],
  stalledDL: ["stalled", "warn"],
  pausedDL: ["paused", "idle"],
  pausedUP: ["paused", "idle"],
  stoppedDL: ["paused", "idle"],
  stoppedUP: ["paused", "idle"],
  queuedDL: ["queued", "warn"],
  queuedUP: ["queued", "warn"],
  checkingDL: ["checking", "warn"],
  checkingUP: ["checking", "warn"],
  checkingResumeData: ["checking", "warn"],
  allocating: ["checking", "warn"],
  moving: ["checking", "warn"],
  error: ["error", "crit"],
  missingFiles: ["error", "crit"],
};
const torrentState = (status) => TORRENT_STATES[status] ?? [null, "idle"];

// Same values, compared by identity: used to skip a render when nothing the card shows has changed.
const sameSig = (a, b) => !!a && !!b && a.length === b.length && a.every((v, i) => v === b[i]);

// Patch the shadow DOM in place from the new HTML: nodes whose tag is unchanged are kept, so keyboard focus, hover,
// the search field and CSS transitions survive an update. Rows of a list carry a data-key and are matched by it.
const patchAttrs = (cur, next) => {
  for (const { name } of [...cur.attributes]) if (!next.hasAttribute(name)) cur.removeAttribute(name);
  for (const { name, value } of next.attributes) if (cur.getAttribute(name) !== value) cur.setAttribute(name, value);
};
const keyOf = (n) => (n.nodeType === 1 ? n.getAttribute("data-key") : null);
const sameNode = (a, b) => !!a && a.nodeType === b.nodeType && a.nodeName === b.nodeName;
const place = (parent, node, ref) => {
  if (node === ref) return;
  try {
    if (parent.moveBefore && node.parentNode === parent) return parent.moveBefore(node, ref);
  } catch (_e) {
    /* fall back to insertBefore */
  }
  parent.insertBefore(node, ref);
};
const patchChildren = (cur, next) => {
  const old = [...cur.childNodes];
  const fresh = [...next.childNodes];
  const byKey = new Map();
  for (const o of old) {
    const k = keyOf(o);
    if (k !== null && !byKey.has(k)) byKey.set(k, o);
  }
  const used = new Set();
  fresh.forEach((n, i) => {
    const k = keyOf(n);
    let o = k !== null ? byKey.get(k) : old[i];
    if (!sameNode(o, n) || used.has(o) || (k === null && keyOf(o) !== null)) o = null;
    const ref = cur.childNodes[i] ?? null;
    if (!o) {
      cur.insertBefore(n, ref);
      return;
    }
    used.add(o);
    place(cur, o, ref);
    if (n.nodeType === 1) {
      patchAttrs(o, n);
      // The search field keeps what is being typed: its value property is the user's, not the attribute.
      if (o.localName === "input" && o.value !== n.getAttribute("value") && o !== o.getRootNode?.().activeElement) o.value = n.getAttribute("value") ?? "";
      patchChildren(o, n);
    } else if (o.nodeValue !== n.nodeValue) o.nodeValue = n.nodeValue;
  });
  while (cur.childNodes.length > fresh.length) cur.removeChild(cur.lastChild);
};
const morph = (root, html) => {
  const tpl = document.createElement("template");
  tpl.innerHTML = html;
  patchChildren(root, tpl.content);
};

const svgIcon = (path, cls = "") => `<svg class="icon ${cls}" viewBox="0 0 24 24"><path d="${path}"/></svg>`;

// ---------------------------------------------------------------------------
// Registry-based resolution
// ---------------------------------------------------------------------------

const _cache = new WeakMap();

/**
 * Clients from hass.entities / hass.devices: one per device of the Transmission, qBittorrent or Deluge integration,
 * { id, name, source, entryId, entities: { status, down, up, … } }, sorted by name.
 */
const resolve = (hass) => {
  if (!hass?.entities || !hass.devices) return null;
  const cached = _cache.get(hass.entities);
  if (cached && cached.devices === hass.devices) return cached.model;
  const clients = new Map();
  for (const e of Object.values(hass.entities)) {
    const src = SOURCES[e.platform];
    if (!src || !e.device_id) continue;
    const domain = e.entity_id.split(".")[0];
    const key = src.keys[e.translation_key] ?? (domain === "switch" && !e.translation_key ? src.keys._switch : undefined);
    if (!key) continue;
    let c = clients.get(e.device_id);
    if (!c) {
      const d = hass.devices[e.device_id] || {};
      c = {
        id: e.device_id,
        name: d.name_by_user || d.name || src.name,
        source: e.platform,
        entryId: d.primary_config_entry || d.config_entries?.[0] || null,
        entities: {},
      };
      clients.set(e.device_id, c);
    }
    if (!(key in c.entities)) c.entities[key] = e.entity_id;
  }
  const model = { clients: [...clients.values()].sort((a, b) => a.name.localeCompare(b.name)) };
  _cache.set(hass.entities, { devices: hass.devices, model });
  return model;
};

const listClients = (hass) => {
  const m = hass && resolve(hass);
  return m ? m.clients.map((c) => ({ value: c.id, label: c.name === SOURCES[c.source].name ? c.name : `${c.name} (${SOURCES[c.source].name})` })) : [];
};

const findClient = (hass, config) => {
  const m = resolve(hass);
  if (!m) return { error: "no_registry" };
  if (!m.clients.length) return { error: "no_client" };
  if (!config.client) return { client: m.clients[0] };
  const client = m.clients.find((c) => c.id === config.client || c.name === config.client);
  return client ? { client } : { error: "unknown_client" };
};

// ---------------------------------------------------------------------------
// 24 h history of the speeds
// ---------------------------------------------------------------------------

// The speeds have no long-term statistics (no state_class): their recorded states are averaged per 5-minute period,
// time-weighted, as { t, v } points in bytes per second. A period without a numeric state (unavailable, recorder
// stopped) has no point, so the curve shows a gap there.
const HIST_PERIOD = 5 * 60000;
const HIST_REFRESH = HIST_PERIOD;
const HIST_WINDOW = 864e5;

function bucketize(changes, start, end, factor) {
  const n = Math.ceil((end - start) / HIST_PERIOD);
  const sum = new Float64Array(n);
  const dur = new Float64Array(n);
  const pts = changes
    .map((c) => ({ t: (c.lu ?? c.lc ?? 0) * 1000, v: parseFloat(c.s) }))
    .filter((c) => Number.isFinite(c.t))
    .sort((a, b) => a.t - b.t);
  for (const [i, p] of pts.entries()) {
    if (!Number.isFinite(p.v)) continue;
    const from = Math.max(start, p.t);
    const to = Math.min(end, pts[i + 1]?.t ?? end);
    for (let a = from; a < to; ) {
      const b = Math.floor((a - start) / HIST_PERIOD);
      const stop = Math.min(to, start + (b + 1) * HIST_PERIOD);
      sum[b] += p.v * (stop - a);
      dur[b] += stop - a;
      a = stop;
    }
  }
  const out = [];
  for (let b = 0; b < n; b++) if (dur[b] > 0) out.push({ t: start + b * HIST_PERIOD, v: (sum[b] / dur[b]) * factor });
  return out;
}

// "· 24 h 0 kB/s – 12.3 MB/s": a curve's lowest and highest rate, for a tooltip; "" without one.
function rangeText(points, loc) {
  if (!points || points.length < 2) return "";
  const vs = points.map((p) => p.v);
  return ` · 24 h ${fmtRate(Math.min(...vs), loc)} – ${fmtRate(Math.max(...vs), loc)}`;
}

// Sparkline of { t, v } points on a real 24 h time axis ending at `end`, scaled from 0 to `max` (else the peak);
// broken where two points are more than two periods apart.
function spark(points, end, max) {
  if (!points || points.length < 2) return "";
  const peak = max || Math.max(...points.map((p) => p.v)) || 1;
  const x = (t) => Math.max(0, Math.min(100, (100 * (t - (end - HIST_WINDOW))) / HIST_WINDOW)).toFixed(2);
  const y = (v) => (30 - (Math.min(Math.max(0, v), peak) / peak) * 28).toFixed(2);
  const segs = [];
  for (const [i, p] of points.entries()) {
    if (!i || p.t - points[i - 1].t > 2 * HIST_PERIOD) segs.push([]);
    segs.at(-1).push(p);
  }
  const line = segs.map((g) => `M${g.map((p) => `${x(p.t)},${y(p.v)}`).join("L")}${g.length === 1 ? "h0.4" : ""}`).join("");
  const area = segs.map((g) => `M${x(g[0].t)},30L${g.map((p) => `${x(p.t)},${y(p.v)}`).join("L")}L${x(g.at(-1).t)},30Z`).join("");
  return `<svg class="spark" viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true"><path class="spark-a" d="${area}"/><path class="spark-l" d="${line}"/></svg>`;
}

// ---------------------------------------------------------------------------
// Shared styles
// ---------------------------------------------------------------------------

const BASE_STYLE = `
  :host { --sb-ok: var(--success-color, #43a047); --sb-warn: var(--warning-color, #ffa600); --sb-crit: var(--error-color, #db4437);
          --sb-idle: var(--disabled-text-color, #9e9e9e); --sb-down: var(--success-color, #43a047); --sb-up: var(--blue-color, #2196f3);
          --sb-accent: var(--primary-color, #03a9f4); }
  :host { display: block; }
  ha-card { overflow: hidden; container-type: inline-size; }
  /* A size container has no content width: this empty, zero-height grid gives the card a natural width of 300 px
     with no minimum, so it still shrinks to its track in a grid column or a flex row (as the other ha-* cards). */
  :host::before { content: ""; display: grid; grid-template-columns: minmax(0, 300px); height: 0; }
  .icon { width: 18px; height: 18px; fill: currentColor; flex: none; }
  .clickable { cursor: pointer; }
  [role="button"]:focus-visible { outline: 2px solid var(--sb-accent); outline-offset: 2px; }
  .ok { --c: var(--sb-ok); } .warn { --c: var(--sb-warn); } .crit { --c: var(--sb-crit); } .idle { --c: var(--sb-idle); }
  .down { --c: var(--sb-down); } .up { --c: var(--sb-up); }
  .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--c, var(--sb-ok)); flex: none; display: inline-block; }
  .chip { display: inline-flex; align-items: center; gap: 4px; padding: 1px 8px; border-radius: 12px; font-size: 11px; font-weight: 500;
          background: color-mix(in srgb, var(--c, var(--sb-ok)) 15%, transparent); color: var(--c, var(--sb-ok)); }
  .bar { height: 4px; border-radius: 3px; background: var(--divider-color, rgba(127,127,127,.25)); overflow: hidden; }
  .bar > div { height: 100%; border-radius: 3px; background: var(--c, var(--sb-accent)); transition: width .6s ease; }
  .header { display: flex; align-items: center; gap: 10px; padding: 12px 12px 8px; }
  /* Tinted round icon, in the status colour like the chip; it opens the client's web UI (or the url option). */
  .logo { height: 40px; width: 40px; flex: none; border-radius: 50%; display: grid; place-items: center;
          color: var(--c, var(--sb-ok)); background: color-mix(in srgb, var(--c, var(--sb-ok)) 16%, transparent); }
  .logo .icon { width: 24px; height: 24px; fill: currentColor; }
  .titles { flex: 1 1 0; min-width: 5ch; }
  :host([hide-title]) .titles > .name, :host([hide-subtitle]) .titles > .sub { display: none; }
  .header .chip { flex: 0 1 auto; min-width: 0; overflow: hidden; line-height: 16px; box-sizing: border-box; }
  /* Unavailable / unknown: the dot stays grey, the text takes the primary text colour (contrast). */
  .header .chip.idle { color: var(--primary-text-color); }
  .chip-label { min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  /* With a subtitle, the chip stays on the title's line, not centred on the two lines. */
  .header:has(.sub) .titles { align-self: flex-start; }
  .header:has(.sub) .chip { align-self: flex-start; margin-top: 1px; }
  @container (max-width: 239px) {
    .header { gap: 6px; }
    :host(:not([mini])) .header .logo { height: 32px; width: 32px; }
    :host(:not([mini])) .header .logo .icon { width: 18px; height: 18px; }
    .header .chip { flex: none; padding: 6px; }
    .header .chip .chip-label { display: none; }
  }
  .name { font-size: 16px; font-weight: 500; line-height: 1.25; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .sub { font-size: 12px; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .warning { padding: 16px; color: var(--sb-warn); }
  .zoom { all: unset; flex: none; cursor: pointer; width: 24px; height: 24px; margin: -4px;
          border-radius: 50%; display: grid; place-items: center; color: var(--secondary-text-color); }
  .zoom .icon { width: 16px; height: 16px; }
  .zoom:hover { background: color-mix(in srgb, var(--secondary-text-color) 16%, transparent); color: var(--primary-text-color); }
  .zoom:focus-visible { outline: 2px solid var(--sb-accent); outline-offset: 1px; }
  .spark-a { fill: color-mix(in srgb, var(--c) 12%, transparent); }
  .spark-l { fill: none; stroke: color-mix(in srgb, var(--c) 50%, transparent); stroke-width: 1.2; vector-effect: non-scaling-stroke; }
`;

// Appended last to every card style: with "reduce motion" set, bars and chevrons jump to their new value.
const MOTION_STYLE = `
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { transition: none !important; animation: none !important; }
  }
`;

// In-card confirmation popup, at the top of the card as in the other ha-* cards (window.confirm() is blocking and
// neutralised in some webviews).
const DIALOG_STYLE = `
  ha-card.dialog-open { position: relative; min-height: 150px; }
  .backdrop { position: absolute; inset: 0; background: rgba(0,0,0,.45); display: flex; align-items: flex-start; justify-content: center;
              padding-top: 12px; box-sizing: border-box; z-index: 9; border-radius: inherit; }
  .modal { background: var(--card-background-color, #1c1c1c); color: var(--primary-text-color); width: min(92%, 340px); max-height: calc(100% - 24px);
           box-sizing: border-box; border-radius: 14px; padding: 16px; box-shadow: 0 8px 30px rgba(0,0,0,.4); display: flex; flex-direction: column; gap: 12px; }
  .modal .msg { font-size: 14px; line-height: 1.4; overflow-wrap: anywhere; }
  .modal-actions { display: flex; justify-content: flex-end; gap: 8px; }
  .modal-actions .btn { border: none; border-radius: 8px; padding: 8px 14px; font: inherit; font-size: 13px; font-weight: 500; cursor: pointer;
                        background: var(--secondary-background-color, rgba(127,127,127,.12)); color: var(--primary-text-color); }
  .modal-actions .btn.primary { background: color-mix(in srgb, var(--sb-accent) 15%, transparent); color: var(--sb-accent); }
  .modal-actions .btn:focus-visible { outline: 2px solid var(--sb-accent); outline-offset: 2px; }
`;

// After the confirmation popup closes, clicks on the card are ignored for this long: the second click of a double
// click on OK would otherwise land on what lies under the button.
const CONFIRM_GUARD_MS = 400;

// A click inside a dialog (more-info opened from the card, say) is not a click outside the card.
const inDialog = (ev) => ev.composedPath().some((n) => ["ha-more-info-dialog", "ha-dialog", "dialog"].includes(n.localName));

// "A click elsewhere" is caught on the pointer, not only on the click event: on iOS (Safari and the companion app)
// a tap on something that is not clickable (the background, an empty spot, a card with no action) sends no click to
// the page. The handler runs when the press and the release are both outside the card (a slider dragged out of the
// card does not count), and a scroll does not count (the browser cancels the pointer); keyboard clicks still go
// through the click event. The handler keeps its own checks (outside of the card, not in a dialog).
const watchOutside = (card, handler) => {
  let downOutside = false;
  const onDown = (ev) => {
    downOutside = !ev.composedPath().includes(card);
  };
  const onUp = (ev) => {
    if (downOutside) handler(ev);
    downOutside = false;
  };
  const onClick = (ev) => {
    if (ev.detail === 0) handler(ev);
  };
  return {
    on() {
      document.addEventListener("pointerdown", onDown, true);
      document.addEventListener("pointerup", onUp, true);
      document.addEventListener("click", onClick, true);
    },
    off() {
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("pointerup", onUp, true);
      document.removeEventListener("click", onClick, true);
    },
    // A tap (press and release at the same spot), for the tests.
    tap(ev) {
      onDown(ev);
      onUp(ev);
    },
  };
};

// The torrents list is read again this often while it is open (qBittorrent: get_torrents service).
const TORRENTS_REFRESH = 60000;

class SeedboxBase extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._html = "";
    this.shadowRoot.addEventListener("click", (ev) => this._onClick(ev));
    // Keyboard access: Enter or Space on a focusable non-button element acts as a click.
    this.shadowRoot.addEventListener("keydown", (ev) => {
      if ((ev.key === "Enter" || ev.key === " ") && ev.target.getAttribute?.("role") === "button") {
        ev.preventDefault();
        ev.target.click();
      }
    });
    // Escape closes the confirmation popup; Tab and Shift+Tab stay on its two buttons.
    this._onKey = (ev) => {
      if (!this._confirm) return;
      if (ev.key === "Tab") {
        const btns = [...(this.shadowRoot.querySelectorAll?.(".modal .btn") || [])];
        if (!btns.length) return;
        ev.preventDefault();
        const i = btns.indexOf(this.shadowRoot.activeElement);
        btns[(i + (ev.shiftKey ? -1 : 1) + btns.length) % btns.length].focus({ preventScroll: true });
        return;
      }
      if (ev.key !== "Escape") return;
      ev.stopPropagation();
      this._closeConfirm();
    };
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._config) return;
    // Render only when a state the card shows has changed, not on every state change of Home Assistant.
    const sig = this._signature();
    if (sameSig(sig, this._sig)) return;
    this._update(sig);
  }

  get hass() {
    return this._hass;
  }

  // A click elsewhere on the page folds the torrents list back to its default (as in ha-carburants-france).
  connectedCallback() {
    this._onOutside ??= (ev) => {
      const foldsOpen = this._folds && Object.keys(this._folds).length;
      if ((!foldsOpen && !this._confirm) || ev.composedPath().includes(this) || inDialog(ev)) return;
      if (this._confirm) this._closeConfirm(false);
      if (foldsOpen) {
        this._folds = {};
        this._update();
      }
    };
    this._outside ??= watchOutside(this, (ev) => this._onOutside(ev));
    this._outside.on();
    if (this._confirm) window.addEventListener("keydown", this._onKey);
    // Back on the page after leaving it: rendered again in its default state.
    this._update();
  }

  disconnectedCallback() {
    this._outside?.off();
    window.removeEventListener("keydown", this._onKey);
    // Left (another dashboard view, a conditional card hidden): back to the defaults, so that the card does not come
    // back unfolded or with its popup open.
    this._folds = {};
    this._confirm = null;
  }

  setConfig(config) {
    if (!config) throw new Error("Invalid configuration");
    this._config = { ...config };
    this.toggleAttribute?.("hide-title", config.show_title === false);
    this.toggleAttribute?.("hide-subtitle", config.show_subtitle === false);
    this._folds = {};
    this._html = "";
    this._update();
  }

  _t(key, vars) {
    return t(this._hass, this._config, key, vars);
  }

  _loc() {
    return fmtLang(this._hass, this._config);
  }

  _s(id) {
    return id ? this._hass.states[id] : undefined;
  }

  // What the render depends on: registries, language, the client's states, the fetched history and torrents.
  _signature() {
    const h = this._hass;
    const sig = [h.entities, h.devices, h.language, h.locale?.language];
    const { client } = findClient(h, this._config);
    if (client) for (const id of Object.values(client.entities)) sig.push(h.states[id]);
    return sig;
  }

  _update(sig) {
    if (!this._hass || !this._config) return;
    this._sig = sig ?? this._signature();
    let html = this._render();
    if (this._confirm)
      html = html.replace(/<ha-card>([\s\S]*)<\/ha-card>\s*$/, (_, inner) => `<ha-card class="dialog-open">${inner}${this._confirmHtml()}</ha-card>`);
    if (html !== this._html) {
      this._html = html;
      morph(this.shadowRoot, html);
    }
  }

  // Service call whose failure is logged (Home Assistant already shows a toast) instead of left unhandled.
  _call(domain, service, data) {
    return Promise.resolve()
      .then(() => this._hass.callService(domain, service, data))
      .catch((err) => console.error(`seedbox-card: ${domain}.${service} failed`, err));
  }

  _onClick(ev) {
    const path = ev.composedPath();
    const el = path.find((n) => n.dataset && (n.dataset.entity || n.dataset.action));
    if (!this._confirm && Date.now() - (this._confirmClosedAt ?? 0) < CONFIRM_GUARD_MS) {
      ev.stopPropagation();
      return;
    }
    // Confirmation popup open: only its buttons and the backdrop itself act.
    if (this._confirm) {
      ev.stopPropagation();
      const action = el?.dataset.action;
      if (action === "confirm_ok") {
        const { run } = this._confirm;
        this._closeConfirm();
        run();
      } else if (action === "confirm_cancel" || (action === "confirm_backdrop" && path[0] === el)) {
        this._closeConfirm();
      }
      return;
    }
    if (!el) return;
    ev.stopPropagation();
    const { action, entity } = el.dataset;
    if (action) this._action(action, el.dataset);
    else if (entity) this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: entity }, bubbles: true, composed: true }));
  }

  _action(action, data) {
    const { entity, label, key } = data;
    if (action === "fold") {
      this._folds = { ...this._folds, [data.section]: !this._isOpen(data.section) };
      this._update();
    } else if (action === "alt" || action === "power") {
      const state = this._s(entity)?.state;
      // Unavailable or unknown: nothing to switch (the button is disabled, keyboard included).
      if (state !== "on" && state !== "off") return;
      const run = () => this._call("switch", state === "on" ? "turn_off" : "turn_on", { entity_id: entity });
      // Pausing every torrent asks first; resuming them or switching the alternative speed does not.
      if (action === "power" && state === "on")
        this._openConfirm({ text: this._t("confirm_stop_all", { name: label }), ok: this._t("pause"), run }, { action, key: entity });
      else run();
    } else if (action === "torrent") {
      const { client } = findClient(this._hass, this._config);
      if (!client?.entryId) return;
      const run = (service) => () => {
        this._call("transmission", service, { entry_id: client.entryId, id: Number(data.id) });
      };
      if (data.paused === "1") run("start_torrent")();
      else this._openConfirm({ text: this._t("confirm_pause", { name: label }), ok: this._t("pause"), run: run("stop_torrent") }, { action, key });
    }
  }

  // `from` is the button that opened the popup: the focus goes back to it when the popup closes.
  _openConfirm(confirm, from) {
    this._confirm = { ...confirm, from };
    window.addEventListener("keydown", this._onKey);
    this._update();
    this.shadowRoot.querySelector?.(".modal .primary")?.focus({ preventScroll: true });
  }

  _closeConfirm(restoreFocus = true) {
    const from = this._confirm?.from;
    this._confirm = null;
    this._confirmClosedAt = Date.now();
    window.removeEventListener("keydown", this._onKey);
    this._update();
    if (restoreFocus && from)
      [...(this.shadowRoot.querySelectorAll?.(`[data-action="${from.action}"]`) || [])]
        .find((n) => (n.dataset.entity ?? n.dataset.key) === from.key)
        ?.focus({ preventScroll: true });
  }

  _confirmHtml() {
    const c = this._confirm;
    return `<div class="backdrop" data-action="confirm_backdrop">
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="confirm-msg">
        <div class="msg" id="confirm-msg">${esc(c.text)}</div>
        <div class="modal-actions">
          <button type="button" class="btn" data-action="confirm_cancel">${esc(this._t("cancel"))}</button>
          <button type="button" class="btn primary" data-action="confirm_ok">${esc(c.ok)}</button>
        </div>
      </div>
    </div>`;
  }

  // Icon target: url option (http(s) only), else the web UI advertised by the integration (Deluge), else the
  // client's website.
  _logoUrl(client) {
    const url = this._config.url;
    if (/^https?:\/\//i.test(url || "")) return url;
    return this._hass.devices?.[client.id]?.configuration_url || SOURCES[client.source].site;
  }

  // Header chip: [class, label key, entity]. qBittorrent's connection status comes first when it is not connected.
  _status(client) {
    const e = client.entities;
    const conn = this._s(e.connection)?.state;
    if (conn === "disconnected") return ["crit", "conn_disconnected", e.connection];
    const st = this._s(e.status);
    if (!known(st)) return ["idle", `state_${st?.state === "unknown" ? "unknown" : "unavailable"}`, e.status];
    if (conn === "firewalled") return ["warn", "conn_firewalled", e.connection];
    const key = `status_${clientStatus(st.state)}`;
    return ["ok", key in STRINGS.en ? key : "status_idle", e.status];
  }

  _header(client) {
    const c = this._config;
    const [cls, key, id] = this._status(client);
    const chip = esc(this._t(key));
    const srcName = SOURCES[client.source].name;
    const free = bytesOf(this._s(client.entities.free));
    // The client's name in the subtitle only when the title does not already say it.
    const sub = [(c.title || client.name) === srcName ? null : srcName, free !== null ? this._t("free", { size: fmtBytes(free, this._loc()) }) : null].filter(Boolean);
    return `
      <div class="header">
        <a class="logo ${cls}" href="${esc(this._logoUrl(client))}" target="_blank" rel="noopener noreferrer" title="${esc(srcName)}" aria-label="${esc(srcName)}">${svgIcon(ICONS.seedbox)}</a>
        <div class="titles">
          <div class="name">${esc(c.title || client.name)}</div>
          ${sub.length ? `<div class="sub">${esc(sub.join(" · "))}</div>` : ""}
        </div>
        ${
          id
            ? `<span class="chip clickable ${cls}" role="button" tabindex="0" data-entity="${esc(id)}" title="${chip}" aria-label="${chip}"><span class="dot"></span><span class="chip-label">${chip}</span></span>`
            : ""
        }
        ${this._zoomButton()}
      </div>`;
  }

  // Button at the far right of the header: only the mini card has one.
  _zoomButton() {
    return "";
  }

  _error(key) {
    return `<style>${BASE_STYLE}${DIALOG_STYLE}${MOTION_STYLE}</style><ha-card><div class="warning">${esc(
      key === "unknown_client" ? `${this._t(key)}: ${this._config.client}` : this._t(key)
    )}</div></ha-card>`;
  }

  // Download and upload: { rate, limit, total } in bytes (per second), with their entities.
  _speeds(client) {
    const e = client.entities;
    const one = (dir) => ({
      id: e[dir],
      rate: bytesOf(this._s(e[dir])),
      // qBittorrent reports 0 for "no limit".
      limit: bytesOf(this._s(e[`${dir}_limit`])) || null,
      total: bytesOf(this._s(e[`${dir}_total`])),
    });
    return { down: one("down"), up: one("up") };
  }

  // Torrent counters the client has, in display order: [key, entity, value].
  _counts(client) {
    const e = client.entities;
    return ["active", "downloading", "seeding", "paused", "inactive", "completed", "errored", "total"]
      .filter((k) => e[k] && this._s(e[k]))
      .map((k) => [k, e[k], num(this._s(e[k]))]);
  }

  // Global ratio, 2 decimals, or null.
  _ratio(client) {
    const v = num(this._s(client.entities.ratio));
    return v === null ? null : fmtNum(v, this._loc(), 2, true);
  }

  _showHistory() {
    return this._config.show_history !== false;
  }

  // 24 h of speed points, { [id]: [{ t, v }] } (nothing yet at first), fetched again every 5 minutes from the
  // recorder's history; the card renders again when the answer comes.
  _history(client) {
    const ids = this._showHistory() ? [client.entities.down, client.entities.up].filter(Boolean) : [];
    const key = ids.join(",");
    if (key && this._hass.callWS && (this._histKey !== key || Date.now() - this._histAt > HIST_REFRESH)) {
      const end = Date.now();
      const start = end - HIST_WINDOW;
      this._histKey = key;
      this._histAt = end;
      this._hass
        .callWS({
          type: "history/history_during_period",
          start_time: new Date(start).toISOString(),
          end_time: new Date(end).toISOString(),
          entity_ids: ids,
          minimal_response: true,
          no_attributes: true,
          significant_changes_only: false,
        })
        .then((r) => {
          if (this._histKey !== key) return;
          this._hist = Object.fromEntries(
            ids.map((id) => [id, bucketize(r?.[id] || [], start, end, unitFactor(this._s(id)?.attributes?.unit_of_measurement) ?? 1)])
          );
          this._histEnd = end;
          this._html = "";
          this._update();
        })
        // No history (recorder off, entity excluded): try again in a minute, nothing meanwhile.
        .catch(() => {
          this._histAt = Date.now() - HIST_REFRESH + 60000;
        });
    }
    return key && this._histKey === key ? this._hist : null;
  }

  // Scale of a speed bar: its limit, else the 24 h peak, else the highest rate seen since the card loaded.
  _scale(id, rate, limit, points) {
    this._peaks ??= {};
    if (rate !== null) this._peaks[id] = Math.max(this._peaks[id] ?? 0, rate);
    return limit || Math.max(0, ...(points || []).map((p) => p.v)) || this._peaks[id] || 0;
  }

  _isOpen(key) {
    return this._folds?.[key] ?? this._config[`expand_${key}`] === true;
  }
}

// ---------------------------------------------------------------------------
// Full card
// ---------------------------------------------------------------------------

const FULL_STYLE = `
  .content { padding: 0 12px 12px; display: flex; flex-direction: column; gap: 12px; }
  .speeds { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
  .speed { position: relative; overflow: hidden; border-radius: 12px; padding: 10px 12px; min-width: 0;
           background: var(--secondary-background-color, rgba(127,127,127,.08)); }
  .speed > :not(.spark) { position: relative; }
  /* The 24 h curve in the lower half of the tile, under the rate. */
  .speed .spark { position: absolute; left: 0; bottom: 0; width: 100%; height: 55%; pointer-events: none; }
  .speed .k { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--secondary-text-color); }
  .speed .k .icon { color: var(--c); width: 16px; height: 16px; }
  .speed .v { font-size: 22px; font-weight: 500; line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .speed .v small { font-size: 13px; font-weight: 400; color: var(--secondary-text-color); margin-left: 3px; }
  .speed .d { font-size: 11px; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-height: 14px; }
  @container (max-width: 279px) {
    .speed { padding: 8px; }
    .speed .v { font-size: 17px; }
    .speed .v small { font-size: 11px; }
  }
  .counts { display: grid; grid-template-columns: repeat(auto-fit, minmax(64px, 1fr)); gap: 6px; }
  .count-tile { display: flex; flex-direction: column; align-items: center; padding: 6px 4px; border-radius: 10px;
                background: var(--secondary-background-color, rgba(127,127,127,.08)); min-width: 0; text-align: center; }
  .count-tile .top { display: flex; align-items: center; gap: 6px; }
  .count-tile .icon { color: var(--c, var(--secondary-text-color)); width: 16px; height: 16px; }
  .count-tile .k { font-size: 11px; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
  .count-tile .v { font-size: 14px; font-weight: 500; }
  .count-tile.crit .v { color: var(--sb-crit); }
  /* Action buttons: outlined, never filled; an active alternative speed is tinted in the accent colour. */
  .actions { display: flex; flex-wrap: wrap; gap: 6px; }
  .act { display: inline-flex; align-items: center; gap: 6px; height: 32px; padding: 0 12px; border-radius: 16px; font: inherit; font-size: 13px;
         cursor: pointer; background: transparent; color: var(--primary-text-color); border: 1px solid var(--divider-color, rgba(127,127,127,.3));
         min-width: 0; max-width: 100%; box-sizing: border-box; transition: background-color .2s ease, color .2s ease, border-color .2s ease; }
  .act span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .act .icon { width: 18px; height: 18px; color: var(--secondary-text-color); }
  .act:hover:not(:disabled) { background: color-mix(in srgb, var(--secondary-text-color) 10%, transparent); }
  .act.on { color: var(--sb-accent); border-color: color-mix(in srgb, var(--sb-accent) 50%, transparent);
            background: color-mix(in srgb, var(--sb-accent) 10%, transparent); }
  .act.on .icon { color: var(--sb-accent); }
  .act:disabled { opacity: .45; cursor: default; }
  .act:focus-visible { outline: 2px solid var(--sb-accent); outline-offset: 2px; }
  .section-title { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 500; text-transform: uppercase;
                   letter-spacing: .04em; color: var(--secondary-text-color); margin-bottom: 6px; cursor: pointer; user-select: none; }
  .section-title .icon { width: 16px; height: 16px; }
  .section-title .count { margin-left: auto; text-transform: none; letter-spacing: 0; font-weight: 400; }
  .section-title .chevron { transition: transform .2s ease; }
  .section-title.closed { margin-bottom: 0; }
  .section-title.closed .chevron { transform: rotate(-90deg); }
  .list { display: flex; flex-direction: column; }
  .item { display: flex; align-items: center; gap: 8px; padding: 6px 0; border-bottom: 1px solid var(--divider-color, rgba(127,127,127,.15)); min-width: 0; }
  .item:last-child { border-bottom: none; }
  .item .main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
  .item .title { font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .item .detail { font-size: 12px; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .item .bar > div { background: var(--c, var(--sb-accent)); }
  .tools { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
  .search { flex: 1; min-width: 0; display: flex; align-items: center; gap: 6px; padding: 0 8px; height: 30px; box-sizing: border-box;
            border: 1px solid var(--divider-color, rgba(127,127,127,.25)); border-radius: 8px; color: var(--secondary-text-color); }
  .search .icon { width: 16px; height: 16px; }
  .search:focus-within { border-color: var(--sb-accent); }
  .search input { all: unset; flex: 1; min-width: 0; font-size: 13px; color: var(--primary-text-color); }
  .search input::placeholder { color: var(--secondary-text-color); }
  .ctrl { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 50%; border: none;
          background: transparent; color: var(--secondary-text-color); cursor: pointer; flex: none; padding: 0; }
  .ctrl:hover:not(:disabled) { background: var(--secondary-background-color, rgba(127,127,127,.12)); }
  .ctrl:disabled { opacity: .4; cursor: default; }
  .ctrl .icon { width: 20px; height: 20px; }
  .ctrl:focus-visible { outline: 2px solid var(--sb-accent); outline-offset: 1px; }
  .empty { font-size: 13px; color: var(--secondary-text-color); padding: 4px 0; }
`;

class SeedboxCard extends SeedboxBase {
  constructor() {
    super();
    // Torrents search (filters as you type), kept while the card lives (not in the config).
    this.shadowRoot.addEventListener("input", (ev) => {
      if (ev.target?.dataset?.ctl !== "search") return;
      this._query = ev.target.value;
      this._update();
    });
  }

  static getConfigElement() {
    return document.createElement("seedbox-card-editor");
  }

  static getStubConfig(hass) {
    const c = listClients(hass)[0];
    return c ? { client: c.value } : {};
  }

  getCardSize() {
    const c = this._config || {};
    let size = 1 + (c.show_speeds !== false ? 2 : 0) + (c.show_counts !== false ? 1 : 0) + (c.show_controls !== false ? 1 : 0);
    if (c.show_torrents !== false) size += 1 + (this._isOpen("torrents") ? (this._torrentRows?.length ?? 0) : 0);
    return size;
  }

  getGridOptions() {
    return { columns: 12, min_columns: 6 };
  }

  _render() {
    const { client, error } = findClient(this._hass, this._config);
    if (error) return this._error(error);
    const c = this._config;
    const parts = [];
    if (c.show_speeds !== false) parts.push(this._speedTiles(client));
    if (c.show_counts !== false) parts.push(this._countTiles(client));
    if (c.show_controls !== false) parts.push(this._actions(client));
    if (c.show_torrents !== false) parts.push(this._torrents(client));
    return `<style>${BASE_STYLE}${DIALOG_STYLE}${FULL_STYLE}${MOTION_STYLE}</style>
      <ha-card>
        ${this._header(client)}
        <div class="content">${parts.filter(Boolean).join("")}</div>
      </ha-card>`;
  }

  _speedTiles(client) {
    const loc = this._loc();
    const hist = this._history(client);
    const tile = (dir, s) => {
      if (!s.id) return "";
      const parts = rateParts(s.rate, loc);
      const label = this._t(dir === "down" ? "download" : "upload");
      const pts = hist?.[s.id];
      const range = rangeText(pts, loc);
      const detail = s.limit ? this._t("limit", { rate: fmtRate(s.limit, loc) }) : s.total !== null ? this._t("transferred", { size: fmtBytes(s.total, loc) }) : "";
      return `<div class="speed clickable ${dir}" role="button" tabindex="0" data-entity="${esc(s.id)}" aria-label="${esc(`${label} ${parts ? parts.join(" ") : "—"}`)}"${range ? ` title="${esc(label + range)}"` : ""}>${spark(pts, this._histEnd)}
        <div class="k">${svgIcon(ICONS[dir])}<span>${esc(label)}</span></div>
        <div class="v">${parts ? `${esc(parts[0])}<small>${esc(parts[1])}</small>` : "—"}</div>
        <div class="d">${esc(detail)}</div>
      </div>`;
    };
    const { down, up } = this._speeds(client);
    const tiles = [tile("down", down), tile("up", up)].filter(Boolean);
    return tiles.length ? `<div class="speeds">${tiles.join("")}</div>` : "";
  }

  _countTiles(client) {
    const tiles = this._counts(client).map(([k, id, v]) => {
      const cls = k === "errored" && v > 0 ? "crit" : "";
      return `<div class="count-tile clickable ${cls}" role="button" tabindex="0" data-key="${esc(id)}" data-entity="${esc(id)}"><div class="top">${svgIcon(ICONS[k])}<span class="v">${
        v === null ? "—" : esc(fmtNum(v, this._loc(), 0))
      }</span></div><div class="k">${esc(this._t(k))}</div></div>`;
    });
    const ratio = this._ratio(client);
    if (ratio !== null)
      tiles.push(
        `<div class="count-tile clickable" role="button" tabindex="0" data-key="ratio" data-entity="${esc(client.entities.ratio)}"><div class="top">${svgIcon(ICONS.ratio)}<span class="v">${esc(
          ratio
        )}</span></div><div class="k">${esc(this._t("ratio"))}</div></div>`
      );
    return tiles.length ? `<div class="counts">${tiles.join("")}</div>` : "";
  }

  // Resume / pause every torrent (Transmission, Deluge) and the alternative speed (Transmission, qBittorrent).
  _actions(client) {
    const e = client.entities;
    const out = [];
    const power = this._s(e.power);
    if (power) {
      const on = power.state === "on";
      const ok = power.state === "on" || power.state === "off";
      const label = this._t(on ? "stop_all" : "start_all");
      out.push(
        `<button type="button" class="act" data-action="power" data-entity="${esc(e.power)}" data-label="${esc(this._config.title || client.name)}"${ok ? "" : " disabled"}>${svgIcon(
          on ? ICONS.pause : ICONS.play
        )}<span>${esc(label)}</span></button>`
      );
    }
    const alt = this._s(e.alt);
    if (alt) {
      const on = alt.state === "on";
      const ok = on || alt.state === "off";
      out.push(
        `<button type="button" class="act ${on ? "on" : ""}" aria-pressed="${on}" data-action="alt" data-entity="${esc(e.alt)}"${ok ? "" : " disabled"}>${svgIcon(ICONS.turtle)}<span>${esc(
          this._t("alt_speed")
        )}</span></button>`
      );
    }
    return out.length ? `<div class="actions">${out.join("")}</div>` : "";
  }

  // Torrents of the client: Transmission's torrent_info attribute (its "limit" option sets how many), qBittorrent's
  // get_torrents service (read again every minute while the list is open). Deluge has neither: no list.
  // [{ key, id, name, status, progress, eta, ratio }] or null when the client has no list.
  _torrentList(client) {
    const e = client.entities;
    if (client.source === "transmission") {
      const info = this._s(e.total)?.attributes?.torrent_info;
      if (!info) return e.total ? [] : null;
      return Object.entries(info).map(([name, v]) => ({ key: String(v.id ?? name), id: v.id, name, ...v }));
    }
    if (client.source !== "qbittorrent" || !this._hass.callService) return null;
    if (this._isOpen("torrents") && (this._qbFor !== client.id || Date.now() - (this._qbAt ?? 0) > TORRENTS_REFRESH)) {
      this._qbFor = client.id;
      this._qbAt = Date.now();
      Promise.resolve()
        .then(() => this._hass.callService("qbittorrent", "get_torrents", { device_id: client.id, torrent_filter: "all" }, undefined, false, true))
        .then((r) => {
          const torrents = r?.response?.torrents ?? {};
          this._qb = Object.entries(torrents).map(([name, v]) => ({ key: String(v.id ?? name), name, ...v, id: undefined }));
          this._html = "";
          this._update();
        })
        .catch((err) => console.warn("seedbox-card: qbittorrent.get_torrents failed", err));
    }
    return this._qbFor === client.id ? (this._qb ?? []) : [];
  }

  _torrents(client) {
    const list = this._torrentList(client);
    if (list === null) return "";
    const loc = this._loc();
    const query = (this._query ?? "").trim().toLowerCase();
    const canControl = client.source === "transmission" && client.entryId && this._config.show_controls !== false;
    const rows = list.map((tr) => {
      const [label, cls] = torrentState(tr.status);
      const progress = Math.max(0, Math.min(100, parseFloat(tr.percent_done) || 0));
      const eta = fmtDuration(etaSeconds(tr.eta), loc);
      const ratio = Number.isFinite(parseFloat(tr.ratio)) && parseFloat(tr.ratio) >= 0 ? fmtNum(parseFloat(tr.ratio), loc, 2, true) : null;
      const detail = [
        label ? this._t(`t_${label}`) : tr.status,
        fmtPercent(progress, loc),
        label === "downloading" && eta ? this._t("eta", { time: eta }) : null,
        ratio !== null ? `${this._t("ratio")} ${ratio}` : null,
      ].filter(Boolean);
      const paused = label === "paused";
      const ctrl =
        canControl && tr.id !== undefined
          ? `<button type="button" class="ctrl" title="${esc(this._t(paused ? "resume" : "pause"))}" aria-label="${esc(`${this._t(paused ? "resume" : "pause")} ${tr.name}`)}" data-action="torrent" data-key="${esc(
              tr.key
            )}" data-id="${esc(tr.id)}" data-paused="${paused ? "1" : "0"}" data-label="${esc(tr.name)}">${svgIcon(paused ? ICONS.play : ICONS.pause)}</button>`
          : "";
      return {
        problem: cls === "crit",
        match: !query || tr.name.toLowerCase().includes(query),
        html: `<div class="item ${cls}" data-key="${esc(tr.key)}">
          <span class="dot"></span>
          <div class="main" title="${esc(tr.name)}">
            <div class="title">${esc(tr.name)}</div>
            <div class="bar"><div style="width:${progress.toFixed(1)}%"></div></div>
            <div class="detail">${esc(detail.join(" · "))}</div>
          </div>
          ${ctrl}
        </div>`,
      };
    });
    this._torrentRows = rows;
    const shown = rows.filter((r) => r.match);
    // Torrents in error first.
    shown.sort((a, b) => Number(b.problem) - Number(a.problem));
    const open = this._isOpen("torrents");
    const empty = query ? this._t("no_match") : this._t("no_torrent");
    const tools =
      rows.length > 1
        ? `<div class="tools"><label class="search">${svgIcon(ICONS.search)}<input type="search" data-ctl="search" placeholder="${esc(this._t("search"))}" aria-label="${esc(
            this._t("search")
          )}" value="${esc(this._query ?? "")}" autocomplete="off" spellcheck="false"></label></div>`
        : "";
    const totalCount = num(this._s(client.entities.total)) ?? rows.length;
    return `<div>
      <div class="section-title ${open ? "" : "closed"}" role="button" tabindex="0" aria-expanded="${open}" data-action="fold" data-section="torrents">${svgIcon(ICONS.list)}${esc(
        this._t("torrents")
      )}<span class="count">${open ? `${shown.length}/` : ""}${esc(fmtNum(totalCount, loc, 0))}</span>${svgIcon(ICONS.chevron, "chevron")}</div>
      ${open ? `${tools}<div class="list">${shown.length ? shown.map((r) => r.html).join("") : `<div class="empty">${esc(empty)}</div>`}</div>` : ""}
    </div>`;
  }
}

// ---------------------------------------------------------------------------
// Mini card
// ---------------------------------------------------------------------------

const MINI_STYLE = `
  .content { padding: 0 12px 12px; display: flex; flex-direction: column; gap: 8px; }
  /* Label column of up to 86 px (the bars line up across rows), a bar of at least 24 px, the value at its width. */
  .metric { display: grid; grid-template-columns: 18px minmax(0, 86px) minmax(24px, 1fr) minmax(56px, auto); align-items: center; gap: 8px; font-size: 13px;
            position: relative; }
  .metric > :not(.spark) { position: relative; }
  .metric .spark { position: absolute; left: 0; top: 0; width: 100%; height: 100%; pointer-events: none; }
  .metric > .icon { color: var(--c, var(--secondary-text-color)); }
  .metric .lbl { min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .metric .v { text-align: right; font-weight: 500; white-space: nowrap; }
  @container (max-width: 229px) {
    .metric { grid-template-columns: 18px minmax(24px, 1fr) minmax(56px, auto); gap: 6px; }
    .metric .lbl { display: none; }
  }
  .foot { display: flex; justify-content: space-between; align-items: center; gap: 8px; font-size: 12px; color: var(--secondary-text-color); margin-top: 2px; flex-wrap: wrap; }
  .foot span { display: inline-flex; align-items: center; gap: 4px; }
  .foot .icon { width: 14px; height: 14px; }
  .foot .crit { color: var(--sb-crit); }
  .foot .on { color: var(--sb-accent); }
`;

// The mini card extends the full card: its detail button (top right, `zoom: false` removes it) switches it to the
// full card's content, same configuration, and back; a click anywhere outside the card brings it back too.
class SeedboxMiniCard extends SeedboxCard {
  static getConfigElement() {
    return document.createElement("seedbox-mini-card-editor");
  }

  static getStubConfig(hass) {
    return SeedboxCard.getStubConfig(hass);
  }

  constructor() {
    super();
    this._zoomed = false;
    this.shadowRoot.addEventListener("click", (ev) => this._zoomClick(ev));
    this._onUnzoom = (ev) => {
      if (this._zoomed && !ev.composedPath().includes(this) && !inDialog(ev)) this._setZoom(false);
    };
  }

  connectedCallback() {
    this._unzoom ??= watchOutside(this, this._onUnzoom);
    this._unzoom.on();
    super.connectedCallback();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._unzoom?.off();
    // Back to the compact view once off the screen.
    this._zoomed = false;
  }

  // A config change (the editor, say) starts over from the compact view.
  setConfig(config) {
    this._zoomed = false;
    this.setAttribute("mini", "");
    super.setConfig(config);
  }

  getCardSize() {
    return this._zoomed ? super.getCardSize() : 3;
  }

  getGridOptions() {
    return { ...(this._zoomed ? super.getGridOptions() : { columns: 6, min_columns: 6 }), rows: "auto" };
  }

  _setZoom(zoomed) {
    this._zoomed = zoomed;
    this._update();
  }

  _zoomClick(ev) {
    if (!ev.target?.closest?.(".zoom")) return;
    ev.stopPropagation();
    this._setZoom(!this._zoomed);
    // Keyboard use (no click count) keeps the focus on the button, without scrolling the view.
    if (ev.detail === 0) this.shadowRoot.querySelector(".zoom")?.focus({ preventScroll: true });
  }

  _zoomButton() {
    if (this._config.zoom === false) return "";
    const z = this._zoomed;
    return `<button type="button" class="zoom" title="${esc(this._t(z ? "zoom_out" : "zoom_in"))}">${svgIcon(z ? ICONS.collapse : ICONS.expand)}</button>`;
  }

  _metric(id, icon, label, pct, display, cls, points) {
    const range = rangeText(points, this._loc());
    return `<div class="metric clickable ${cls}" role="button" tabindex="0" data-entity="${esc(id || "")}" aria-label="${esc(`${label} ${display}`)}"${range ? ` title="${esc(label + range)}"` : ""}>
      ${spark(points, this._histEnd)}${svgIcon(icon)}<span class="lbl">${esc(label)}</span>
      <div class="bar"><div style="width:${pct === null ? 0 : Math.max(0, Math.min(100, pct)).toFixed(1)}%"></div></div>
      <span class="v">${esc(display)}</span>
    </div>`;
  }

  _render() {
    if (this._zoomed) return super._render();
    const { client, error } = findClient(this._hass, this._config);
    if (error) return this._error(error);
    const e = client.entities;
    const loc = this._loc();
    const hist = this._history(client);
    const { down, up } = this._speeds(client);
    const rows = [];
    for (const [dir, s] of [["down", down], ["up", up]]) {
      if (!s.id) continue;
      const scale = this._scale(s.id, s.rate, s.limit, hist?.[s.id]);
      rows.push(
        this._metric(s.id, ICONS[dir], this._t(dir === "down" ? "download" : "upload"), s.rate !== null && scale ? (100 * s.rate) / scale : null, fmtRate(s.rate, loc), dir, hist?.[s.id])
      );
    }
    // Active torrents against the total, when the client counts them.
    const active = num(this._s(e.active));
    const total = num(this._s(e.total));
    if (e.active && e.total)
      rows.push(
        this._metric(e.active, ICONS.active, this._t("active"), total ? (100 * (active ?? 0)) / total : null, active === null || total === null ? "—" : `${fmtNum(active, loc, 0)}/${fmtNum(total, loc, 0)}`, "ok")
      );
    const foot = [];
    if (this._config.show_footer !== false) {
      for (const [k, id, v] of this._counts(client)) {
        // Active and total are on their own row already.
        if ((k === "active" || k === "total") && e.active && e.total) continue;
        if (k === "errored" && !v) continue;
        foot.push(
          `<span class="clickable ${k === "errored" ? "crit" : ""}" role="button" tabindex="0" data-key="${esc(id)}" data-entity="${esc(id)}">${svgIcon(ICONS[k])}${esc(this._t(k))} ${
            v === null ? "—" : esc(fmtNum(v, loc, 0))
          }</span>`
        );
      }
      const ratio = this._ratio(client);
      if (ratio !== null)
        foot.push(`<span class="clickable" role="button" tabindex="0" data-key="ratio" data-entity="${esc(e.ratio)}">${svgIcon(ICONS.ratio)}${esc(this._t("ratio"))} ${esc(ratio)}</span>`);
      if (this._s(e.alt)?.state === "on")
        foot.push(`<span class="clickable on" role="button" tabindex="0" data-key="alt" data-entity="${esc(e.alt)}">${svgIcon(ICONS.turtle)}${esc(this._t("alt_speed"))}</span>`);
    }
    return `<style>${BASE_STYLE}${DIALOG_STYLE}${MINI_STYLE}${MOTION_STYLE}</style>
      <ha-card>
        ${this._header(client)}
        <div class="content">
          ${rows.join("")}
          ${foot.length ? `<div class="foot">${foot.join("")}</div>` : ""}
        </div>
      </ha-card>`;
  }
}

// ---------------------------------------------------------------------------
// Visual editors (ha-form)
// ---------------------------------------------------------------------------

const LANGUAGES = [
  ["en", "English"],
  ["fr", "Français"],
  ["de", "Deutsch"],
  ["es", "Español"],
  ["sr", "Српски"],
  ["sr-Latn", "Srpski (latinica)"],
  ["it", "Italiano"],
  ["nl", "Nederlands"],
  ["pt", "Português (Portugal)"],
  ["pl", "Polski"],
  ["ro", "Română"],
  ["da", "Dansk"],
  ["sv", "Svenska"],
  ["bg", "Български"],
  ["ru", "Русский"],
  ["uk", "Українська"],
  ["hu", "Magyar"],
  ["sk", "Slovenčina"],
  ["cs", "Čeština"],
  ["sl", "Slovenščina"],
  ["lv", "Latviešu"],
  ["el", "Ελληνικά"],
];

class SeedboxEditorBase extends HTMLElement {
  // [name, default]
  static get toggles() {
    return [];
  }

  setConfig(config) {
    this._config = { ...config };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  _schema(clients) {
    const tr = (k) => t(this._hass, this._config, k);
    return [
      { name: "client", selector: { select: { mode: "dropdown", options: clients } } },
      { name: "title", selector: { text: {} } },
      { name: "url", selector: { text: { type: "url" } } },
      { type: "grid", name: "", schema: this.constructor.toggles.map(([name]) => ({ name, selector: { boolean: {} } })) },
      {
        name: "language",
        selector: { select: { mode: "dropdown", options: [{ value: "", label: tr("lang_auto") }, ...LANGUAGES.map(([value, label]) => ({ value, label }))] } },
      },
    ];
  }

  _render() {
    if (!this._hass || !this._config) return;
    const clients = listClients(this._hass);
    const toggles = this.constructor.toggles;
    if (!this._form) {
      this._form = document.createElement("ha-form");
      this._form.computeLabel = (s) => t(this._hass, this._config, s.name);
      this._form.computeHelper = (s) => STRINGS[lang(this._hass, this._config)][`${s.name}_helper`];
      this._form.addEventListener("value-changed", (ev) => {
        ev.stopPropagation();
        const config = { ...ev.detail.value };
        const defaults = Object.fromEntries(this.constructor.toggles);
        for (const [k, v] of Object.entries(config)) {
          // Keep the YAML minimal: drop empty values and toggles left at their default.
          if (v === "" || v === undefined || v === null || (k in defaults && v === defaults[k])) delete config[k];
        }
        this._config = config;
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }));
      });
      this.appendChild(this._form);
    }
    const data = { ...this._config };
    for (const [name, def] of toggles) if (data[name] === undefined) data[name] = def;
    if (!data.client) data.client = clients[0]?.value;
    this._form.hass = this._hass;
    // hass is pushed on every state change while the editor is open: reassign data and schema only when they changed.
    const dataKey = JSON.stringify(data);
    if (dataKey !== this._dataKey) {
      this._dataKey = dataKey;
      this._form.data = data;
    }
    const schemaKey = JSON.stringify([clients, lang(this._hass, this._config)]);
    if (schemaKey !== this._schemaKey) {
      this._schemaKey = schemaKey;
      this._form.schema = this._schema(clients);
    }
  }
}

class SeedboxCardEditor extends SeedboxEditorBase {
  static get toggles() {
    return [
      ["show_title", true],
      ["show_subtitle", true],
      ["show_speeds", true],
      ["show_history", true],
      ["show_counts", true],
      ["show_controls", true],
      ["show_torrents", true],
      ["expand_torrents", false],
    ];
  }
}

class SeedboxMiniCardEditor extends SeedboxEditorBase {
  static get toggles() {
    return [
      ["show_title", true],
      ["show_subtitle", true],
      ["show_history", true],
      ["show_footer", true],
      ["zoom", true],
    ];
  }
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

const define = (name, cls) => {
  if (!customElements.get(name)) customElements.define(name, cls);
};
define("seedbox-card", SeedboxCard);
define("seedbox-mini-card", SeedboxMiniCard);
define("seedbox-card-editor", SeedboxCardEditor);
define("seedbox-mini-card-editor", SeedboxMiniCardEditor);

window.customCards = window.customCards || [];
for (const card of [
  {
    type: "seedbox-card",
    name: "Seedbox Card",
    description: "Monitor and control a torrent client (Transmission, qBittorrent, Deluge): speeds, torrents and alternative speed.",
  },
  {
    type: "seedbox-mini-card",
    name: "Seedbox Mini Card",
    description: "Compact torrent client overview (Transmission, qBittorrent, Deluge): download and upload speeds, active torrents.",
  },
]) {
  if (!window.customCards.some((c) => c.type === card.type))
    window.customCards.push({ ...card, preview: true, documentationURL: "https://github.com/juju35/ha-seedbox-card" });
}

console.info(
  `%c SEEDBOX-CARD %c v${VERSION} `,
  "color: white; background: #43a047; font-weight: 700;",
  "color: #43a047; background: white; font-weight: 700;"
);
