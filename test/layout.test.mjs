// Browser test (Chromium through Playwright): from the narrowest width of the Sections view (6 columns of a 320 px
// section, about 156 px) to a full 460 px column, in long translations, nothing of the header, the speed tiles, the
// counters, the buttons or the mini card rows leaves the card, and the title never collapses. Skipped when Chromium
// is not installed, except in CI, where it must run.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { after, before, test } from "node:test";
import { devices, entities, qbittorrent, states } from "../scripts/mock-states.mjs";

const src = readFileSync(new URL("../src/seedbox-card.js", import.meta.url), "utf8");
let browser;
let skip = false;
before(async () => {
  try {
    const { chromium } = await import("playwright");
    browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  } catch (err) {
    if (process.env.CI) throw err;
    skip = `Chromium not available: ${err.message.split("\n")[0]}`;
  }
});
after(() => browser?.close());

const HA_CARD = `customElements.define("ha-card", class extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" }).innerHTML =
      "<style>:host{display:block;border-radius:12px;border:1px solid #ddd;overflow:hidden}</style><slot></slot>";
  }
});`;

const measure = async (cards, reg) => {
  const page = await browser.newPage({ viewport: { width: 1000, height: 1400 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setContent(
    `<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;font-family:Roboto,Helvetica,Arial,sans-serif}</style></head><body><div id="root"></div></body></html>`
  );
  await page.addScriptTag({ content: HA_CARD });
  await page.addScriptTag({ content: src });
  const out = await page.evaluate(
    ({ cards, reg }) => {
      const res = [];
      for (const { type, width, language, zoom } of cards) {
        const box = document.createElement("div");
        box.style.width = `${width}px`;
        document.getElementById("root").replaceChildren(box);
        const el = document.createElement(type);
        el.setConfig({ type: `custom:${type}`, language, expand_torrents: true });
        el.hass = { ...reg, language, locale: { language }, callService: async () => ({ response: { torrents: reg.torrents || {} } }) };
        box.appendChild(el);
        if (zoom) el.shadowRoot.querySelector(".zoom").dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true, detail: 1 }));
        const r = el.shadowRoot;
        const card = r.querySelector("ha-card").getBoundingClientRect();
        const outside = [...r.querySelectorAll(".header > *, .speed, .count-tile, .act, .metric > *, .foot > span, .item .ctrl, .search")]
          .filter((n) => {
            const b = n.getBoundingClientRect();
            return b.width > 0 && (b.right > card.right + 0.5 || b.left < card.left - 0.5);
          })
          .map((n) => n.className.baseVal ?? n.className);
        const title = r.querySelector(".titles")?.getBoundingClientRect().width ?? 0;
        res.push({ type, width, language, zoom: !!zoom, outside, title });
      }
      return res;
    },
    { cards, reg }
  );
  await page.close();
  return { out, errors };
};

const variants = [];
for (const width of [156, 240, 340, 460])
  for (const language of ["en", "de", "el"])
    for (const [type, zoom] of [
      ["seedbox-card", false],
      ["seedbox-mini-card", false],
      ["seedbox-mini-card", true],
    ])
      variants.push({ type, width, language, zoom });

for (const [name, reg] of [
  ["Transmission", { states, entities, devices }],
  ["qBittorrent", { states: qbittorrent.states, entities: qbittorrent.entities, devices: qbittorrent.devices, torrents: qbittorrent.torrents }],
]) {
  test(`layout (${name}): nothing leaves the card and the title keeps some room, 156 to 460 px`, async (t) => {
    if (skip) return t.skip(skip);
    const { out, errors } = await measure(variants, reg);
    assert.deepEqual(errors, []);
    for (const m of out) {
      const what = `${m.type}${m.zoom ? " (zoomed)" : ""} ${m.width}px ${m.language}`;
      assert.deepEqual(m.outside, [], `${what}: outside the card`);
      assert.ok(m.title >= 30, `${what}: title ${m.title}px`);
    }
  });
}
