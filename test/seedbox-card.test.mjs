import assert from "node:assert/strict";
import { test } from "node:test";
import { deluge, devices, entities, qbittorrent, states } from "../scripts/mock-states.mjs";
import { load } from "./load.mjs";

const {
  resolve,
  findClient,
  listClients,
  rateParts,
  fmtRate,
  fmtBytes,
  bytesOf,
  etaSeconds,
  fmtDuration,
  bucketize,
  torrentState,
  SeedboxCard,
  SeedboxMiniCard,
  SeedboxCardEditor,
} = load("seedbox-card.js", [
  "resolve",
  "findClient",
  "listClients",
  "rateParts",
  "fmtRate",
  "fmtBytes",
  "bytesOf",
  "etaSeconds",
  "fmtDuration",
  "bucketize",
  "torrentState",
  "SeedboxCard",
  "SeedboxMiniCard",
  "SeedboxCardEditor",
]);

// Values built in the card's own context have other Array / Object prototypes: compared as plain data.
const plain = (v) => JSON.parse(JSON.stringify(v));
const deq = (a, b, msg) => assert.deepEqual(plain(a), plain(b), msg);

const hassOf = (reg, extra = {}) => ({ states: reg.states, entities: reg.entities, devices: reg.devices, language: "en", locale: { language: "en" }, ...extra });
const tr = hassOf({ states, entities, devices });
const qb = hassOf(qbittorrent);
const dl = hassOf(deluge);
// All three clients in one Home Assistant.
const all = hassOf({
  states: { ...states, ...qbittorrent.states, ...deluge.states },
  entities: { ...entities, ...qbittorrent.entities, ...deluge.entities },
  devices: { ...devices, ...qbittorrent.devices, ...deluge.devices },
});

// A card with its config and hass set, rendering on demand (no DOM: _update only records the calls).
const card = (Cls, hass, config = {}) => {
  const el = new Cls();
  el._config = config;
  el._hass = hass;
  el._folds = {};
  el.updates = 0;
  el._update = () => {
    el.updates++;
  };
  return el;
};

test("resolution: Transmission entities by translation_key, whatever their entity ids", () => {
  const [c] = resolve(tr).clients;
  assert.equal(c.source, "transmission");
  assert.equal(c.name, "Seedbox");
  assert.equal(c.entryId, "entry_tr");
  assert.equal(c.entities.status, "sensor.seedbox_statut");
  assert.equal(c.entities.down, "sensor.seedbox_vitesse_de_telechargement");
  assert.equal(c.entities.up, "sensor.seedbox_vitesse_d_envoi");
  assert.equal(c.entities.total, "sensor.seedbox_torrents_total");
  assert.equal(c.entities.power, "switch.seedbox_marche");
  assert.equal(c.entities.alt, "switch.seedbox_mode_tortue");
});

test("resolution: qBittorrent limits and alternative speed, Deluge's switch without translation_key", () => {
  const q = resolve(qb).clients[0];
  assert.equal(q.entities.down_limit, "sensor.qbittorrent_limite_reception");
  assert.equal(q.entities.connection, "sensor.qbittorrent_connexion");
  assert.equal(q.entities.alt, "switch.qbittorrent_vitesse_alternative");
  assert.equal(q.entities.power, undefined);
  const d = resolve(dl).clients[0];
  assert.equal(d.entities.power, "switch.deluge");
  assert.equal(d.entities.downloading, "sensor.deluge_en_reception");
});

test("resolution: several clients sorted by name, picked by device id or name", () => {
  deq(
    resolve(all).clients.map((c) => c.name),
    ["Deluge", "qBittorrent", "Seedbox"]
  );
  deq(listClients(all).map((c) => c.label), ["Deluge", "qBittorrent", "Seedbox (Transmission)"]);
  assert.equal(findClient(all, {}).client.name, "Deluge");
  assert.equal(findClient(all, { client: "tr" }).client.name, "Seedbox");
  assert.equal(findClient(all, { client: "qBittorrent" }).client.source, "qbittorrent");
  assert.equal(findClient(all, { client: "nope" }).error, "unknown_client");
  assert.equal(findClient(hassOf({ states: {}, entities: {}, devices: {} }), {}).error, "no_client");
  assert.equal(findClient({ states: {} }, {}).error, "no_registry");
});

