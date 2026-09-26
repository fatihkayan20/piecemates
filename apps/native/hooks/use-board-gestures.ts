import {
	type Camera,
	canPickUp,
	type DropRect,
	dropTargetAt,
	finishDrag,
	measureDropTargets,
	roomStore,
	setHoveredTarget,
	startDrag,
} from "@piecemates/client";
import { useRef } from "react";
import { Gesture } from "react-native-gesture-handler";

import {
	camera,
	dragOffset,
	getCamera,
	panBy,
	pinchTo,
	toTable,
} from "@/lib/camera";
import { piecePaths } from "@/lib/piece-paths";

/** Topmost piece I may pick up at a screen point. */
function pieceAt(seed: number, x: number, y: number) {
	const { conn, grid, order } = roomStore.getState();
	if (!conn || !grid) return null;
	const paths = piecePaths(seed, grid);
	const t = toTable(x, y);
	for (const i of order.toReversed()) {
		if (!canPickUp(conn, i)) continue;
		const at = conn.position(i);
		if (paths[i]?.contains(t.x - at.x, t.y - at.y)) return i;
	}
	return null;
}

/** Drag a piece (onto the table or a bag chip), or pan and pinch the camera. */
export function useBoardGestures(seed: number) {
	const touched = useRef<number | null>(null);
	const targets = useRef(new Map<string, DropRect>());
	/** The camera and focal point when the pinch began; the pinch is measured from them. */
	const pinching = useRef<{ camera: Camera; x: number; y: number } | null>(
		null,
	);

	/** Follows the finger; translation counts from the first touch, so the piece doesn't lag. */
	const follow = (e: {
		translationX: number;
		translationY: number;
		absoluteX: number;
		absoluteY: number;
	}) => {
		dragOffset.x.value = e.translationX / camera.scale.value;
		dragOffset.y.value = e.translationY / camera.scale.value;
		return dropTargetAt(targets.current, e.absoluteX, e.absoluteY);
	};

	// ponytail: gestures run on the JS thread; move to worklets if drag stutters at 1000 pieces.
	const pan = Gesture.Pan()
		.runOnJS(true)
		.maxPointers(1)
		.onBegin((e) => {
			touched.current = roomStore.getState().drag
				? null
				: pieceAt(seed, e.x, e.y);
		})
		.onStart(() => {
			if (touched.current === null) return;
			dragOffset.x.value = 0;
			dragOffset.y.value = 0;
			targets.current = measureDropTargets();
			startDrag(touched.current);
		})
		.onChange((e) => {
			// A pinch moves the camera itself, following the fingers.
			if (touched.current === null) {
				if (!pinching.current) panBy(e.changeX, e.changeY);
			} else setHoveredTarget(follow(e));
		})
		.onEnd((e) => {
			const { conn, drag } = roomStore.getState();
			// The last move may not have reached onChange.
			const target = follow(e);
			// The group stays where it was dropped until the server echoes it.
			if (touched.current !== null && conn && drag)
				finishDrag(conn, drag, target, dragOffset.x.value, dragOffset.y.value);
			touched.current = null;
			setHoveredTarget(null);
		});

	const pinch = Gesture.Pinch()
		.runOnJS(true)
		.onStart((e) => {
			pinching.current = { camera: getCamera(), x: e.focalX, y: e.focalY };
		})
		.onUpdate((e) => {
			const start = pinching.current;
			if (start)
				pinchTo(start.camera, start, { x: e.focalX, y: e.focalY }, e.scale);
		})
		.onFinalize(() => {
			pinching.current = null;
		});

	return Gesture.Simultaneous(pan, pinch);
}
