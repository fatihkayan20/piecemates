import {
	historyLines,
	ROW_IMAGE_SIZE,
	type RoomSummary,
} from "@piecemates/client";
import { Link } from "@tanstack/react-router";

import { Photo } from "@/components/photo";

/** One of my rooms, for Continue and History; opens the room. */
export function RoomRow({ room }: { room: RoomSummary }) {
	const lines = historyLines(room);
	return (
		<Link
			to="/room/$code"
			params={{ code: room.code }}
			className="flex items-center gap-3 rounded border p-2 hover:bg-muted"
		>
			<Photo
				url={room.imageUrl}
				sizes={`${ROW_IMAGE_SIZE}px`}
				className="aspect-video w-24 shrink-0 rounded object-cover"
			/>
			<span className="grid gap-0.5">
				<span className="font-medium">{lines.title}</span>
				<span className="text-sm">{lines.status}</span>
				<span className="text-muted-foreground text-sm">{lines.players}</span>
			</span>
		</Link>
	);
}
