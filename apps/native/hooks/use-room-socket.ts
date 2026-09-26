import {
	connectRoom,
	disconnectRoom,
	type RoomConnection,
	roomStore,
} from "@piecemates/client";
import { useEffect } from "react";
import { openRoomSocket } from "@/lib/api";
import { camera, fitToView } from "@/lib/camera";

/** Keeps the room open while the board is mounted; the store follows it. */
export function useRoomSocket(code: string) {
	useEffect(() => {
		let conn: RoomConnection | null = null;
		let closed = false;
		void openRoomSocket(code).then((socket) => {
			if (closed) return socket.close();
			conn = connectRoom(socket, (event) => {
				if (event.type === "state") fitToView();
			});
		});
		// Lets device automation find pieces on screen during development.
		if (__DEV__)
			Object.assign(globalThis, { __puzzle: { roomStore, camera } });
		return () => {
			closed = true;
			if (conn) disconnectRoom(conn);
		};
	}, [code]);
}
