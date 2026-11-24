// ---------------------------------------------------------------------------
// Mini card
// ---------------------------------------------------------------------------
import { ICONS } from "./core.js";
import { esc, fmtNum, fmtRate, num, svgIcon } from "./helpers.js";
import { findClient, rangeText, spark } from "./registry-based-resolution.js";
import { BASE_STYLE, DIALOG_STYLE, MOTION_STYLE, inDialog, watchOutside } from "./shared-styles.js";
import { SeedboxCard } from "./full-card.js";

export const MINI_STYLE = `
  .content { padding: 0 12px 12px; display: flex; flex-direction: column; gap: 8px; }
  /* Label column of up to 86 px (the bars line up across rows), a bar of at least 24 px, the value at its width. */
  .metric { display: grid; grid-template-columns: 18px minmax(0, 86px) minmax(24px, 1fr) minmax(56px, auto); align-items: center; gap: 8px; font-size: 13px;
            position: relative; }
  .metric > :not(.spark) { position: relative; }
  /* 24 h curve behind the bar only: it never crosses the label or the value. */
  .metric .spark { position: absolute; grid-area: 1 / 3 / 2 / 4; inset: -3px 0; width: 100%; height: calc(100% + 6px); pointer-events: none; }
  .metric > .icon { color: var(--c, var(--secondary-text-color)); }
  .metric .lbl { min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .metric .v { text-align: right; font-weight: 500; white-space: nowrap; }
  @container (max-width: 229px) {
    .metric { grid-template-columns: 18px minmax(24px, 1fr) minmax(56px, auto); gap: 6px; }
    .metric .lbl { display: none; }
    .metric .spark { grid-area: 1 / 2 / 2 / 3; }
  }
  .foot { display: flex; justify-content: space-between; align-items: center; gap: 8px; font-size: 12px; color: var(--secondary-text-color); margin-top: 2px; flex-wrap: wrap; }
  .foot span { display: inline-flex; align-items: center; gap: 4px; }
  .foot .icon { width: 14px; height: 14px; }
  .foot .crit { color: var(--sb-crit); }
  .foot .on { color: var(--sb-accent); }
`;

// The mini card extends the full card: its detail button (top right, `zoom: false` removes it) switches it to the
// full card's content, same configuration, and back; a click anywhere outside the card brings it back too.
export class SeedboxMiniCard extends SeedboxCard {
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
    const label = esc(this._t(z ? "zoom_out" : "zoom_in"));
    return `<button type="button" class="zoom" title="${label}" aria-label="${label}">${svgIcon(z ? ICONS.collapse : ICONS.expand)}</button>`;
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
    return `<style>${BASE_STYLE}${DIALOG_STYLE}${MINI_STYLE}${this._sceneStyle()}${MOTION_STYLE}</style>
      <ha-card>
        ${this._header(client)}
        <div class="content">
          ${rows.join("")}
          ${foot.length ? `<div class="foot">${foot.join("")}</div>` : ""}
        </div>
      </ha-card>`;
  }
}
