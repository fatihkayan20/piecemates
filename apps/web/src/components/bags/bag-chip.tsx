import type { BagChip as Bag } from "@piecemates/client";

import { useDropTarget } from "@/hooks/use-drop-target";

import { BagLabel } from "./bag-label";
import { chip, ring } from "./bag-styles";

/** A bag on the table's bar: drop a piece on it to bag it, click to open it. */
export function BagChip({ bag, onClick }: { bag: Bag; onClick: () => void }) {
	const { ref, hovered } = useDropTarget(bag.id);
	return (
		<button
			ref={ref}
			type="button"
			className={`${chip} ${ring(hovered)}`}
			onClick={onClick}
		>
			<BagLabel bag={bag} />
		</button>
	);
}
