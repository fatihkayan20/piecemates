import { Stack } from "expo-router";
import { useThemeColor } from "heroui-native";

/** A tab's own stack, so its screen gets an iOS header, large by default. */
export function TabStack({
	title,
	large = true,
}: {
	title: string;
	/** The large title only collapses over a React Native scroll view, not a SwiftUI Form. */
	large?: boolean;
}) {
	const foreground = useThemeColor("foreground");
	const background = useThemeColor("background");
	return (
		<Stack
			screenOptions={{
				headerLargeTitle: large,
				// A large title's bar is transparent over the screen; an inline bar
				// paints the system background, so it gets the app's instead.
				headerStyle: large ? undefined : { backgroundColor: background },
				headerTintColor: foreground,
				headerTitleStyle: { color: foreground },
				headerLargeTitleStyle: { color: foreground },
				headerBackButtonDisplayMode: "minimal",
			}}
		>
			<Stack.Screen name="index" options={{ title }} />
		</Stack>
	);
}
