import type { BagChip } from "@puzzle/client";

/** A bag's colour, name and piece count. */
export function BagLabel({ bag }: { bag: BagChip }) {
	return (
		<>
			<span className="size-3 rounded-full" style={{ background: bag.color }} />
			{bag.name}
			<span className="opacity-60">{bag.count}</span>
		</>
	);
}
