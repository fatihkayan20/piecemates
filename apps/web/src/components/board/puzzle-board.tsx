import type { RoomInfo } from "@puzzle/client";
import { useRef } from "react";

import { BagBar } from "@/components/bags/bag-bar";
import { usePixiBoard } from "@/hooks/use-pixi-board";

import { BoardToolbar } from "./board-toolbar";

/** A room: bags and controls on top, the table below. */
export function PuzzleBoard({ room }: { room: RoomInfo }) {
	const host = useRef<HTMLDivElement>(null);
	usePixiBoard(host, room);

	return (
		<div className="flex h-full min-h-0 flex-col bg-board">
			{/* Kept outside the canvas so the table never sits under the controls. */}
			<div className="flex items-center gap-3 p-3 text-sm">
				<BagBar />
				<BoardToolbar room={room} />
			</div>
			<div ref={host} className="relative min-h-0 flex-1 overflow-hidden" />
		</div>
	);
}
