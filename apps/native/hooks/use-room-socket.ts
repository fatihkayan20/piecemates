import {
	connectRoom,
	disconnectRoom,
	followRoom,
	type RoomConnection,
	roomStore,
} from "@piecemates/client";
import { useEffect } from "react";
import { openRoomSocket } from "@/lib/api";
import { camera, cameraControl } from "@/lib/camera";

/** Keeps the room open while the board is mounted; the store follows it. */
export function useRoomSocket(code: string) {
	useEffect(() => {
		let conn: RoomConnection | null = null;
		let closed = false;
		const unfollow = followRoom(cameraControl);
		void openRoomSocket(code).then((socket) => {
			if (closed) return socket.close();
			conn = connectRoom(socket, () => openRoomSocket(code));
		});
		// Lets device automation find pieces on screen during development.
		if (__DEV__)
			Object.assign(globalThis, { __piecemates: { roomStore, camera } });
		return () => {
			closed = true;
			unfollow();
			if (conn) disconnectRoom(conn);
		};
	}, [code]);
}
