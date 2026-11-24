// ---------------------------------------------------------------------------
// Registry-based resolution
// ---------------------------------------------------------------------------
import { SOURCES } from "./core.js";
import { fmtRate } from "./helpers.js";

export const _cache = new WeakMap();

/**
 * Clients from hass.entities / hass.devices: one per device of the Transmission, qBittorrent or Deluge integration,
 * { id, name, source, entryId, entities: { status, down, up, … } }, sorted by name.
 */
export const resolve = (hass) => {
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

export const listClients = (hass) => {
  const m = hass && resolve(hass);
  return m ? m.clients.map((c) => ({ value: c.id, label: c.name === SOURCES[c.source].name ? c.name : `${c.name} (${SOURCES[c.source].name})` })) : [];
};

export const findClient = (hass, config) => {
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
export const HIST_PERIOD = 5 * 60000;
export const HIST_REFRESH = HIST_PERIOD;
export const HIST_WINDOW = 864e5;

export function bucketize(changes, start, end, factor) {
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
export function rangeText(points, loc) {
  if (!points || points.length < 2) return "";
  const vs = points.map((p) => p.v);
  return ` · 24 h ${fmtRate(Math.min(...vs), loc)} – ${fmtRate(Math.max(...vs), loc)}`;
}

// Sparkline of { t, v } points on a real 24 h time axis ending at `end`, scaled from 0 to `max` (else the peak);
// broken where two points are more than two periods apart.
export function spark(points, end, max) {
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
// Illustrated header: the seedbox (a server rack) in the middle of its swarm of peers, on a 200 × 80 picture at the
// right of a 90 px banner, over a 10 px soil strip. Packets travel along the links: green into the server while it
// downloads, blue out to the peers while it seeds. Paused or idle, nothing moves and the server's lights are off;
// disconnected, its lights blink red.
// ---------------------------------------------------------------------------

// Peers [x, y] and the server's centre.
export const SB_PEERS = [
  [70, 14],
  [118, 8],
  [176, 12],
  [52, 42],
  [190, 46],
  [96, 68],
  [160, 70],
  [64, 70],
  [140, 30],
];
export const SB_SRV = [124, 44];
// Peer-to-peer links besides the ones to the server.
export const SB_MESH = [
  [0, 1],
  [3, 7],
  [2, 4],
  [5, 6],
];

// The picture's state from the header status (class and label key): down, up, both (packets), paused or error.
export const sceneState = (cls, key) => {
  if (cls === "crit") return "error";
  if (key === "status_downloading") return "down";
  if (key === "status_seeding") return "up";
  if (key === "status_up_down") return "both";
  return "paused";
};

// Night picture: forced by illustration_theme, else Home Assistant's dark mode alone (a light theme keeps the day
// picture after sunset).
export const isNight = (hass, config) => {
  const theme = config.illustration_theme;
  if (theme === "night") return true;
  if (theme === "day") return false;
  return !!hass?.themes?.darkMode;
};

// The picture. `uid` keeps each card's ids apart on a page with several cards; `warn` turns one light amber.
export const sbSceneSvg = (state, uid, warn) => {
  const [sx, sy] = SB_SRV;
  // Background dots, spread over the picture (no random: the same picture on every render).
  const dots = Array.from({ length: 40 }, (_, i) => `<circle cx="${(i * 37) % 200}" cy="${(i * 23) % 80}" r=".7"/>`).join("");
  const links = [
    ...SB_PEERS.map(([x, y]) => `<line x1="${x}" y1="${y}" x2="${sx}" y2="${sy}"/>`),
    ...SB_MESH.map(([a, b]) => `<line x1="${SB_PEERS[a][0]}" y1="${SB_PEERS[a][1]}" x2="${SB_PEERS[b][0]}" y2="${SB_PEERS[b][1]}"/>`),
  ].join("");
  // Packets: down = peer -> server (green), up = server -> peer (blue); both alternates.
  const dirOf = (i) => (state === "both" ? (i % 2 ? "up" : "dn") : state === "down" ? "dn" : state === "up" ? "up" : null);
  const packets = SB_PEERS.map(([x, y], i) => {
    const d = dirOf(i);
    if (!d) return "";
    const path = d === "up" ? `M${sx} ${sy} L${x} ${y}` : `M${x} ${y} L${sx} ${sy}`;
    return `<circle class="sb-pkt ${d} pk${i}" r="1.8" style="offset-path:path('${path}')"/>`;
  }).join("");
  const peers = SB_PEERS.map(
    ([x, y]) =>
      `<g transform="translate(${x} ${y}) scale(1.25)"><circle class="sb-peer" r="4.6"/><circle class="sb-fig" cy="-1" r="1.4"/><path class="sb-fig" d="M-2.4 2.4a2.4 2 0 0 1 4.8 0"/></g>`
  ).join("");
  const led = (i) => {
    const c = state === "error" ? "err" : state === "paused" ? "off" : warn && i === 0 ? "warn" : i === 1 ? "up" : "dn";
    return `<circle class="sb-led ${c}" cx="-7" cy="${-8.5 + i * 9}" r="1" style="animation-delay:${i * 0.3}s"/>`;
  };
  const bays = [0, 1, 2]
    .map((i) => `<rect class="sb-bay" x="-10" y="${-12 + i * 9}" width="20" height="7" rx="1.2"/>${led(i)}<rect class="sb-slot" x="-3" y="${-9.2 + i * 9}" width="10" height="1.4" rx=".7"/>`)
    .join("");
  // Paused: a pause sign on the server; disconnected: an exclamation mark.
  const mark =
    state === "paused"
      ? `<g class="sb-mark paused" transform="translate(13 -15)"><circle r="5"/><path d="M-1.6 -2.2v4.4M1.6 -2.2v4.4"/></g>`
      : state === "error"
        ? `<g class="sb-mark error" transform="translate(13 -15)"><circle r="5"/><path d="M0 -2.6v2.8M0 2.1v.4"/></g>`
        : "";
  return `<svg class="sb-scene ${state}" viewBox="0 0 200 80" preserveAspectRatio="xMaxYMax meet" aria-hidden="true" focusable="false">
    <defs><filter id="sb-glow-${uid}" x="-1" y="-1" width="3" height="3"><feGaussianBlur stdDeviation=".8"/></filter></defs>
    <g class="sb-dots">${dots}</g>
    <g class="sb-links">${links}</g>
    <g class="sb-pkts" filter="url(#sb-glow-${uid})">${packets}</g><g class="sb-pkts">${packets}</g>
    ${peers}
    <g transform="translate(${sx} ${sy}) scale(1.35)"><rect class="sb-srv" x="-13" y="-15" width="26" height="30" rx="3"/>${bays}${mark}</g>
  </svg><div class="sb-ground" aria-hidden="true"></div>`;
};

// The banner: plain background with the picture at the right and the soil strip, day and night.
export const SCENE_STYLE = `
  .banner { position: relative; overflow: hidden; height: 90px; --sb-g: 10px; --sb-scene-w: min(200px, 46cqw);
            background: #eef2f8; color: #0d2a45; --sb-muted: #3b5b78; }
  .banner.night { background: #1c2230; color: #fff; --sb-muted: rgba(255,255,255,.78); }
  .sb-scene { position: absolute; right: 0; bottom: var(--sb-g); height: calc(100% - var(--sb-g)); width: var(--sb-scene-w); }
  .sb-ground { position: absolute; left: 0; right: 0; bottom: 0; height: var(--sb-g);
               background: repeating-linear-gradient(90deg, #8a5a3a 0 16px, #7a4e32 16px 18px); box-shadow: inset 0 2px 0 #5aa83d; }
  .night .sb-ground { background: repeating-linear-gradient(90deg, #3a2c22 0 16px, #30241c 16px 18px); box-shadow: inset 0 2px 0 #1f4a2a; }
  .sb-dots { fill: #dde6f2; } .night .sb-dots { fill: #26324a; }
  .sb-links { stroke: #c4d0e0; stroke-width: .8; } .night .sb-links { stroke: #3a4a66; }
  .paused .sb-links, .error .sb-links { opacity: .6; } .error .sb-links { stroke-dasharray: 2 2; }
  .sb-peer { fill: #fff; stroke: #a9b8cc; } .night .sb-peer { fill: #2a3446; stroke: #4a5a7a; }
  .sb-fig { fill: #7d8ca3; } .night .sb-fig { fill: #8fa3c4; }
  .sb-srv { fill: #2a3038; } .night .sb-srv { fill: #2e3746; }
  .sb-bay { fill: #3d4552; } .night .sb-bay { fill: #3a4456; }
  .sb-slot { fill: #5c6678; }
  .sb-led.dn { fill: #43c463; } .sb-led.up { fill: #2f80ed; } .sb-led.warn { fill: #ffa600; } .sb-led.err { fill: #e5484d; } .sb-led.off { fill: #6b7587; }
  .sb-led.dn, .sb-led.up, .sb-led.warn, .sb-led.err { animation: sb-blink 1.2s steps(2) infinite; }
  .sb-mark circle { stroke: #fff; stroke-width: 1; } .night .sb-mark circle { stroke: #1c2230; }
  .sb-mark path { stroke: #fff; stroke-width: 1.3; stroke-linecap: round; fill: none; }
  .sb-mark.paused circle { fill: #8a95a5; } .sb-mark.error circle { fill: #e5484d; }
  .sb-pkt { offset-distance: 50%; offset-rotate: 0deg; animation: sb-pkt 2.4s linear infinite; }
  .sb-pkt.dn { fill: #43a047; } .sb-pkt.up { fill: #2f80ed; }
  .night .sb-pkt.dn { fill: #5bd16a; } .night .sb-pkt.up { fill: #5aa2ff; }
  .sb-pkts[filter] { opacity: .55; }
  .pk1 { animation-delay: -.3s; } .pk2 { animation-delay: -.6s; } .pk3 { animation-delay: -.9s; } .pk4 { animation-delay: -1.2s; }
  .pk5 { animation-delay: -1.5s; } .pk6 { animation-delay: -1.8s; } .pk7 { animation-delay: -2.1s; } .pk8 { animation-delay: -2.4s; }
  @keyframes sb-pkt { from { offset-distance: 0%; opacity: 0; } 15% { opacity: 1; } 85% { opacity: 1; } to { offset-distance: 100%; opacity: 0; } }
  @keyframes sb-blink { 50% { opacity: .25; } }
  /* The text on the left, over the plain background; it stops where the picture starts. */
  .htext { position: absolute; z-index: 1; left: 0; top: 0; bottom: var(--sb-g); right: calc(var(--sb-scene-w) + 4px);
           display: flex; align-items: center; gap: 10px; padding: 8px 4px 8px 14px; min-width: 0; box-sizing: border-box; }
  .htext .titles { flex: 1 1 auto; min-width: 0; display: flex; flex-flow: row wrap; align-items: center; column-gap: 8px; row-gap: 1px; }
  .htext .titles > * { flex: 1 0 100%; min-width: 0; }
  /* The title, then its status pill 8 px after it, centred on it, while the whole title and the pill's whole label fit
     on that row; otherwise (measured by the card, see _fitPill) the title takes its whole line and the pill goes under
     the subtitle (.below), its dot alone (.pill-dot) when even then the text would run into the ground strip. */
  .htext .trow { display: flex; align-items: center; gap: 8px; min-width: 0; }
  .htext .name { flex: 0 1 auto; min-width: 0; font-size: 16px; font-weight: 500; }
  .htext .chip { flex: none; min-width: 0; max-width: none; overflow: hidden; line-height: 16px; box-sizing: border-box; white-space: nowrap;
                 background: color-mix(in srgb, var(--c) 18%, rgba(255,255,255,.78)); color: color-mix(in srgb, var(--c) 45%, #0d2a45); }
  .banner.night .htext .chip { background: color-mix(in srgb, var(--c) 30%, rgba(8,18,38,.55)); color: color-mix(in srgb, var(--c) 35%, #ffffff); }
  .htext .chip .dot { width: 7px; height: 7px; }
  .htext .sub { font-size: 12px; line-height: 15px; color: var(--sb-muted); opacity: .85; }
  .htext .titles.below { display: flex; }
  .htext .titles.below .trow { display: contents; }
  .htext .titles.below .name { flex: 1 0 100%; }
  .htext .titles.below .sub { order: 1; }
  .htext .titles.below .chip { order: 2; margin-top: 2px; max-width: 100%; }
  .htext .titles.pill-dot .chip { padding: 5px; }
  /* Under 200 px only its dot shows (its text stays its tooltip and accessible name). */
  @container (max-width: 200px) { .htext .chip { flex: none; padding: 5px; } .htext .chip .chip-label { display: none; } }
  .banner .logo { background: rgba(255,255,255,.62); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--c) 22%, transparent); }
  .banner.night .logo { background: rgba(255,255,255,.12); box-shadow: inset 0 0 0 1px rgba(255,255,255,.14); }
  .banner.night .logo.idle { --c: #9aa3b0; }
  /* The mini card's detail button: round, frosted, in the top right corner of the banner. */
  .banner .zoom { position: absolute; z-index: 2; top: 5px; right: 5px; margin: 0; color: #33506b; background: rgba(255,255,255,.55);
                  box-shadow: inset 0 0 0 1px rgba(255,255,255,.7); backdrop-filter: blur(4px); }
  .banner .zoom:hover { background: rgba(255,255,255,.75); color: #33506b; }
  .banner.night .zoom { color: #fff; background: rgba(255,255,255,.12); box-shadow: inset 0 0 0 1px rgba(255,255,255,.2); }
  .banner.night .zoom:hover { background: rgba(255,255,255,.22); color: #fff; }
  .banner + .content { padding-top: 12px; }
  /* Narrow card: no room for the picture beside the title and its pill, the background and the strip stay. */
  @container (max-width: 300px) {
    .sb-scene { display: none; }
    .htext { right: 0; }
    :host([mini]) .htext { right: 30px; }
  }
`;
