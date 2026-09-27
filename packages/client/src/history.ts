import i18next from "i18next";

import type { RoomSummary } from "./api.ts";
import { formatDuration } from "./duration.ts";

/** The three lines a History row shows, the same on every platform. */
export function historyLines(room: RoomSummary) {
	const time = formatDuration(room.playedMs);
	return {
		title: i18next.t("history.room", {
			pieces: room.pieces,
			date: new Date(room.finishedAt ?? room.createdAt),
		}),
		status:
			room.status === "done"
				? i18next.t("history.solved", { time })
				: i18next.t("history.playing", { time }),
		players: room.players.length
			? i18next.t("history.with", { names: room.players.join(", ") })
			: i18next.t("history.solo"),
	};
}
