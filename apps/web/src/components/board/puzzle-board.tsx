import type { RoomInfo } from "@puzzle/client";
import { useRef } from "react";

import { BagBar } from "@/components/bags/bag-bar";
import { usePixiBoard } from "@/hooks/use-pixi-board";
import { useSettings } from "@/hooks/use-settings";

import { BoardControls } from "./board-controls";
import { BoardHeader } from "./board-header";

/** A room: header and bags on top, the table, controls at the bottom (like native). */
export function PuzzleBoard({ room }: { room: RoomInfo }) {
	const host = useRef<HTMLDivElement>(null);
	const background = useSettings((s) => s.background);
	usePixiBoard(host, room);

	return (
		<div
			className="flex h-full min-h-0 flex-col"
			style={{ backgroundColor: background }}
		>
			<BoardHeader room={room} />
			{/* Kept outside the canvas so the table never sits under the bars. */}
			<div className="flex p-3 text-sm">
				<BagBar />
			</div>
			<div ref={host} className="relative min-h-0 flex-1 overflow-hidden" />
			<BoardControls room={room} />
		</div>
	);
}
