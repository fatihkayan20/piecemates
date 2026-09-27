import type { RoomSummary } from "@piecemates/client";
import { useFocusEffect } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Text } from "react-native";

import { Container } from "@/components/container";
import { RoomRow } from "@/components/room-row";
import { api } from "@/lib/api";

/** My solved rooms; a row shows the finished picture. */
export default function History() {
	const { t } = useTranslation();
	const [rooms, setRooms] = useState<RoomSummary[]>();
	const [failed, setFailed] = useState(false);

	// Refreshed each time the tab shows, so a room I just solved is listed.
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
			{rooms?.map((room) => (
				<RoomRow key={room.code} room={room} />
			))}
		</Container>
	);
}
