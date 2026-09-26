import { type GridOption, gridOptions } from "@puzzle/game";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Image, Pressable, Text, TextInput, View } from "react-native";

import { Container } from "@/components/container";
import { createRoom } from "@/lib/api";

// ponytail: fixed samples until Unsplash search lands (step 7).
const SAMPLES = [
	"photo-1506744038136-46273834b3fb",
	"photo-1501785888041-af3ef285b470",
	"photo-1470071459604-3b5ec3a7fe05",
].map((id) => `https://images.unsplash.com/${id}?w=1600&q=80`);

type Picked = { url: string; w: number; h: number; options: GridOption[] };

const openRoom = (code: string) =>
	router.push({ pathname: "/room/[code]", params: { code } });

export default function Home() {
	const [picked, setPicked] = useState<Picked>();
	const [code, setCode] = useState("");
	const [busy, setBusy] = useState(false);

	const pick = (url: string) =>
		Image.getSize(url, (w, h) =>
			setPicked({ url, w, h, options: gridOptions(w, h) }),
		);

	const create = async (o: GridOption) => {
		if (!picked) return;
		setBusy(true);
		try {
			const room = await createRoom({
				imageUrl: picked.url,
				imageW: picked.w,
				imageH: picked.h,
				rows: o.rows,
				cols: o.cols,
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
					{SAMPLES.map((url, i) => (
						<Pressable
							key={url}
							accessibilityRole="button"
							accessibilityLabel={`Sample image ${i + 1}`}
							accessibilityState={{ selected: picked?.url === url }}
							className={`flex-1 overflow-hidden rounded border-2 ${picked?.url === url ? "border-foreground" : "border-transparent"}`}
							onPress={() => pick(url)}
						>
							<Image source={{ uri: url }} className="aspect-video w-full" />
						</Pressable>
					))}
				</View>
				{picked && (
					<View className="flex-row flex-wrap gap-2">
						{picked.options.map((o) => (
							<Pressable
								key={o.count}
								accessibilityRole="button"
								disabled={busy}
								className="rounded border border-border px-3 py-2 active:opacity-70"
								onPress={() => create(o)}
							>
								<Text className="text-foreground">{o.count} pieces</Text>
							</Pressable>
						))}
					</View>
				)}
			</View>
		</Container>
	);
}
