import { BOARD_STYLE, type RoomInfo } from "@piecemates/client";
import { Canvas, Group, Rect, useImage } from "@shopify/react-native-skia";
import { useDerivedValue } from "react-native-reanimated";

import { useRoom } from "@/hooks/use-room";
import { camera, dragOffset } from "@/lib/camera";
import { piecePaths } from "@/lib/piece-paths";

import { Piece } from "./piece";

/** The table: board frame, pieces in draw order, and my dragged group on top. */
export function BoardCanvas({ room }: { room: RoomInfo }) {
	const image = useImage(room.imageUrl);
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
