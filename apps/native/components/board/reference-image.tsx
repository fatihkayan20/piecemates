import type { RoomInfo } from "@piecemates/client";
import { useState } from "react";
import { Image, Modal, Pressable, Text } from "react-native";

import { useRoom } from "@/hooks/use-room";

/** The Image button and the popup with the finished picture; tap anywhere to close. */
export function ReferenceImage({ room }: { room: RoomInfo }) {
	const [open, setOpen] = useState(false);
	const grid = useRoom((r) => r.grid);
	const aspectRatio = grid ? (grid.cols * grid.w) / (grid.rows * grid.h) : 1;

	return (
		<>
			<Pressable
				accessibilityRole="button"
				className="ml-auto rounded border border-foreground/40 px-3 py-1.5 active:opacity-70"
				onPress={() => setOpen(true)}
			>
				<Text className="font-medium text-foreground">Image</Text>
			</Pressable>
			<Modal
				visible={open}
				transparent
				animationType="fade"
				onRequestClose={() => setOpen(false)}
			>
				<Pressable
					accessibilityRole="button"
					accessibilityLabel="Close reference image"
					className="flex-1 items-center justify-center gap-4 bg-black/85 p-4"
					onPress={() => setOpen(false)}
				>
					<Image
						source={{ uri: room.imageUrl }}
						accessibilityLabel="The finished puzzle"
						resizeMode="contain"
						className="w-full"
						style={{ aspectRatio }}
					/>
					<Text className="rounded bg-white px-4 py-2 font-medium text-black">
						Close
					</Text>
				</Pressable>
			</Modal>
		</>
	);
}
