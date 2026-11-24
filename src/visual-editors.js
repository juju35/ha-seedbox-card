// ---------------------------------------------------------------------------
// Visual editors (ha-form)
// ---------------------------------------------------------------------------
import { lang, t } from "./helpers.js";
import { listClients } from "./registry-based-resolution.js";
import { STRINGS } from "./i18n/strings.js";

export const LANGUAGES = [
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

export class SeedboxEditorBase extends HTMLElement {
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
        name: "illustration_theme",
        selector: { select: { mode: "dropdown", options: ["auto", "day", "night"].map((value) => ({ value, label: tr(`theme_${value}`) })) } },
      },
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
        const defaults = { ...Object.fromEntries(this.constructor.toggles), illustration_theme: "auto" };
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
    data.illustration_theme ??= "auto";
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

export class SeedboxCardEditor extends SeedboxEditorBase {
  static get toggles() {
    return [
      ["illustration", true],
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

export class SeedboxMiniCardEditor extends SeedboxEditorBase {
  // The full card's options too: the detail button shows the full card with this same configuration.
  static get toggles() {
    return [
      ["illustration", true],
      ["show_title", true],
      ["show_subtitle", true],
      ["show_history", true],
      ["show_footer", true],
      ["zoom", true],
      ["show_speeds", true],
      ["show_counts", true],
      ["show_controls", true],
      ["show_torrents", true],
      ["expand_torrents", false],
    ];
  }
}
