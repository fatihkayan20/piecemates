import { useQuery } from "@tanstack/react-query";
import { useIsFocused } from "expo-router";
import { useTranslation } from "react-i18next";
import { Text } from "react-native";

import { Container } from "@/components/container";
import { RoomRow } from "@/components/room-row";
import { api } from "@/lib/api";

/** My solved rooms; a row shows the finished picture. */
export default function History() {
	const { t } = useTranslation();
	// A hidden tab stops listening, so a room I solved meanwhile shows when I come back.
	const { data: rooms, isError } = useQuery({
		...api.history(),
		subscribed: useIsFocused(),
	});

	return (
		<Container className="gap-2 p-6">
			{isError && (
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
