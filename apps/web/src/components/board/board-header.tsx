import type { RoomInfo } from "@puzzle/client";
import { MAX_PLAYERS } from "@puzzle/game";

import { useRoom } from "@/hooks/use-room";

import { SettingsSheet } from "./settings-sheet";
import { ShareRoom } from "./share-room";

/** Room code, players and status, and the settings gear. */
export function BoardHeader({ room }: { room: RoomInfo }) {
	const players = useRoom((r) => r.players);
	const status = useRoom((r) => r.status);
	const note =
		status === "playing"
			? ""
			: ` · ${status === "done" ? "Solved! 🎉" : status}`;

	return (
		<div className="flex items-center gap-2 px-3 pt-3 text-sm">
			<ShareRoom code={room.code} />
			<span
				className="min-w-0 truncate rounded bg-black/60 px-2 py-1"
				title={players.map((p) => p.name).join(", ")}
			>
				{players.length} / {MAX_PLAYERS}
				{note}
			</span>
			<div className="ml-auto">
				<SettingsSheet />
			</div>
		</div>
	);
}