test("rates: decimal units from kB/s, one decimal under 100", () => {
  deq(rateParts(0, "en"), ["0.0", "kB/s"]);
  deq(rateParts(840000, "en"), ["840", "kB/s"]);
  deq(rateParts(8420000, "en"), ["8.4", "MB/s"]);
  deq(rateParts(24.6e6, "fr"), ["24,6", "MB/s"]);
  deq(rateParts(1.2e9, "en"), ["1.2", "GB/s"]);
  assert.equal(fmtRate(null), "—");
});

test("units: any displayed unit converted to bytes (per second)", () => {
  const s = (state, unit) => ({ state: String(state), attributes: { unit_of_measurement: unit } });
  assert.equal(bytesOf(s(8.42, "MB/s")), 8420000);
  assert.equal(bytesOf(s(3120.5, "kB/s")), 3120500);
  assert.equal(bytesOf(s(1, "MiB/s")), 1048576);
  assert.equal(bytesOf(s(8, "Mbit/s")), 1e6);
  assert.equal(bytesOf(s(2, "GiB")), 2 * 1024 ** 3);
  assert.equal(bytesOf(s("unavailable", "MB/s")), null);
  assert.equal(bytesOf(s(1, "parsecs")), null);
  assert.equal(fmtBytes(812.4 * 1024 ** 3, "en"), "812 GiB");
  assert.equal(fmtBytes(3.21 * 1024 ** 4, "en"), "3.21 TiB");
});

test("ETA: Transmission and qBittorrent formats, in two units", () => {
  assert.equal(etaSeconds("0:04:12"), 252);
  assert.equal(etaSeconds("02:03:04"), 7384);
  assert.equal(etaSeconds("1 day, 2:00:00"), 93600);
  assert.equal(etaSeconds("3 days, 0:30:00"), 261000);
  assert.equal(etaSeconds("None"), null);
  assert.equal(etaSeconds(undefined), null);
  assert.equal(fmtDuration(252, "en"), "4m");
  assert.equal(fmtDuration(7384, "en"), "2h 3m");
  assert.equal(fmtDuration(93600, "en"), "1d 2h");
  assert.equal(fmtDuration(20, "en"), "1m");
});

test("history: time-weighted 5-minute means, a gap where the state is not a number", () => {
  const start = 0;
  const end = 30 * 60000;
  const pts = bucketize(
    [
      { s: "1", lu: 0 },
      { s: "3", lu: 150 },
      { s: "unavailable", lu: 600 },
      { s: "2", lu: 1200 },
    ],
    start,
    end,
    1e6
  );
  deq(
    pts.map((p) => [p.t / 60000, p.v / 1e6]),
    [
      [0, 2],
      [5, 3],
      [20, 2],
      [25, 2],
    ]
  );
});

test("torrent states of both clients map to the card's own labels and colors", () => {
  deq(torrentState("downloading"), ["downloading", "ok"]);
  deq(torrentState("stopped"), ["paused", "idle"]);
  deq(torrentState("download pending"), ["queued", "warn"]);
  deq(torrentState("stalledDL"), ["stalled", "warn"]);
  deq(torrentState("missingFiles"), ["error", "crit"]);
  deq(torrentState("stoppedUP"), ["paused", "idle"]);
  deq(torrentState("whatever"), [null, "idle"]);
});

test("header chip: client status, qBittorrent connection first, unavailable in grey", () => {
  const chip = (hass) => card(SeedboxCard, hass)._status(findClient(hass, {}).client);
  deq(chip(tr).slice(0, 2), ["ok", "status_up_down"]);
  deq(chip(dl).slice(0, 2), ["ok", "status_up_down"], "Deluge's seeding_and_downloading");
  const with_ = (reg, id, state) => hassOf({ ...reg, states: { ...reg.states, [id]: { ...reg.states[id], state } } });
  deq(chip(with_(qbittorrent, "sensor.qbittorrent_connexion", "firewalled")).slice(0, 2), ["warn", "conn_firewalled"]);
  deq(chip(with_(qbittorrent, "sensor.qbittorrent_connexion", "disconnected")).slice(0, 2), ["crit", "conn_disconnected"]);
  deq(chip(with_({ states, entities, devices }, "sensor.seedbox_statut", "unavailable")).slice(0, 2), ["idle", "state_unavailable"]);
});

