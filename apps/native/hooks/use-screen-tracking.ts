import { usePathname } from "expo-router";
import { useEffect } from "react";

import { trackScreen } from "@/lib/telemetry";

/**
 * Sends a screen view on every route change, as Expo Router's screen tracking
 * guide does. Params are left out (they hold the room code), and the code in
 * the path reaches PostHog as "/room/:code".
 */
export function useScreenTracking() {
	const pathname = usePathname();
	useEffect(() => {
		trackScreen(pathname);
	}, [pathname]);
}
