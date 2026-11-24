// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------
import { pickerDefine } from "./card-picker.js";
import { VERSION } from "./core.js";
import { SeedboxCard } from "./full-card.js";
import { SeedboxMiniCard } from "./mini-card.js";
import { SeedboxCardEditor, SeedboxMiniCardEditor } from "./visual-editors.js";

export const define = (name, cls) => {
  if (!customElements.get(name)) pickerDefine(name, cls);
};
define("seedbox-card", SeedboxCard);
define("seedbox-mini-card", SeedboxMiniCard);
define("seedbox-card-editor", SeedboxCardEditor);
define("seedbox-mini-card-editor", SeedboxMiniCardEditor);

window.customCards = window.customCards || [];
for (const card of [
  {
    type: "seedbox-card",
    name: "Seedbox Card",
    description: "Monitor and control a torrent client (Transmission, qBittorrent, Deluge): speeds, torrents and alternative speed.",
  },
  {
    type: "seedbox-mini-card",
    name: "Seedbox Mini Card",
    description: "Compact torrent client overview (Transmission, qBittorrent, Deluge): download and upload speeds, active torrents.",
  },
]) {
  if (!window.customCards.some((c) => c.type === card.type))
    window.customCards.push({ ...card, preview: true, documentationURL: "https://github.com/juju35/ha-seedbox-card" });
}

console.info(
  `%c SEEDBOX-CARD %c v${VERSION} `,
  "color: white; background: #43a047; font-weight: 700;",
  "color: #43a047; background: white; font-weight: 700;"
);
