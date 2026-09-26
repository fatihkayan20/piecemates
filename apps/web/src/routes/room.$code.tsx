import { createFileRoute } from "@tanstack/react-router";

import { PuzzleBoard } from "@/components/puzzle-board";
import { getRoom } from "@/lib/api";

export const Route = createFileRoute("/room/$code")({
	loader: ({ params }) => getRoom(params.code),
	component: RoomComponent,
	errorComponent: ({ error }) => (
		<p className="p-4">
			{error instanceof Error ? error.message : "Room not found"}
		</p>
	),
});

function RoomComponent() {
	const room = Route.useLoaderData();
	return <PuzzleBoard room={room} />;
}
