import { roomErrorText } from "@piecemates/client";
import { createFileRoute } from "@tanstack/react-router";

import { PuzzleBoard } from "@/components/board/puzzle-board";
import { api } from "@/lib/api";
import { loadWebCues } from "@/lib/cues";

export const Route = createFileRoute("/room/$code")({
	loader: ({ params }) => {
		loadWebCues();
		return api.getRoom(params.code);
	},
	component: RoomComponent,
	errorComponent: ({ error }) => <p className="p-4">{roomErrorText(error)}</p>,
});

function RoomComponent() {
	const room = Route.useLoaderData();
	return <PuzzleBoard room={room} />;
}
