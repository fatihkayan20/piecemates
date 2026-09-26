import { BOARD_STYLE, type Grid } from "@piecemates/client";
import { cellOf } from "@piecemates/game";
import {
	Group,
	Image,
	Path,
	type SkImage,
	type SkPath,
} from "@shopify/react-native-skia";

import { useRoom } from "@/hooks/use-room";

/**
 * One piece: the image clipped to its outline. It reads its own spot from the
 * store, so a move re-renders only the pieces that moved. `at` draws it there
 * instead, while I drag it.
 */
export function Piece({
	index,
	at,
	grid,
	image,
	path,
}: {
	index: number;
	at?: { x: number; y: number };
	grid: Grid;
	image: SkImage;
	path: SkPath;
}) {
	const view = useRoom((r) => r.pieces[index]);
	if (!view || !(at || view.visible)) return null;
	const { x, y } = at ?? view;
	const { row, col } = cellOf(grid, index);
	return (
		<Group
			transform={[{ translateX: x }, { translateY: y }]}
			opacity={view.held ? BOARD_STYLE.heldOpacity : 1}
		>
			<Group clip={path}>
				<Image
					image={image}
					x={-col * grid.w}
					y={-row * grid.h}
					width={grid.cols * grid.w}
					height={grid.rows * grid.h}
					fit="fill"
				/>
			</Group>
			<Path
				path={path}
				style="stroke"
				strokeWidth={BOARD_STYLE.outline.width}
				color={BOARD_STYLE.outline.color}
			/>
		</Group>
	);
}
