import { isNameNeeded, isRoomsFull, roomErrorText } from "@piecemates/client";
import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { toast } from "sonner";

import { PuzzleBoard } from "@/components/board/puzzle-board";
import { NameDialog } from "@/components/name-dialog";
import { api } from "@/lib/api";
import { loadWebCues } from "@/lib/cues";

export const Route = createFileRoute("/room/$code")({
	loader: async ({ params }) => {
		loadWebCues();
		try {
			return await api.queryClient.fetchQuery(api.room(params.code));
		} catch (error) {
			// Over the open-room cap: back Home, saying what to do.
			if (isRoomsFull(error)) {
				toast.error(roomErrorText(error));
				throw redirect({ to: "/" });
			}
			throw error;
		}
	},
	component: RoomComponent,
	errorComponent: RoomError,
});

function RoomComponent() {
	const room = Route.useLoaderData();
	return <PuzzleBoard room={room} />;
}

/** Joining someone's room needs my name first; other errors are shown as they are. */
function RoomError({ error }: { error: unknown }) {
	const router = useRouter();
	if (!isNameNeeded(error))
		return <p className="p-4">{roomErrorText(error)}</p>;
	return (
		<NameDialog
			open
			onOpenChange={(open) => {
				if (!open) void router.navigate({ to: "/" });
			}}
			onSaved={() => void router.invalidate()}
		/>
	);
}
