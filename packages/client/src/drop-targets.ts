// Places outside the canvas a dragged piece can be dropped on (the bag bar).
// Each platform registers how to measure its elements in window coordinates;
// hit testing is shared.

/** Drop target id for "back to the table"; every other id is a bag. */
export const DROP_TABLE = "table";

export type DropRect = { x: number; y: number; width: number; height: number };
/** Reports an element's window rect, now (web) or once measured (native). */
export type MeasureTarget = (done: (rect: DropRect) => void) => void;

const targets = new Map<string, MeasureTarget>();

/** Registers a drop target; returns the unregister function. */
export function registerDropTarget(id: string, measure: MeasureTarget) {
	targets.set(id, measure);
	return () => {
		if (targets.get(id) === measure) targets.delete(id);
	};
}

/** Window rects of every drop target; measure once per drag, at its start. */
export function measureDropTargets() {
	const rects = new Map<string, DropRect>();
	for (const [id, measure] of targets) measure((rect) => rects.set(id, rect));
	return rects;
}

/** The drop target under a window point, if any. */
export function dropTargetAt(
	rects: Map<string, DropRect>,
	x: number,
	y: number,
) {
	for (const [id, r] of rects)
		if (x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height)
			return id;
	return null;
}
