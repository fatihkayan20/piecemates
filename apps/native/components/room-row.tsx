import { historyLines, type RoomSummary } from "@piecemates/client";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { Photo } from "@/components/photo";

/** One of my rooms, for Continue and History; opens the room unless it was cleared. */
export function RoomRow({ room }: { room: RoomSummary }) {
	const lines = historyLines(room);
	return (
		<Pressable
			accessibilityRole="button"
			disabled={room.expired}
			className="flex-row items-center gap-3 rounded border border-border p-2 active:opacity-70"
			onPress={() =>
				router.push({ pathname: "/room/[code]", params: { code: room.code } })
			}
		>
			<Photo url={room.imageUrl} className="aspect-video w-24 rounded" />
			<View className="flex-1 gap-0.5">
				<Text className="font-medium text-foreground">{lines.title}</Text>
				<Text className="text-foreground text-sm">{lines.status}</Text>
				<Text className="text-muted text-sm">{lines.players}</Text>
			</View>
		</Pressable>
	);
}
