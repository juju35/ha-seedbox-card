import assert from "node:assert/strict";
import { test } from "node:test";
import { entities, qbittorrent, states } from "../scripts/mock-states.mjs";

// The screenshots are rendered from these mocks: a counter and the torrents list must show the same totals.
const byKey = (key) => states[Object.values(entities).find((e) => e.translation_key === key).entity_id];

test("mock Transmission counters match the torrents they list", () => {
  const all = Object.values(byKey("total_torrents").attributes.torrent_info);
  assert.equal(Number(byKey("total_torrents").state), all.length);
  assert.equal(Number(byKey("active_torrents").state), all.filter((t) => t.status === "downloading" || t.status === "seeding").length);
  assert.equal(Number(byKey("paused_torrents").state), all.filter((t) => t.status === "stopped").length);
  assert.equal(Number(byKey("completed_torrents").state), all.filter((t) => t.percent_done === "100.00").length);
});

test("mock qBittorrent counters match its get_torrents answer", () => {
  const all = Object.values(qbittorrent.torrents);
  const count = (key) => Number(qbittorrent.states[Object.values(qbittorrent.entities).find((e) => e.translation_key === key).entity_id].state);
  assert.equal(count("all_torrents"), all.length);
  assert.equal(count("errored_torrents"), all.filter((t) => t.status === "error" || t.status === "missingFiles").length);
  assert.equal(count("paused_torrents"), all.filter((t) => /^(stopped|paused)/.test(t.status)).length);
});
