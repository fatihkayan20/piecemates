import type { RoomInfo } from "@puzzle/client";

import { PlayersSheet } from "./players-sheet";
import { SettingsSheet } from "./settings-sheet";
import { ShareRoom } from "./share-room";

/** Share, players and settings, at the end of the top row. */
export function RoomActions({ room }: { room: RoomInfo }) {
	return (
		<div className="ml-auto flex shrink-0 items-center gap-2">
			<ShareRoom code={room.code} />
			<PlayersSheet />
			<SettingsSheet />
		</div>
	);
}
