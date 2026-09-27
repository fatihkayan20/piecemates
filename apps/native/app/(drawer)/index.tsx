import { SAMPLE_IMAGES } from "@piecemates/client";
import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Image, Pressable, Text, TextInput, View } from "react-native";

import { Container } from "@/components/container";
import {
	NewRoomSheet,
	type PickedImage,
} from "@/components/home/new-room-sheet";

const openRoom = (code: string) =>
	router.push({ pathname: "/room/[code]", params: { code } });

export default function Home() {
	const { t } = useTranslation();
	const [picked, setPicked] = useState<PickedImage>();
	const [code, setCode] = useState("");

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

			<View className="gap-3">
				<Text className="font-medium text-foreground text-lg">
					{t("home.newPuzzle")}
				</Text>
				<View className="flex-row gap-2">
					{SAMPLE_IMAGES.map((url, i) => (
						<Pressable
							key={url}
							accessibilityRole="button"
							accessibilityLabel={t("home.sampleImage", { n: i + 1 })}
							className="flex-1 overflow-hidden rounded"
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
