import { useState } from "react";

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
		<div className="flex min-w-0 flex-1 items-center gap-2">
			<div className="flex min-w-0 items-center gap-2 overflow-x-auto">
				{current ? (
					<BagViewBar bag={current} onEdit={() => setEditing(current.id)} />
				) : (
					bags.map((bag) => (
						<BagChip
							key={bag.id}
							bag={bag}
							onClick={() => conn.setView(bag.id)}
						/>
					))
				)}
			</div>
			{/* Outside the scroller, so it stays in sight behind many bags. */}
			{!current && (
				<button
					type="button"
					className={`${chip} ${dashed} shrink-0`}
					onClick={() => setEditing(null)}
				>
					+ Bag
				</button>
			)}
			<BagSheet
				key={String(editing)}
				editing={editing}
				onClose={() => setEditing(undefined)}
			/>
		</div>
	);
}
