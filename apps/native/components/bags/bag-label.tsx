import type { BagChip } from "@puzzle/client";
import { Text, View } from "react-native";

/** A bag's colour, name and piece count. */
export function BagLabel({ bag }: { bag: BagChip }) {
	return (
		<>
			<View
				className="size-3 rounded-full"
				style={{ backgroundColor: bag.color }}
			/>
			<Text className="text-white">{bag.name}</Text>
			<Text className="text-white/60">{bag.count}</Text>
		</>
	);
}
