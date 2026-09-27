import { isNameNeeded, isRoomsFull, roomErrorText } from "@piecemates/client";
import { useQuery } from "@tanstack/react-query";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, Text, View } from "react-native";

import { PuzzleBoard } from "@/components/board/puzzle-board";
import { RoomHeaderItems } from "@/components/board/room-header-items";
import { api } from "@/lib/api";
import { askName } from "@/lib/ask-name";
import { loadNativeCues } from "@/lib/cues";

export default function RoomScreen() {
	const { t } = useTranslation();
	const { code } = useLocalSearchParams<{ code: string }>();
	const { data: room, error, refetch } = useQuery(api.room(code));

	useEffect(loadNativeCues, []);
	// Over the open-room cap: back Home, saying what to do. Joining someone's room needs my name first.
	useEffect(() => {
		const home = () => router.dismissTo("/");
		if (isRoomsFull(error))
			Alert.alert(roomErrorText(error), "", [{ onPress: home }]);
		else if (isNameNeeded(error)) askName(() => void refetch(), home);
	}, [error, refetch]);

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
					{error && !isNameNeeded(error) && !isRoomsFull(error) ? (
						<Text className="text-foreground">{roomErrorText(error)}</Text>
					) : (
						<ActivityIndicator />
					)}
				</View>
			)}
		</>
	);
}
