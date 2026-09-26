import { BOARD_STYLE, type Grid, type PieceView } from "@piecemates/client";
import { cellOf } from "@piecemates/game";
import {
	Group,
	Image,
	Path,
	type SkImage,
	type SkPath,
} from "@shopify/react-native-skia";

/** One piece: the image clipped to its outline, at `view`'s position. */
export function Piece({
	index,
	view,
	grid,
	image,
	path,
}: {
	index: number;
	view: PieceView;
	grid: Grid;
	image: SkImage;
	path: SkPath;
}) {
	if (!view.visible) return null;
	const { row, col } = cellOf(grid, index);
	return (
		<Group
			transform={[{ translateX: view.x }, { translateY: view.y }]}
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
