import { registerDropTarget } from "@puzzle/client";
import { useEffect, useRef } from "react";
import type { View } from "react-native";

import { useRoom } from "./use-room";

/** Makes a view a drop target for dragged pieces; returns its ref and whether a drag hovers it. */
export function useDropTarget(id: string) {
	const ref = useRef<View>(null);
	const hovered = useRoom((r) => r.hovered === id);
	useEffect(
		() =>
			registerDropTarget(id, (done) =>
				ref.current?.measureInWindow((x, y, width, height) =>
					done({ x, y, width, height }),
				),
			),
		[id],
	);
	return { ref, hovered };
}
