// Browser test (Chromium through Playwright) of the status pill, in en, fr, de, hu, el and ru from 190 to 500 px,
// with the client's own title and a long one, on the full card and the mini card (compact and expanded): the pill
// sits right after the title only beside a whole title (never an ellipsised title next to it), its label is whole or
// it shows its dot alone (always its dot alone at 200 px or less), and nothing of the title block leaves the banner
// or reaches its ground strip. Skipped when Playwright or Chromium is not installed, except in CI, where it must run.
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { devices, entities, states } from "../scripts/mock-states.mjs";
import { source } from "./source.mjs";

const src = source;

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
    this.attachShadow({ mode: "open" }).innerHTML = "<style>:host{display:block;border-radius:12px;border:1px solid #ddd;overflow:hidden}</style><slot></slot>";
  }
});`;

// In-page audit of the header (string spliced into page.evaluate): every title block with a status pill —
// the pill on the title row only beside a whole title, its label whole or its dot alone (≤ 200 px: dot alone),
// nothing of the title block below the banner's ground strip or outside the banner.
const pillAudit = (r, width, pillSel, nameSel, groundSel, bannerSel = ".banner") => {
  const res = [];
  const shown = (e) => e && e.getClientRects().length && getComputedStyle(e).visibility !== "hidden";
  const cut = (e) => [e, ...e.querySelectorAll("*")].some((x) => shown(x) && x.clientWidth > 1 && getComputedStyle(x).overflow !== "visible" && x.scrollWidth > x.clientWidth + 1);
  const pills = [...r.querySelectorAll(pillSel)].filter(shown);
  if (!pills.length) return ["no pill"];
  for (const pill of pills) {
    const pb = pill.getBoundingClientRect();
    const dot = pb.width < 30;
    if (width <= 200 && !dot) res.push(`pill "${pill.textContent.trim()}" not a dot at ${width}px`);
    if (!dot && cut(pill)) res.push(`pill "${pill.textContent.trim()}" label cut`);
    const name = pill.parentElement.querySelector(nameSel) || pill.closest(".titles")?.querySelector(nameSel);
    if (shown(name)) {
      const nb = name.getBoundingClientRect();
      const onRow = Math.abs(pb.top + pb.height / 2 - (nb.top + nb.height / 2)) < nb.height / 2;
      const range = document.createRange();
      range.selectNodeContents(name);
      if (onRow && range.getBoundingClientRect().width > nb.width + 0.01) res.push(`title "${name.textContent.trim()}" ellipsised beside the pill`);
    }
    const banner = pill.closest(bannerSel);
    if (!banner) continue;
    const bb = banner.getBoundingClientRect();
    const floor = banner.querySelector(groundSel)?.getBoundingClientRect().top ?? bb.bottom;
    const block = pill.closest(".titles") || pill.parentElement;
    for (const x of [block, ...block.children, ...block.querySelectorAll(":scope > .trow > *")]) {
      if (!shown(x)) continue;
      const xb = x.getBoundingClientRect();
      if (!xb.width || !xb.height) continue;
      if (xb.bottom > floor + 0.5 || xb.top < bb.top - 0.5 || xb.right > bb.right + 0.5 || xb.left < bb.left - 0.5) {
        res.push(`${x.className || x.tagName} outside the banner above its ground strip`);
        break;
      }
    }
  }
  return res;
};

test("status pill beside a whole title or under the subtitle, label whole or dot alone, inside the banner", { timeout: 300000 }, async (t) => {
  if (skip) return t.skip(skip);
  const page = await browser.newPage({ viewport: { width: 1000, height: 1400 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;font-family:Roboto,Helvetica,Arial,sans-serif}</style></head><body><div id="root"></div></body></html>`);
  await page.addScriptTag({ content: HA_CARD });
  await page.addScriptTag({ content: src });
  const failures = await page.evaluate(
    async ({ reg, audit }) => {
      const pillAudit = new Function(`return (${audit})`)();
      const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      const res = [];
      for (const [type, zoom] of [["seedbox-card", false], ["seedbox-mini-card", false], ["seedbox-mini-card", true]])
        for (const language of ["en", "fr", "de", "hu", "el", "ru"])
          for (const width of [190, 245, 300, 400, 460, 500])
            for (const title of [undefined, "Living room seedbox downloads"]) {
              const root = document.getElementById("root");
              root.style.width = `${width}px`;
              const el = document.createElement(type);
              el.setConfig({ type: `custom:${type}`, language, ...(title ? { title } : {}) });
              el.hass = { ...reg, language, locale: { language }, callService: async () => ({ response: { torrents: {} } }) };
              root.replaceChildren(el);
              if (zoom) el.shadowRoot.querySelector(".zoom").dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true, detail: 1 }));
              await frame();
              await frame();
              const what = `${type}${zoom ? " zoomed" : ""} ${language} ${width}px${title ? " long title" : ""}`;
              for (const f of pillAudit(el.shadowRoot, width, ".banner .chip.status", ".name", ".sb-ground")) res.push(`${what}: ${f}`);
            }
      return res;
    },
    { reg: { states, entities, devices }, audit: pillAudit.toString() },
  );
  await page.close();
  assert.deepEqual([...failures, ...errors], []);
});
