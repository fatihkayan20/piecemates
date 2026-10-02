import {
	connectRoom,
	disconnectRoom,
	followRoom,
	imageSrc,
	type RoomConnection,
	type RoomInfo,
	roomStore,
	setBoardSize,
} from "@piecemates/client";
import { MAX_IMAGE_WIDTH } from "@piecemates/game";
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
			// The widest copy: zooming in needs the detail.
			const texture = await loadTexture(
				imageSrc(room.imageUrl, MAX_IMAGE_WIDTH, 1),
			);
			const socket = await openRoomSocket(room.code);
			if (disposed) return socket.close();

			// The world container is the table; its position and scale are the camera.
			const world = new Container({ sortableChildren: true });
			app.stage.addChild(world);
			const camera = createCamera(world, app.screen);
			// Before the room's state arrives, so my pile starts shaped to this board.
			setBoardSize(app.screen);
			app.renderer.on("resize", camera.resize);
			let pieces: Graphics[] = [];
			let detachPointer = () => {};

			const unsubscribeStore = roomStore.subscribe((snap) => {
				if (pieces.length === 0 && snap.grid) {
					pieces = drawPieces(world, texture, room.seed, snap.grid);
					detachPointer = attachPointer(app, world, pieces, camera);
				}
				syncPieces(pieces, snap);
			});
			const unfollow = followRoom(camera);
			// A resize still waiting must not touch the world once it's destroyed.
			unsubscribe = () => {
				unsubscribeStore();
				unfollow();
				detachPointer();
				camera.resize.cancel();
			};
			conn = connectRoom(socket, () => openRoomSocket(room.code));

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
