import {
	historyLines,
	ROW_IMAGE_SIZE,
	type RoomSummary,
} from "@piecemates/client";
import { Link } from "@tanstack/react-router";

import { Photo } from "@/components/photo";

const ROW = "flex items-center gap-3 rounded border p-2";

/** One of my rooms, for Continue and History; opens the room unless it was cleared. */
export function RoomRow({ room }: { room: RoomSummary }) {
	const lines = historyLines(room);
	const content = (
		<>
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
		</>
	);
	if (room.expired) return <div className={ROW}>{content}</div>;
	return (
		<Link
			to="/room/$code"
			params={{ code: room.code }}
			className={`${ROW} hover:bg-muted`}
		>
			{content}
		</Link>
	);
}
