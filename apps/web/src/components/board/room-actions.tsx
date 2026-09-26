import type { RoomInfo } from "@piecemates/client";

import { PlayersSheet } from "./players-sheet";
import { SettingsSheet } from "./settings-sheet";

/** Players (with share) and settings, at the end of the top row. */
export function RoomActions({ room }: { room: RoomInfo }) {
	return (
		<div className="ml-auto flex shrink-0 items-center gap-2">
			<PlayersSheet code={room.code} />
			<SettingsSheet />
		</div>
	);
}
