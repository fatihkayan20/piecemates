import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { useRoom } from "@/hooks/use-room";

import { BagChip } from "./bag-chip";
import { BagSheet } from "./bag-sheet";
import { chip, dashed } from "./bag-styles";
import { BagViewBar } from "./bag-view-bar";

/** Bags along the top: chips on the table, or the open bag's own bar. */
export function BagBar() {
	/** undefined = sheet closed, null = new bag, string = editing that bag. */
	const [editing, setEditing] = useState<string | null>();
	const conn = useRoom((r) => r.conn);
	const bags = useRoom((r) => r.bags);
	const view = useRoom((r) => r.view);
	const current = bags.find((b) => b.id === view);
	if (!conn) return null;

	return (
		<View className="flex-row items-center">
			<ScrollView
				className="shrink"
				horizontal
				showsHorizontalScrollIndicator={false}
				contentContainerClassName="gap-2 p-3"
			>
				{current ? (
					<BagViewBar bag={current} onEdit={() => setEditing(current.id)} />
				) : (
					bags.map((bag) => (
						<BagChip
							key={bag.id}
							bag={bag}
							onPress={() => conn.setView(bag.id)}
						/>
					))
				)}
			</ScrollView>
			{/* Outside the scroller, so it stays in sight behind many bags. */}
			{!current && (
				<Pressable
					accessibilityRole="button"
					className={`${chip} ${dashed} mr-3`}
					onPress={() => setEditing(null)}
				>
					<Text className="text-white">+ Bag</Text>
				</Pressable>
			)}
			{editing !== undefined && (
				<BagSheet
					key={String(editing)}
					editing={editing}
					onClose={() => setEditing(undefined)}
				/>
			)}
		</View>
	);
}
