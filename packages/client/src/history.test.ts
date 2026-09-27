import assert from "node:assert/strict";
import { test } from "node:test";

import { historyLines, type RoomSummary, startI18n } from "./index.ts";

test("history rows read the same everywhere", () => {
	startI18n(["en-GB"], { type: "3rdParty" });
	const room: RoomSummary = {
		code: "ABCDEFGH",
		imageUrl: "https://images.unsplash.com/x",
		pieces: 96,
		status: "done",
		playedMs: 80_000,
		createdAt: Date.UTC(2026, 8, 1),
		finishedAt: Date.UTC(2026, 8, 2, 12),
		players: ["Ada", "Bo"],
	};
	const done = historyLines(room);
	assert.match(done.title, /^96 pieces · .*2026/);
	assert.equal(done.status, "Solved in 1:20");
	assert.equal(done.players, "With Ada, Bo");
	const open = historyLines({ ...room, status: "playing", players: [] });
	assert.equal(open.status, "1:20 played");
	assert.equal(open.players, "Solo");
});
