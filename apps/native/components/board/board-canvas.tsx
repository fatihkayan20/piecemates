import { BOARD_STYLE, imageSrc, type RoomInfo } from "@piecemates/client";
import { Canvas, Group, Rect, useImage } from "@shopify/react-native-skia";
import { useDerivedValue } from "react-native-reanimated";

import { useRoom } from "@/hooks/use-room";
import { camera, dragOffset } from "@/lib/camera";
import { piecePaths } from "@/lib/piece-paths";

import { Piece } from "./piece";

/** Enough detail to zoom in on a phone without holding the 3072 web copy in memory. */
const BOARD_IMAGE_WIDTH = 2048;

/** The table: board frame, pieces in draw order, and my dragged group on top. */
export function BoardCanvas({ room }: { room: RoomInfo }) {
	const image = useImage(imageSrc(room.imageUrl, BOARD_IMAGE_WIDTH, 1));
	const grid = useRoom((r) => r.grid);
	const order = useRoom((r) => r.order);
	const drag = useRoom((r) => r.drag);
	const cameraTransform = useDerivedValue(() => [
		{ translateX: camera.x.value },
		{ translateY: camera.y.value },
		{ scale: camera.scale.value },
	]);
	const dragTransform = useDerivedValue(() => [
		{ translateX: dragOffset.x.value },
		{ translateY: dragOffset.y.value },
	]);
	if (!grid || !image) return null;
	const paths = piecePaths(room.seed, grid);

	const piece = (i: number, at?: { x: number; y: number }) => {
		const path = paths[i];
		if (!path) return null;
		return (
			<Piece key={i} index={i} at={at} grid={grid} image={image} path={path} />
		);
	};

	return (
		<Canvas style={{ flex: 1 }}>
			<Group transform={cameraTransform}>
				<Rect
					x={0}
					y={0}
					width={grid.cols * grid.w}
					height={grid.rows * grid.h}
					style="stroke"
					strokeWidth={BOARD_STYLE.frame.width}
					color={BOARD_STYLE.frame.color}
				/>
				{order.map((i) => (drag?.starts.has(i) ? null : piece(i)))}
				<Group transform={dragTransform}>
					{drag && [...drag.starts].map(([i, start]) => piece(i, start))}
				</Group>
			</Group>
		</Canvas>
	);
}
