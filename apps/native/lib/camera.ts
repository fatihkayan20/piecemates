import {
	type Camera,
	type CameraControl,
	clampCamera,
	debounce,
	pinchCamera,
	RESIZE_DEBOUNCE_MS,
	resizeCamera,
	roomStore,
	startCamera,
} from "@piecemates/client";
import { tableRect } from "@piecemates/game";
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

/** How the room moves this camera (see `followRoom`). */
export const cameraControl: CameraControl = {
	get: getCamera,
	set: setCamera,
	viewport: () => viewport,
};

/** The viewport the camera last followed, so a burst of layouts moves it once. */
let followed = { ...viewport };
const follow = debounce(() => {
	const bounds = table();
	if (bounds) setCamera(resizeCamera(getCamera(), bounds, followed, viewport));
	followed = { ...viewport };
}, RESIZE_DEBOUNCE_MS);

/** Starts the view on the first layout; later ones (rotation, bars changing) keep the zoom and centre point. */
export function setViewport({
	width,
	height,
}: {
	width: number;
	height: number;
}) {
	const first = !viewport.width;
	Object.assign(viewport, { width, height });
	if (!first) return follow();
	followed = { ...viewport };
	// Usually the room loads after this layout, and `followRoom` starts the view.
	const state = roomStore.getState().conn?.state;
	if (state) setCamera(startCamera(tableRect(state), state, viewport));
}

export const panBy = (dx: number, dy: number) => {
	const c = getCamera();
	setCamera({ ...c, x: c.x + dx, y: c.y + dy });
};

type Point = { x: number; y: number };

/** Sets the camera for a pinch that began at `from` with the camera at `start`. */
export function pinchTo(start: Camera, from: Point, to: Point, scale: number) {
	const bounds = table();
	if (bounds) setCamera(pinchCamera(start, from, to, scale, bounds, viewport));
}

/** A screen point in table units. */
export const toTable = (x: number, y: number) => ({
	x: (x - camera.x.value) / camera.scale.value,
	y: (y - camera.y.value) / camera.scale.value,
});
