import type { Grid } from "@piecemates/client";
import { generateEdges, piecePath } from "@piecemates/game";
import { Skia, type SkPath } from "@shopify/react-native-skia";

// The store keeps one Grid object per puzzle, so it's a stable cache key.
const cache = new WeakMap<Grid, { seed: number; paths: SkPath[] }>();

/** Every piece's outline, in its own table units. */
export function piecePaths(seed: number, grid: Grid): SkPath[] {
	const hit = cache.get(grid);
	if (hit?.seed === seed) return hit.paths;
	const paths = generateEdges(seed, grid.rows, grid.cols).map(
		(edges) =>
			Skia.Path.MakeFromSVGString(piecePath(edges, grid.w, grid.h)) ??
			Skia.Path.Make(),
	);
	cache.set(grid, { seed, paths });
	return paths;
}