test("full card: speeds, counters, actions and the Transmission torrents from torrent_info", () => {
  const el = card(SeedboxCard, tr, { expand_torrents: true });
  const html = el._render();
  assert.match(html, /8\.4<small>MB\/s<\/small>/);
  assert.match(html, /1\.4<small>MB\/s<\/small>/);
  assert.match(html, /3\.21 TiB in total/);
  assert.match(html, /812 GiB free/);
  assert.match(html, /data-action="power"[^>]*>.*Pause all/s);
  assert.match(html, /data-action="alt"/);
  assert.equal((html.match(/class="item /g) || []).length, 7);
  assert.match(html, /4m left/);
  // Paused torrent: a resume button; the others: a pause button.
  assert.match(html, /data-id="5" data-paused="1"/);
  assert.match(html, /data-id="1" data-paused="0"/);
});

test("full card: options hide each part", () => {
  const html = card(SeedboxCard, tr, { show_speeds: false, show_counts: false, show_controls: false, show_torrents: false })._render();
  assert.doesNotMatch(html, /class="speeds"|class="counts"|class="actions"|data-section="torrents"/);
});

test("full card: torrents list folded by default, a click unfolds it", () => {
  const el = card(SeedboxCard, tr);
  assert.doesNotMatch(el._render(), /class="list"/);
  el._action("fold", { section: "torrents" });
  assert.match(el._render(), /class="list"/);
});

test("folding: a tap elsewhere (pointer), not a drag that ends outside; leaving the page folds back too", () => {
  const el = card(SeedboxCard, tr);
  el.connectedCallback();
  el._action("fold", { section: "torrents" });
  assert.match(el._render(), /class="list"/);
  // A slider pressed in the card and released outside of it: nothing folds.
  el._outside.tap({ composedPath: () => [el] });
  assert.match(el._render(), /class="list"/);
  // A tap on a spot that sends no click (iOS): the pointer alone folds it.
  el._outside.tap({ composedPath: () => [] });
  assert.doesNotMatch(el._render(), /class="list"/);
  // Left unfolded and back: folded.
  el._action("fold", { section: "torrents" });
  el.disconnectedCallback();
  el.connectedCallback();
  assert.doesNotMatch(el._render(), /class="list"/);
  el.disconnectedCallback();
  // The mini card folds back to its compact view, on a tap elsewhere and when it leaves the page.
  const mini = card(SeedboxMiniCard, tr);
  mini.connectedCallback();
  mini._zoomed = true;
  mini._unzoom.tap({ composedPath: () => [] });
  assert.equal(mini._zoomed, false);
  mini._zoomed = true;
  mini.disconnectedCallback();
  assert.equal(mini._zoomed, false);
});

test("no rewrite under a press: drawn by the click, or once released", async () => {
  const el = new SeedboxCard();
  el._config = {};
  el._hass = tr;
  el._folds = {};
  let renders = 0;
  el._render = () => {
    renders++;
    return "";
  };
  el._onPressStart();
  el._update();
  assert.equal(renders, 0, "no rewrite under the pointer");
  // The click renders at once.
  el._onClick({ composedPath: () => [{ dataset: { action: "fold", section: "torrents" } }], stopPropagation() {} });
  assert.equal(renders, 1);
  // A press with no click (released on a spot with no action, or the browser cancels it): drawn once released.
  el._onPressStart();
  el._update();
  assert.equal(renders, 1);
  el._onPressEnd();
  await new Promise((r) => setTimeout(r, 5));
  assert.equal(renders, 2);
  assert.equal(el._pressing, false);
});

test("full card: search filters the torrents by name", () => {
  const el = card(SeedboxCard, tr, { expand_torrents: true });
  el._query = "ISO";
  assert.equal((el._render().match(/class="item /g) || []).length, 4);
  el._query = "zzz";
  assert.match(el._render(), /No matching torrent/);
});

test("qBittorrent: torrents read from get_torrents, errors first, no per-torrent buttons", async () => {
  const calls = [];
  const hass = {
    ...qb,
    callService: async (...args) => {
      calls.push(args);
      return { response: { torrents: qbittorrent.torrents } };
    },
  };
  const el = card(SeedboxCard, hass, { expand_torrents: true });
  el._render();
  await new Promise((r) => setTimeout(r, 0));
  deq(calls[0].slice(0, 3), ["qbittorrent", "get_torrents", { device_id: "qb", torrent_filter: "all" }]);
  assert.equal(calls[0][5], true, "asks for the response");
  const html = el._render();
  assert.equal((html.match(/class="item /g) || []).length, 5);
  assert.ok(html.indexOf("Elephants Dream") < html.indexOf("openSUSE"), "the torrent in error comes first");
  assert.doesNotMatch(html, /data-action="torrent"/);
  assert.match(html, /Limit 40\.0 MB\/s/);
  // Read again only after a minute.
  el._render();
  assert.equal(calls.length, 1);
});

test("Deluge: no torrents list, downloading and seeding counters, its web UI behind the icon", () => {
  const html = card(SeedboxCard, dl)._render();
  assert.doesNotMatch(html, /data-section="torrents"/);
  assert.match(html, /Downloading<\/div>/);
  assert.match(html, /href="http:\/\/192\.168\.1\.20:8112"/);
  assert.match(html, /3\.1<small>MB\/s<\/small>/);
});

test("actions: pausing everything asks first, resuming and the alternative speed do not", () => {
  const calls = [];
  const hass = { ...tr, callService: (...a) => calls.push(a) };
  const el = card(SeedboxCard, hass);
  el._openConfirm = (c) => {
    el.confirm = c;
  };
  el._action("power", { entity: "switch.seedbox_marche", label: "Seedbox" });
  assert.equal(calls.length, 0);
  assert.equal(el.confirm.text, "Pause every torrent of Seedbox?");
  el.confirm.run();
  return Promise.resolve().then(() => {
    deq(calls[0], ["switch", "turn_off", { entity_id: "switch.seedbox_marche" }]);
    el._action("alt", { entity: "switch.seedbox_mode_tortue" });
    return Promise.resolve().then(() => deq(calls[1], ["switch", "turn_on", { entity_id: "switch.seedbox_mode_tortue" }]));
  });
});

test("actions: a Transmission torrent is resumed at once, paused after confirmation", async () => {
  const calls = [];
  const el = card(SeedboxCard, { ...tr, callService: (...a) => calls.push(a) });
  el._openConfirm = (c) => {
    el.confirm = c;
  };
  el._action("torrent", { id: "5", paused: "1", label: "archlinux" });
  await Promise.resolve();
  deq(calls[0], ["transmission", "start_torrent", { entry_id: "entry_tr", id: 5 }]);
  el._action("torrent", { id: "1", paused: "0", label: "debian" });
  assert.equal(calls.length, 1);
  el.confirm.run();
  await Promise.resolve();
  deq(calls[1], ["transmission", "stop_torrent", { entry_id: "entry_tr", id: 1 }]);
});

test("mini card: speed rows scaled on the limit, active torrents, footer counters", () => {
  const html = card(SeedboxMiniCard, qb)._render();
  assert.match(html, /width:61\.5%/, "24.6 MB/s of a 40 MB/s limit");
  assert.match(html, /2\/5/);
  assert.match(html, /Errors 1/);
  assert.match(html, /Alternative speed/);
  assert.match(html, /class="zoom"/);
  assert.doesNotMatch(card(SeedboxMiniCard, qb, { zoom: false, show_footer: false })._render(), /class="zoom"|class="foot"/);
});

test("both cards: the reduced-motion block comes last", () => {
  for (const Cls of [SeedboxCard, SeedboxMiniCard]) {
    const css = card(Cls, tr)._render().match(/<style>([\s\S]*?)<\/style>/)[1];
    assert.match(css.trim(), /@media \(prefers-reduced-motion: reduce\)[\s\S]*\}\s*\}$/);
  }
});

test("editor: options left at their default stay out of the YAML", () => {
  const ed = new SeedboxCardEditor();
  ed.appendChild = () => {};
  ed.dispatchEvent = () => {};
  ed._config = {};
  ed._hass = tr;
  ed._render();
  ed._form.listeners["value-changed"]({ stopPropagation() {}, detail: { value: { client: "tr", show_speeds: true, expand_torrents: true, title: "" } } });
  deq(ed._config, { client: "tr", expand_torrents: true });
  deq(ed._form.data.show_speeds, true);
});
