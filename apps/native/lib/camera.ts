import {
	type Camera,
	clampCamera,
	fitCamera,
	resizeCamera,
	roomStore,
	zoomAt,
} from "@puzzle/client";
import { tableRect } from "@puzzle/game";
import { makeMutable } from "react-native-reanimated";

// One board is on screen at a time, so its camera is a module singleton.
// screen = camera + scale * table; the dragged group gets `dragOffset` on top, in table units.
export const camera = {
	x: makeMutable(0),
	y: makeMutable(0),
	scale: makeMutable(1),
};
export const dragOffset = { x: makeMutable(0), y: makeMutable(0) };
const viewport = { width: 0, height: 0 };

const table = () => {
	const state = roomStore.getState().conn?.state;
	return state ? tableRect(state) : null;
};

export const getCamera = (): Camera => ({
	x: camera.x.value,
	y: camera.y.value,
	scale: camera.scale.value,
});

/** Every camera change goes through here, so the table stays on screen. */
export function setCamera(next: Camera) {
	const bounds = table();
	const c = bounds ? clampCamera(next, bounds, viewport) : next;
	camera.x.value = c.x;
	camera.y.value = c.y;
	camera.scale.value = c.scale;
}

/** Shows the whole table. */
export function fitToView() {
	const bounds = table();
	if (bounds && viewport.width) setCamera(fitCamera(bounds, viewport));
}

/** Fits the first layout; later ones (rotation) keep the zoom and centre point. */
export function setViewport({
	width,
	height,
}: {
	width: number;
	height: number;
}) {
	const bounds = table();
	const from = { ...viewport };
	Object.assign(viewport, { width, height });
	if (bounds && from.width)
		setCamera(resizeCamera(getCamera(), bounds, from, viewport));
	else fitToView();
}

export const panBy = (dx: number, dy: number) => {
	const c = getCamera();
	setCamera({ ...c, x: c.x + dx, y: c.y + dy });
};

export function zoomBy(focusX: number, focusY: number, factor: number) {
	const bounds = table();
	if (bounds)
		setCamera(zoomAt(getCamera(), focusX, focusY, factor, bounds, viewport));
}

/** A screen point in table units. */
export const toTable = (x: number, y: number) => ({
	x: (x - camera.x.value) / camera.scale.value,
	y: (y - camera.y.value) / camera.scale.value,
});
