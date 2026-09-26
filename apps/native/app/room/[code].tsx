import type { RoomInfo } from "@puzzle/client";
import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

import { PuzzleBoard } from "@/components/puzzle-board";
import { api } from "@/lib/api";

export default function RoomScreen() {
	const { code } = useLocalSearchParams<{ code: string }>();
	const [room, setRoom] = useState<RoomInfo>();
	const [error, setError] = useState<string>();

	useEffect(() => {
		api.getRoom(code).then(setRoom, (e: Error) => setError(e.message));
	}, [code]);

	return (
		<>
			<Stack.Screen options={{ title: `Room ${code}` }} />
			{room ? (
				<PuzzleBoard room={room} />
			) : (
				<View className="flex-1 items-center justify-center bg-background">
					{error ? (
						<Text className="text-foreground">{error}</Text>
					) : (
						<ActivityIndicator />
					)}
				</View>
			)}
		</>
	);
}
