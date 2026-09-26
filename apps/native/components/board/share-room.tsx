import { roomUrl } from "@puzzle/client";
import { Pressable, Share, Text } from "react-native";

import { ENV } from "@/src/env";

/** The room code; tapping it opens the share sheet with the room link. */
export function ShareRoom({ code }: { code: string }) {
	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel="Share room link"
			className="rounded bg-black/60 px-2 py-1 active:opacity-70"
			onPress={() =>
				Share.share({ message: roomUrl(ENV.EXPO_PUBLIC_WEB_URL, code) })
			}
		>
			<Text className="font-mono text-white">{code} ↗</Text>
		</Pressable>
	);
}
