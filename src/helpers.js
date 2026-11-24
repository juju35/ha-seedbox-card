// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
import { STRINGS } from "./i18n/strings.js";

export const esc = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export const lang = (hass, config) => {
  const l = config?.language || (hass && (hass.locale?.language || hass.language)) || "en";
  return STRINGS[l] ? l : STRINGS[l.split("-")[0]] ? l.split("-")[0] : "en";
};

export const t = (hass, config, key, vars = {}) =>
  String(STRINGS[lang(hass, config)][key] ?? STRINGS.en[key] ?? key).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");

// Locale of the numbers: Home Assistant's own language when its base matches the card's language (keeps the
// region, e.g. de-CH or fr-CA), otherwise the card's language. Home Assistant's "pt" is European Portuguese,
// which Intl would format as Brazilian, so bare "pt" becomes "pt-PT".
export const fmtLang = (hass, config) => {
  const l = lang(hass, config);
  const ha = hass && (hass.locale?.language || hass.language);
  const loc = ha && ha.split("-")[0] === l ? ha : l;
  return loc === "pt" ? "pt-PT" : loc;
};

export const known = (s) => !!s && s.state !== "unknown" && s.state !== "unavailable";

export const num = (s) => {
  if (!known(s)) return null;
  const v = parseFloat(s.state);
  return Number.isFinite(v) ? v : null;
};

// Number in the card's language ("1,5" in French): at most `max` decimals, exactly `max` when `fixed`.
export const _numFormats = new Map();
export const fmtNum = (v, locale, max, fixed = false) => {
  const key = `${locale}|${max}|${fixed}`;
  let f = _numFormats.get(key);
  if (!f) {
    f = new Intl.NumberFormat(locale, { maximumFractionDigits: max, minimumFractionDigits: fixed ? max : 0 });
    _numFormats.set(key, f);
  }
  return f.format(v);
};

// Data size (bytes) in binary units, 2 decimals under 10, 1 under 100, none above, as the other ha-* cards.
export const fmtBytes = (b, locale = "en") => {
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
export const rateParts = (bps, locale = "en") => {
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
export const fmtRate = (bps, locale) => rateParts(bps, locale)?.join(" ") ?? "—";

// A state in bytes, or in bytes per second, whatever unit Home Assistant displays it in (the integrations suggest
// MB/s, GiB, TiB; Deluge reports kB/s).
export const UNITS = {
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
export const unitFactor = (unit) => UNITS[String(unit ?? "B").replace(/\/s$/, "")] ?? null;
export const bytesOf = (s) => {
  const v = num(s);
  const k = unitFactor(s?.attributes?.unit_of_measurement);
  return v === null || k === null ? null : v * k;
};

// Progress (0-100) as a percentage in the card's language ("45.5%", "45,5 %"), whole once done.
export const fmtPercent = (v, locale = "en") =>
  new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: v < 100 ? 1 : 0 }).format(v / 100);

// "1 day, 2:03:04", "2:03:04" (Transmission) or "02:03:04" (qBittorrent) -> seconds; null when unknown ("None").
export const etaSeconds = (eta) => {
  const m = /^(?:(\d+) days?, )?(\d+):(\d{2}):(\d{2})/.exec(String(eta ?? "").trim());
  if (!m) return null;
  return (Number(m[1] || 0) * 24 + Number(m[2])) * 3600 + Number(m[3]) * 60 + Number(m[4]);
};

// A duration in its two largest units, in the card's language ("2 d 5 h", "1 h 05 min" -> "1 h 5 min").
export const fmtDuration = (sec, locale = "en") => {
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
export const clientStatus = (state) => (state === "seeding_and_downloading" ? "up_down" : state);

// Torrent status of Transmission or qBittorrent -> the card's own: [label key, color class].
export const TORRENT_STATES = {
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
export const torrentState = (status) => TORRENT_STATES[status] ?? [null, "idle"];

// Same values, compared by identity: used to skip a render when nothing the card shows has changed.
export const sameSig = (a, b) => !!a && !!b && a.length === b.length && a.every((v, i) => v === b[i]);

// Patch the shadow DOM in place from the new HTML: nodes whose tag is unchanged are kept, so keyboard focus, hover,
// the search field and CSS transitions survive an update. Rows of a list carry a data-key and are matched by it.
export const patchAttrs = (cur, next) => {
  for (const { name } of [...cur.attributes]) if (!next.hasAttribute(name)) cur.removeAttribute(name);
  for (const { name, value } of next.attributes) if (cur.getAttribute(name) !== value) cur.setAttribute(name, value);
};
export const keyOf = (n) => (n.nodeType === 1 ? n.getAttribute("data-key") : null);
export const sameNode = (a, b) => !!a && a.nodeType === b.nodeType && a.nodeName === b.nodeName;
export const place = (parent, node, ref) => {
  if (node === ref) return;
  try {
    if (parent.moveBefore && node.parentNode === parent) return parent.moveBefore(node, ref);
  } catch (_e) {
    /* fall back to insertBefore */
  }
  parent.insertBefore(node, ref);
};
export const patchChildren = (cur, next) => {
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
export const morph = (root, html) => {
  const tpl = document.createElement("template");
  tpl.innerHTML = html;
  patchChildren(root, tpl.content);
};

// The whole width of an element's text in its own font, an ellipsised one included.
export const textWidth = (el) => {
  const range = document.createRange();
  range.selectNodeContents(el);
  return range.getBoundingClientRect().width;
};

export const svgIcon = (path, cls = "") => `<svg class="icon ${cls}" viewBox="0 0 24 24"><path d="${path}"/></svg>`;
