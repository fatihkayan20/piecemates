import { roomErrorText } from "@piecemates/client";
import { useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Text, View } from "react-native";

import { PuzzleBoard } from "@/components/board/puzzle-board";
import { RoomHeaderItems } from "@/components/board/room-header-items";
import { api } from "@/lib/api";
import { loadNativeCues } from "@/lib/cues";

export default function RoomScreen() {
	const { t } = useTranslation();
	const { code } = useLocalSearchParams<{ code: string }>();
	const { data: room, error } = useQuery(api.room(code));

	useEffect(loadNativeCues, []);

	return (
		<>
			<Stack.Screen
				options={{
					title: t("room.title", { code }),
					headerTransparent: true,
					headerBackButtonDisplayMode: "minimal",
				}}
			/>
			<RoomHeaderItems code={code} />
			{room ? (
				<PuzzleBoard room={room} />
			) : (
				<View className="flex-1 items-center justify-center bg-background">
					{error ? (
						<Text className="text-foreground">{roomErrorText(error)}</Text>
					) : (
						<ActivityIndicator />
					)}
				</View>
			)}
		</>
	);
}
