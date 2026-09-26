import type { RoomInfo } from "@puzzle/client";
import { MAX_PLAYERS } from "@puzzle/game";
import { Button } from "@puzzle/ui/components/button";

import { useRoom } from "@/hooks/use-room";

import { ReferenceImage } from "./reference-image";
import { ShareRoom } from "./share-room";

/** Room code, players, status, the reference image and Tidy. */
export function BoardToolbar({ room }: { room: RoomInfo }) {
	const conn = useRoom((r) => r.conn);
	const players = useRoom((r) => r.players);
	const status = useRoom((r) => r.status);

	return (
		<>
			<ShareRoom code={room.code} />
			<span className="shrink-0 rounded bg-black/60 px-2 py-1">
				{players.length} / {MAX_PLAYERS} ·{" "}
				{players.map((p) => p.name).join(", ")}
			</span>
			{status !== "playing" && (
				<span className="rounded bg-black/60 px-2 py-1">
					{status === "done" ? "Solved! 🎉" : status}
				</span>
			)}
			<ReferenceImage room={room} />
			<Button size="sm" onClick={() => conn?.tidy()}>
				Tidy pile
			</Button>
		</>
	);
}
