import {
	connectRoom,
	disconnectRoom,
	followRoom,
	type RoomConnection,
	type RoomInfo,
	roomStore,
} from "@piecemates/client";
import { Application, Container, type Graphics } from "pixi.js";
import { type RefObject, useEffect } from "react";

import { openRoomSocket } from "@/lib/api";
import { createCamera } from "@/lib/pixi/camera";
import { attachPointer } from "@/lib/pixi/pointer";
import { drawPieces, loadTexture, syncPieces } from "@/lib/pixi/scene";

/** Opens the room and runs the Pixi table inside `host` while mounted. */
export function usePixiBoard(
	host: RefObject<HTMLDivElement | null>,
	room: RoomInfo,
) {
	useEffect(() => {
		const el = host.current;
		if (!el) return;
		const app = new Application();
		let conn: RoomConnection | null = null;
		let unsubscribe = () => {};
		let disposed = false;

		const ready = (async () => {
			await app.init({
				resizeTo: el,
				// Transparent: the `board` theme colour behind the canvas is the table.
				backgroundAlpha: 0,
				antialias: true,
				autoDensity: true,
				resolution: devicePixelRatio,
			});
			if (disposed) return;
			el.appendChild(app.canvas);
			const texture = await loadTexture(room.imageUrl);
			const socket = await openRoomSocket(room.code);
			if (disposed) return socket.close();

			// The world container is the table; its position and scale are the camera.
			const world = new Container({ sortableChildren: true });
			app.stage.addChild(world);
			const camera = createCamera(world, app.screen);
			app.renderer.on("resize", camera.resize);
			let pieces: Graphics[] = [];

			const unsubscribeStore = roomStore.subscribe((snap) => {
				if (pieces.length === 0 && snap.grid) {
					pieces = drawPieces(world, texture, room.seed, snap.grid);
					attachPointer(app, world, pieces, camera);
				}
				syncPieces(pieces, snap);
			});
			const unfollow = followRoom(camera);
			// A resize still waiting must not touch the world once it's destroyed.
			unsubscribe = () => {
				unsubscribeStore();
				unfollow();
				camera.resize.cancel();
			};
			conn = connectRoom(socket);

			// Lets browser automation find pieces on screen during development.
			if (import.meta.env.DEV)
				Object.assign(window, {
					__piecemates: { roomStore, world, pieces: () => pieces },
				});
		})();

		return () => {
			disposed = true;
			unsubscribe();
			if (conn) disconnectRoom(conn);
			void ready.finally(() => app.destroy(true, { children: true }));
		};
	}, [host, room]);
}
