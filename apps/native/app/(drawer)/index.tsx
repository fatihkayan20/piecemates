import { SAMPLE_IMAGES } from "@piecemates/client";
import { type GridOption, gridOptions } from "@piecemates/game";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Image, Pressable, Text, TextInput, View } from "react-native";

import { Container } from "@/components/container";
import { api } from "@/lib/api";

type PickedImage = {
	url: string;
	width: number;
	height: number;
	options: GridOption[];
};

const openRoom = (code: string) =>
	router.push({ pathname: "/room/[code]", params: { code } });

export default function Home() {
	const [picked, setPicked] = useState<PickedImage>();
	const [code, setCode] = useState("");
	const [busy, setBusy] = useState(false);

	const pickImage = (url: string) =>
		Image.getSize(url, (width, height) =>
			setPicked({ url, width, height, options: gridOptions(width, height) }),
		);

	const createPuzzle = async (grid: GridOption) => {
		if (!picked) return;
		setBusy(true);
		try {
			const room = await api.createRoom({
				imageUrl: picked.url,
				imageW: picked.width,
				imageH: picked.height,
				rows: grid.rows,
				cols: grid.cols,
			});
			openRoom(room.code);
		} catch (e) {
			Alert.alert(
				"Could not create room",
				e instanceof Error ? e.message : undefined,
			);
		} finally {
			setBusy(false);
		}
	};

	return (
		<Container className="gap-8 p-6">
			<View className="gap-3">
				<Text className="font-medium text-foreground text-lg">Join a room</Text>
				<View className="flex-row gap-2">
					<TextInput
						accessibilityLabel="Room code"
						placeholder="ABC123"
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
						<Text className="font-medium text-background">Join</Text>
					</Pressable>
				</View>
			</View>

			<View className="gap-3">
				<Text className="font-medium text-foreground text-lg">New puzzle</Text>
				<View className="flex-row gap-2">
					{SAMPLE_IMAGES.map((url, i) => (
						<Pressable
							key={url}
							accessibilityRole="button"
							accessibilityLabel={`Sample image ${i + 1}`}
							accessibilityState={{ selected: picked?.url === url }}
							className={`flex-1 overflow-hidden rounded border-2 ${picked?.url === url ? "border-foreground" : "border-transparent"}`}
							onPress={() => pickImage(url)}
						>
							<Image source={{ uri: url }} className="aspect-video w-full" />
						</Pressable>
					))}
				</View>
				{picked && (
					<View className="flex-row flex-wrap gap-2">
						{picked.options.map((grid) => (
							<Pressable
								key={grid.count}
								accessibilityRole="button"
								disabled={busy}
								className="rounded border border-border px-3 py-2 active:opacity-70"
								onPress={() => createPuzzle(grid)}
							>
								<Text className="text-foreground">{grid.count} pieces</Text>
							</Pressable>
						))}
					</View>
				)}
			</View>
		</Container>
	);
}
