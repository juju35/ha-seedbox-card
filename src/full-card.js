// ---------------------------------------------------------------------------
// Full card
// ---------------------------------------------------------------------------
import { ICONS } from "./core.js";
import { esc, etaSeconds, fmtBytes, fmtDuration, fmtNum, fmtPercent, fmtRate, num, rateParts, svgIcon, torrentState } from "./helpers.js";
import { findClient, listClients, rangeText, spark } from "./registry-based-resolution.js";
import { BASE_STYLE, DIALOG_STYLE, MOTION_STYLE, SeedboxBase, TORRENTS_REFRESH } from "./shared-styles.js";

export const FULL_STYLE = `
  .content { padding: 0 12px 12px; display: flex; flex-direction: column; gap: 12px; }
  .speeds { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
  .speed { position: relative; overflow: hidden; border-radius: 12px; padding: 10px 12px; min-width: 0;
           background: var(--secondary-background-color, rgba(127,127,127,.08)); }
  .speed > :not(.spark) { position: relative; }
  /* The 24 h curve in its own 24 px band under the rate and its total, never behind the text. */
  .speed:has(> .spark) { padding-bottom: 34px; }
  .speed .spark { position: absolute; inset: auto 0 0; width: 100%; height: 24px; pointer-events: none; }
  .speed .k { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--secondary-text-color); }
  .speed .k .icon { color: var(--c); width: 16px; height: 16px; }
  .speed .v { font-size: 22px; font-weight: 500; line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .speed .v small { font-size: 13px; font-weight: 400; color: var(--secondary-text-color); margin-left: 3px; }
  .speed .d { font-size: 11px; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-height: 14px; }
  @container (max-width: 279px) {
    .speed { padding: 8px; }
    .speed:has(> .spark) { padding-bottom: 32px; }
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

export class SeedboxCard extends SeedboxBase {
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
    return `<style>${BASE_STYLE}${DIALOG_STYLE}${FULL_STYLE}${this._sceneStyle()}${MOTION_STYLE}</style>
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
