import {
	historyLines,
	ROW_IMAGE_SIZE,
	type RoomSummary,
} from "@piecemates/client";
import { Link } from "@tanstack/react-router";

import { Photo } from "@/components/photo";
import { SampleCredit } from "@/components/sample-credit";

const ROW = "relative flex items-center gap-3 rounded border p-2";
/** The whole row opens the room, while the credit's links stay clickable above it. */
const STRETCHED = "after:absolute after:inset-0 after:content-['']";

/** One of my rooms, for Continue and History; opens the room unless it was cleared. */
export function RoomRow({ room }: { room: RoomSummary }) {
	const lines = historyLines(room);
	return (
		<div className={room.expired ? ROW : `${ROW} hover:bg-muted`}>
			<Photo
				url={room.imageUrl}
				sizes={`${ROW_IMAGE_SIZE}px`}
				className="aspect-video w-24 shrink-0 rounded object-cover"
			/>
			<span className="grid gap-0.5">
				{room.expired ? (
					<span className="font-medium">{lines.title}</span>
				) : (
					<Link
						to="/room/$code"
						params={{ code: room.code }}
						className={`font-medium ${STRETCHED}`}
					>
						{lines.title}
					</Link>
				)}
				<span className="text-sm">{lines.status}</span>
				<span className="text-muted-foreground text-sm">{lines.players}</span>
				{room.credit && (
					<SampleCredit credit={room.credit} className="relative z-10" />
				)}
			</span>
		</div>
	);
}
