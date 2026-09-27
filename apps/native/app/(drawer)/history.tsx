import { historyLines, type RoomSummary } from "@piecemates/client";
import { router, useFocusEffect } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text } from "react-native";

import { Container } from "@/components/container";
import { api } from "@/lib/api";

/** Rooms I've played in; an open one resumes, a solved one shows the picture. */
export default function History() {
	const { t } = useTranslation();
	const [rooms, setRooms] = useState<RoomSummary[]>();
	const [failed, setFailed] = useState(false);

	// Refreshed each time the screen shows, so a room I just left is listed.
	useFocusEffect(() => {
		api.history().then(setRooms, () => setFailed(true));
	});

	return (
		<Container className="gap-2 p-6">
			{failed && (
				<Text className="text-foreground">{t("history.loadFailed")}</Text>
			)}
			{rooms?.length === 0 && (
				<Text className="text-muted">{t("history.empty")}</Text>
			)}
			{rooms?.map((room) => {
				const lines = historyLines(room);
				return (
					<Pressable
						key={room.code}
						accessibilityRole="button"
						className="gap-0.5 rounded border border-border p-3 active:opacity-70"
						onPress={() =>
							router.push({
								pathname: "/room/[code]",
								params: { code: room.code },
							})
						}
					>
						<Text className="font-medium text-foreground">{lines.title}</Text>
						<Text className="text-foreground text-sm">{lines.status}</Text>
						<Text className="text-muted text-sm">{lines.players}</Text>
					</Pressable>
				);
			})}
		</Container>
	);
}
