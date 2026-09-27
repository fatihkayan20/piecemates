import { Host } from "@expo/ui/swift-ui";
import type { ComponentProps } from "react";
import { useUniwind } from "uniwind";

/**
 * A SwiftUI Host in the app's light or dark scheme, not the system's. Inside the
 * board's ScopedTheme it follows the board, like the theme colours around it.
 */
export function AppHost(props: ComponentProps<typeof Host>) {
	const { theme } = useUniwind();
	return <Host colorScheme={theme === "light" ? "light" : "dark"} {...props} />;
}
