// ---------------------------------------------------------------------------
// Shared styles
// ---------------------------------------------------------------------------
import { ICONS, SOURCES } from "./core.js";
import { bytesOf, clientStatus, esc, fmtBytes, fmtLang, fmtNum, known, morph, num, sameSig, svgIcon, t, textWidth, unitFactor } from "./helpers.js";
import { HIST_REFRESH, HIST_WINDOW, SCENE_STYLE, bucketize, findClient, isNight, sbSceneSvg, sceneState } from "./registry-based-resolution.js";
import { STRINGS } from "./i18n/strings.js";

export const BASE_STYLE = `
  :host { --sb-ok: var(--success-color, #43a047); --sb-warn: var(--warning-color, #ffa600); --sb-crit: var(--error-color, #db4437);
          --sb-idle: var(--secondary-text-color, #9e9e9e); --sb-down: var(--success-color, #43a047); --sb-up: var(--blue-color, #2196f3);
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
  /* The status pill right after the title, centred on it, while the title stays whole and the pill's whole label fits
     beside it; otherwise (measured by the card, see _fitPill) the pill on its own line under a one-line subtitle, and
     if even that would not fit in the header, its dot alone (the label stays in title and aria-label). */
  .titles { display: flex; flex-direction: column; }
  .trow { display: flex; align-items: center; gap: 8px; min-width: 0; }
  .trow .name { flex: 0 1 auto; min-width: 0; }
  .trow .chip { flex: none; max-width: none; }
  .titles.below { display: grid; grid-template-columns: minmax(0, 1fr); justify-items: start; }
  .titles.below .trow { display: contents; }
  .titles.below .name { max-width: 100%; }
  .titles.below > .sub { justify-self: stretch; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .titles.below .chip { grid-row: 3; max-width: 100%; }
  .titles.pill-dot .chip { padding: 4px; }
  .titles.pill-dot .chip .chip-label { display: none; }
  :host([hide-title]) .titles > .name, :host([hide-subtitle]) .titles > .sub { display: none; }
  .header .chip { flex: none; min-width: 0; overflow: hidden; line-height: 16px; box-sizing: border-box; }
  /* Unavailable / unknown: the dot stays grey, the text takes the primary text colour (contrast). */
  .header .chip.idle { color: var(--primary-text-color); }
  .chip-label { min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  @container (max-width: 239px) {
    .header { gap: 6px; }
    :host(:not([mini])) .header .logo { height: 32px; width: 32px; }
    :host(:not([mini])) .header .logo .icon { width: 18px; height: 18px; }
  }
  /* Under 200 px only the chip's dot shows (its text stays its tooltip and accessible name). */
  @container (max-width: 200px) {
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
export const MOTION_STYLE = `
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { transition: none !important; animation: none !important; }
  }
`;

// In-card confirmation popup, at the top of the card as in the other ha-* cards (window.confirm() is blocking and
// neutralised in some webviews).
export const DIALOG_STYLE = `
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
export const CONFIRM_GUARD_MS = 400;

// A click inside a dialog (more-info opened from the card, say) is not a click outside the card.
export const inDialog = (ev) => ev.composedPath().some((n) => ["ha-more-info-dialog", "ha-dialog", "dialog"].includes(n.localName));

