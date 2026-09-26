import { formatDuration } from "@puzzle/client";
import { Text, View } from "react-native";

import { chip } from "@/components/bags/bag-styles";
import { useElapsed } from "@/hooks/use-elapsed";

/** How long we've been playing; it only runs while someone is in the room. */
export function PlayTime() {
	const ms = useElapsed();

	return (
		<View className={`${chip} mr-auto`}>
			<Text
				className="font-medium text-white"
				style={{ fontVariant: ["tabular-nums"] }}
			>
				{formatDuration(ms)}
			</Text>
		</View>
	);
}
