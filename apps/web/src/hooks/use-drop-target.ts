import { registerDropTarget } from "@puzzle/client";

import { useRoom } from "./use-room";

/** Makes an element a drop target for dragged pieces; returns its ref callback and whether a drag hovers it. */
export function useDropTarget(id: string) {
	const hovered = useRoom((r) => r.hovered === id);
	const ref = (el: HTMLElement | null) =>
		el
			? registerDropTarget(id, (done) => done(el.getBoundingClientRect()))
			: undefined;
	return { ref, hovered };
}
