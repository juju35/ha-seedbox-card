import assert from "node:assert/strict";
import { test } from "node:test";
import { load } from "./load.mjs";

const { STRINGS, LANGUAGES, lang, fmtLang } = load("seedbox-card.js", ["STRINGS", "LANGUAGES", "lang", "fmtLang"]);
const CODES = ["en", "fr", "de", "es", "sr", "sr-Latn", "it", "nl", "pt", "pl", "ro", "da", "sv", "bg", "ru", "uk", "hu", "sk", "cs", "sl", "lv", "el"];
const placeholders = (s) => [...String(s).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

test("I18N parity: every language has exactly the keys of en, none empty, same placeholders", () => {
  const ref = Object.keys(STRINGS.en).sort();
  assert.deepEqual([...Object.keys(STRINGS)].sort(), [...CODES].sort());
  for (const code of CODES) {
    assert.deepEqual([...Object.keys(STRINGS[code])].sort(), ref, `key mismatch in ${code}`);
    for (const key of ref) {
      assert.ok(String(STRINGS[code][key]).trim() !== "", `${code}.${key} is empty`);
      assert.deepEqual(placeholders(STRINGS[code][key]), placeholders(STRINGS.en[key]), `placeholders of ${code}.${key}`);
    }
  }
});

test("I18N: the editor offers every language", () => {
  assert.deepEqual(JSON.parse(JSON.stringify(LANGUAGES.map(([code]) => code))), CODES);
});

test("I18N script: sr is Cyrillic and sr-Latn is Latin (brands and placeholders aside)", () => {
  const keep = /Transmission|qBittorrent|Deluge|Home Assistant|\{\w+\}/g;
  for (const [key, value] of Object.entries(STRINGS.sr)) assert.doesNotMatch(String(value).replace(keep, ""), /[A-Za-z]/, `Latin letter in sr.${key}`);
  for (const [key, value] of Object.entries(STRINGS["sr-Latn"])) assert.doesNotMatch(String(value), /[Ѐ-ӿ]/, `Cyrillic letter in sr-Latn.${key}`);
});

test("I18N resolution: full code, then the part before the dash, then en; config.language wins", () => {
  const hass = (language) => ({ locale: { language } });
  assert.equal(lang(hass("fr-FR")), "fr");
  assert.equal(lang(hass("sr-Latn")), "sr-Latn");
  assert.equal(lang(hass("pt-BR")), "pt");
  assert.equal(lang(hass("ja")), "en");
  assert.equal(lang(hass("fr"), { language: "de" }), "de");
  assert.equal(lang({ language: "el" }), "el");
  for (const code of CODES) assert.equal(lang(hass(code)), code);
});

test("I18N numbers: Home Assistant's region kept when it matches the card's language, European Portuguese", () => {
  assert.equal(fmtLang({ locale: { language: "de-CH" } }), "de-CH");
  assert.equal(fmtLang({ locale: { language: "de-CH" } }, { language: "fr" }), "fr");
  assert.equal(fmtLang({ locale: { language: "pt" } }), "pt-PT");
});
