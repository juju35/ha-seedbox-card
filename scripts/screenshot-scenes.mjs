// The README captures rendered by scripts/screenshots.mjs: one entry per PNG (`shots`) and per GIF (`gifs`).
// Kept apart from the renderer so the tests can check them without a browser.
import { deluge, qbittorrent } from "./mock-states.mjs";

// qBittorrent and Deluge scenes: their own registries and states.
const qb = { states: qbittorrent.states, entities: qbittorrent.entities, devices: qbittorrent.devices, torrents: qbittorrent.torrents };
const dl = { states: deluge.states, entities: deluge.entities, devices: deluge.devices };

// Every capture is rendered in both themes: each light shot gets a `-dark` twin with the exact same setup.
const lightShots = [
  { file: "card", type: "seedbox-card", theme: "light", width: 460, config: {} },
  { file: "card-torrents", type: "seedbox-card", theme: "light", width: 460, config: { expand_torrents: true } },
  { file: "mini-card", type: "seedbox-mini-card", theme: "light", width: 380, config: {} },
  { file: "mini-card-zoom", type: "seedbox-mini-card", theme: "light", width: 460, config: {}, zoom: true },
  { file: "card-qbittorrent", type: "seedbox-card", theme: "light", width: 460, config: { expand_torrents: true }, ...qb },
  { file: "mini-card-qbittorrent", type: "seedbox-mini-card", theme: "light", width: 380, config: {}, ...qb },
  { file: "card-deluge", type: "seedbox-card", theme: "light", width: 460, config: {}, ...dl },
  { file: "mini-card-deluge", type: "seedbox-mini-card", theme: "light", width: 380, config: {}, ...dl },
];
const withDarkTwins = (light) => [...light, ...light.map((s) => ({ ...s, file: `${s.file}-dark`, theme: "dark" }))];
export const shots = withDarkTwins(lightShots);

// One looping GIF per animation. Each scenario replays `events` (a click on a card element, or a state update) at
// fixed times; every animation is paused and stepped frame by frame from the event that started it, so the GIF is
// identical whatever the machine's speed. `measure` is clicked once beforehand to size the frame on the tallest state.
const lightGifs = [
  {
    file: "card-torrents",
    type: "seedbox-card",
    theme: "light",
    width: 460,
    config: {},
    seconds: 4,
    measure: ['[data-section="torrents"]'],
    events: [
      { at: 0.5, click: '[data-section="torrents"]' },
      { at: 2.9, click: '[data-section="torrents"]' },
    ],
  },
  {
    file: "mini-card-speeds",
    type: "seedbox-mini-card",
    theme: "light",
    width: 380,
    config: { show_history: false },
    seconds: 4,
    events: [
      { at: 0.5, states: { "sensor.seedbox_vitesse_de_telechargement": { state: "2.10" }, "sensor.seedbox_vitesse_d_envoi": { state: "0.42" } } },
      { at: 2.2, states: { "sensor.seedbox_vitesse_de_telechargement": { state: "8.42" }, "sensor.seedbox_vitesse_d_envoi": { state: "1.37" } } },
    ],
  },
  {
    file: "card-alt-speed",
    type: "seedbox-card",
    theme: "light",
    width: 460,
    config: { show_torrents: false },
    seconds: 3,
    events: [
      { at: 0.6, states: { "switch.seedbox_mode_tortue": { state: "on" } } },
      { at: 2, states: { "switch.seedbox_mode_tortue": { state: "off" } } },
    ],
  },
  {
    file: "mini-card-zoom",
    type: "seedbox-mini-card",
    theme: "light",
    width: 460,
    config: {},
    seconds: 4,
    measure: [".zoom"],
    events: [
      { at: 0.6, click: ".zoom" },
      { at: 2.9, click: ".zoom" },
    ],
  },
];
export const gifs = withDarkTwins(lightGifs);