// "A click elsewhere" is caught on the pointer, not only on the click event: on iOS (Safari and the companion app)
// a tap on something that is not clickable (the background, an empty spot, a card with no action) sends no click to
// the page. The handler runs when the press and the release are both outside the card (a slider dragged out of the
// card does not count), and a scroll does not count (the browser cancels the pointer); keyboard clicks still go
// through the click event. The handler keeps its own checks (outside of the card, not in a dialog).
export const watchOutside = (card, handler) => {
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
export const TORRENTS_REFRESH = 60000;

export let sbUid = 0;

export class SeedboxBase extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._html = "";
    // Keeps the ids of each card's picture apart on a page with several cards.
    this._uid = ++sbUid;
    this.shadowRoot.addEventListener("click", (ev) => this._onClick(ev));
    // No rewrite of the card between the press and the release: Home Assistant updates the card several times a
    // second, and a rewrite under the pointer can replace the element pressed, so that the click lands on the card
    // itself and does nothing. The pending render is done once released (after the click).
    this._onPressStart = () => {
      this._pressing = true;
      window.addEventListener("pointerup", this._onPressEnd, true);
      window.addEventListener("pointercancel", this._onPressEnd, true);
    };
    this._onPressEnd = () => {
      window.removeEventListener("pointerup", this._onPressEnd, true);
      window.removeEventListener("pointercancel", this._onPressEnd, true);
      setTimeout(() => {
        this._pressing = false;
        if (!this._dirty) return;
        this._dirty = false;
        this._update();
      }, 0);
    };
    this.shadowRoot.addEventListener("pointerdown", this._onPressStart);
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
    // A new width (or the web font loaded): the status pill is fitted again, in the next frame.
    if (typeof ResizeObserver === "function") {
      this._resize ??= new ResizeObserver((entries) => {
        const w = Math.round(entries.at(-1).contentRect.width);
        if (w === this._fitWidth) return;
        this._fitWidth = w;
        cancelAnimationFrame(this._fitFrame);
        this._fitFrame = requestAnimationFrame(() => this._fitPill());
      });
      this._resize.observe(this);
    }
    document.fonts?.ready?.then(() => this._fitPill());
    // A client with nothing changing sends no state: the 24 h history (and an open qBittorrent list) would grow old.
    // Checked every minute while the card is on the page; fetched again only once stale, drawn only if it changed.
    clearInterval(this._tick);
    this._tick = setInterval(() => this._update(), 60000);
  }

  disconnectedCallback() {
    clearInterval(this._tick);
    this._tick = null;
    this._outside?.off();
    window.removeEventListener("keydown", this._onKey);
    this._resize?.disconnect();
    this._fitWidth = null;
    this._pressing = false;
    window.removeEventListener("pointerup", this._onPressEnd, true);
    window.removeEventListener("pointercancel", this._onPressEnd, true);
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
    // The theme: the illustration's night picture.
    const sig = [h.entities, h.devices, h.language, h.locale?.language, h.themes?.darkMode];
    const { client } = findClient(h, this._config);
    if (client) for (const id of Object.values(client.entities)) sig.push(h.states[id]);
    return sig;
  }

  _update(sig) {
    if (!this._hass || !this._config) return;
    // A press in progress: drawn once released (see _onPressStart).
    if (this._pressing) {
      this._dirty = true;
      return;
    }
    this._sig = sig ?? this._signature();
    let html = this._render();
    if (this._confirm)
      html = html.replace(/<ha-card>([\s\S]*)<\/ha-card>\s*$/, (_, inner) => `<ha-card class="dialog-open">${inner}${this._confirmHtml()}</ha-card>`);
    if (html !== this._html) {
      this._html = html;
      morph(this.shadowRoot, html);
    }
    this._fitPill();
  }

  // The status pill stays right after the title only while the whole title and the pill's whole label fit on that
  // row; otherwise it takes a line of its own under the subtitle (.below), and when even then the title, the subtitle
  // and the pill would not fit above the banner's ground strip, it keeps its dot alone (.pill-dot). Measured in the
  // real fonts, so that every language and title length gets its own answer.
  _fitPill() {
    for (const t of this.shadowRoot?.querySelectorAll?.(".titles") || []) {
      const row = t.querySelector(":scope > .trow");
      const chip = row?.querySelector(":scope > .chip");
      if (!chip?.getBoundingClientRect) continue;
      t.classList.remove("below", "pill-dot");
      const name = row.querySelector(":scope > .name");
      const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
      const title = name ? textWidth(name) + gap : 0;
      const pill = chip.getBoundingClientRect().width;
      if (title + pill <= row.getBoundingClientRect().width) continue;
      t.classList.add("below");
      const r = t.getBoundingClientRect();
      const banner = t.closest(".banner");
      const box = banner?.getBoundingClientRect();
      const floor = banner?.querySelector(".sb-ground")?.getBoundingClientRect().top ?? box?.bottom;
      const tall = box && (r.bottom > floor + 0.5 || r.top < box.top - 0.5);
      if (tall || pill > r.width + 0.5) t.classList.add("pill-dot");
    }
  }

  // Service call whose failure is logged (Home Assistant already shows a toast) instead of left unhandled.
  _call(domain, service, data) {
    return Promise.resolve()
      .then(() => this._hass.callService(domain, service, data))
      .catch((err) => console.error(`seedbox-card: ${domain}.${service} failed`, err));
  }

  _onClick(ev) {
    // The click ends the press: what it changes is drawn at once.
    this._pressing = false;
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

  // Icon target: url option, else the web UI advertised by the integration (Deluge), else the client's website;
  // http(s) only (a device's configuration_url can be a homeassistant:// link, which a new tab cannot open).
  _logoUrl(client) {
    const web = (u) => (/^https?:\/\//i.test(String(u || "").trim()) ? String(u).trim() : null);
    return web(this._config.url) || web(this._hass.devices?.[client.id]?.configuration_url) || SOURCES[client.source].site;
  }

  // Header chip: [class, label key, entity]. qBittorrent's connection status comes first when it is not connected.
  _status(client) {
    const e = client.entities;
    const conn = this._s(e.connection)?.state;
    if (conn === "disconnected") return ["crit", "conn_disconnected", e.connection];
    const st = this._s(e.status);
    if (!known(st)) return ["idle", `state_${st?.state === "unknown" ? "unknown" : "unavailable"}`, e.status];
    // Everything paused (the client's on/off switch is off).
    if (this._s(e.power)?.state === "off") return ["idle", "t_paused", e.power];
    if (conn === "firewalled") return ["warn", "conn_firewalled", e.connection];
    const key = `status_${clientStatus(st.state)}`;
    // Idle: grey, as the header icon of the other ha-* cards when nothing runs.
    return key in STRINGS.en && key !== "status_idle" ? ["ok", key, e.status] : ["idle", "status_idle", e.status];
  }

  _header(client) {
    const c = this._config;
    const [cls, key, id] = this._status(client);
    const chip = esc(this._t(key));
    const srcName = SOURCES[client.source].name;
    const free = bytesOf(this._s(client.entities.free));
    // The client's name in the subtitle only when the title does not already say it.
    const sub = [(c.title || client.name) === srcName ? null : srcName, free !== null ? this._t("free", { size: fmtBytes(free, this._loc()) }) : null].filter(Boolean);
    const logo = `<a class="logo ${cls}" href="${esc(this._logoUrl(client))}" target="_blank" rel="noopener noreferrer" title="${esc(srcName)}" aria-label="${esc(srcName)}">${svgIcon(ICONS.seedbox)}</a>`;
    const name = `<div class="name">${esc(c.title || client.name)}</div>`;
    if (c.illustration !== false) {
      // Illustrated banner: the title and its status pill on the first line, the subtitle under them; the swarm on
      // the right.
      // "Downloading and seeding" is too long for the pill: "Active" there, the whole status as its tooltip and label.
      const short = key === "status_up_down" ? esc(this._t("status_up_down_short")) : chip;
      const pill = `<span class="chip status${id ? " clickable" : ""} ${cls}"${id ? ` role="button" tabindex="0" data-entity="${esc(id)}"` : ""} title="${chip}" aria-label="${chip}"><span class="dot"></span><span class="chip-label">${short}</span></span>`;
      const night = isNight(this._hass, c) ? " night" : "";
      return `
      <div class="banner${night}">${sbSceneSvg(sceneState(cls, key), this._uid, cls === "warn")}
        <div class="htext">${logo}<div class="titles"><div class="trow">${name}${pill}</div>${sub.length ? `<div class="sub" title="${esc(sub.join(" · "))}">${esc(sub.join(" · "))}</div>` : ""}</div></div>
        ${this._zoomButton()}
      </div>`;
    }
    return `
      <div class="header">
        ${logo}
        <div class="titles">
          <div class="trow">${name}${
            id
              ? `<span class="chip clickable ${cls}" role="button" tabindex="0" data-entity="${esc(id)}" title="${chip}" aria-label="${chip}"><span class="dot"></span><span class="chip-label">${chip}</span></span>`
              : ""
          }</div>
          ${sub.length ? `<div class="sub" title="${esc(sub.join(" · "))}">${esc(sub.join(" · "))}</div>` : ""}
        </div>
        ${this._zoomButton()}
      </div>`;
  }

  // The illustration's styles, only when it is shown.
  _sceneStyle() {
    return this._config.illustration === false ? "" : SCENE_STYLE;
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
