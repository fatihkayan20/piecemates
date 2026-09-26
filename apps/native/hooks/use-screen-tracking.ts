import { useSegments } from "expo-router";
import { useEffect } from "react";

import { trackScreen } from "@/lib/telemetry";

/**
 * Sends a screen view on every route change, e.g. "/" or "/room/[code]"
 * (never the code itself; route groups like "(drawer)" are left out).
 */
export function useScreenTracking() {
	const path = useSegments().filter((s) => !s.startsWith("("));
	const screen = `/${path.join("/")}`;
	useEffect(() => {
		trackScreen(screen);
	}, [screen]);
}
