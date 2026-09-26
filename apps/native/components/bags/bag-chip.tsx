import type { BagChip as Bag } from "@piecemates/client";
import { Pressable } from "react-native";

import { useDropTarget } from "@/hooks/use-drop-target";

import { BagLabel } from "./bag-label";
import { chip, ring } from "./bag-styles";

/** A bag on the table's bar: drop a piece on it to bag it, tap to open it. */
export function BagChip({ bag, onPress }: { bag: Bag; onPress: () => void }) {
	const { ref, hovered } = useDropTarget(bag.id);
	return (
		<Pressable
			ref={ref}
			accessibilityRole="button"
			className={`${chip} ${ring(hovered)}`}
			onPress={onPress}
		>
			<BagLabel bag={bag} />
		</Pressable>
	);
}
