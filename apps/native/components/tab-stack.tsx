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
	return (
		<Stack
			screenOptions={{
				headerLargeTitle: large,
				headerTintColor: foreground,
				headerTitleStyle: { color: foreground },
				headerLargeTitleStyle: { color: foreground },
			}}
		>
			<Stack.Screen name="index" options={{ title }} />
		</Stack>
	);
}
