import { type RoomSummary, SAMPLE_IMAGES } from "@piecemates/client";
import { MAX_OPEN_ROOMS } from "@piecemates/game";
import { router, useFocusEffect } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Image, Pressable, Text, TextInput, View } from "react-native";

import { Container } from "@/components/container";
import {
	NewRoomSheet,
	type PickedImage,
} from "@/components/home/new-room-sheet";
import { RoomRow } from "@/components/room-row";
import { api } from "@/lib/api";

const openRoom = (code: string) =>
	router.push({ pathname: "/room/[code]", params: { code } });

export default function Home() {
	const { t } = useTranslation();
	const [picked, setPicked] = useState<PickedImage>();
	const [code, setCode] = useState("");
	const [open, setOpen] = useState<RoomSummary[]>([]);
	const full = open.length >= MAX_OPEN_ROOMS;

	// Refreshed each time Home shows, so a room I just left or abandoned is right.
	// Home still works without the list; creating a room is checked on the server.
	useFocusEffect(() => {
		api.openRooms().then(setOpen, () => setOpen([]));
	});

	const pickImage = (url: string) =>
		Image.getSize(url, (width, height) => setPicked({ url, width, height }));

	return (
		<Container className="gap-8 p-6">
			<View className="gap-3">
				<Text className="font-medium text-foreground text-lg">
					{t("home.joinRoom")}
				</Text>
				<View className="flex-row gap-2">
					<TextInput
						accessibilityLabel={t("home.roomCode")}
						placeholder="ABCD2345"
						autoCapitalize="characters"
						autoCorrect={false}
						value={code}
						onChangeText={setCode}
						className="flex-1 rounded border border-border px-3 py-2 font-mono text-foreground"
					/>
					<Pressable
						accessibilityRole="button"
						className="justify-center rounded bg-foreground px-4 active:opacity-70"
						onPress={() => code.trim() && openRoom(code.trim().toUpperCase())}
					>
						<Text className="font-medium text-background">
							{t("home.join")}
						</Text>
					</Pressable>
				</View>
			</View>

			{open.length > 0 && (
				<View className="gap-3">
					<Text className="font-medium text-foreground text-lg">
						{t("home.continue")}
					</Text>
					{open.map((room) => (
						<RoomRow key={room.code} room={room} />
					))}
				</View>
			)}

			<View className="gap-3">
				<Text className="font-medium text-foreground text-lg">
					{t("home.newPuzzle")}
				</Text>
				{full && (
					<Text className="text-muted">
						{t("home.openRoomsFull", { max: MAX_OPEN_ROOMS })}
					</Text>
				)}
				<View className="flex-row gap-2">
					{SAMPLE_IMAGES.map((url, i) => (
						<Pressable
							key={url}
							accessibilityRole="button"
							accessibilityLabel={t("home.sampleImage", { n: i + 1 })}
							disabled={full}
							className={`flex-1 overflow-hidden rounded ${full ? "opacity-50" : ""}`}
							onPress={() => pickImage(url)}
						>
							<Image source={{ uri: url }} className="aspect-video w-full" />
						</Pressable>
					))}
				</View>
			</View>
			{picked && (
				<NewRoomSheet
					key={picked.url}
					image={picked}
					onClose={() => setPicked(undefined)}
				/>
			)}
		</Container>
	);
}
