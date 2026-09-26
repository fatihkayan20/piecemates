import { BOARD_SCHEMES, type RoomInfo } from "@puzzle/client";
import { useRef } from "react";

import { BagBar } from "@/components/bags/bag-bar";
import { Confetti } from "@/components/win/confetti";
import { SolvedBar } from "@/components/win/solved-bar";
import { usePixiBoard } from "@/hooks/use-pixi-board";
import { useRoom } from "@/hooks/use-room";
import { useSettings } from "@/hooks/use-settings";

import { BoardControls } from "./board-controls";
import { RoomActions } from "./room-actions";

/** A room: bags and room actions on top, the table, controls (or the win) at the bottom. */
export function PuzzleBoard({ room }: { room: RoomInfo }) {
	const host = useRef<HTMLDivElement>(null);
	const background = useSettings((s) => s.background);
	const solved = useRoom((r) => r.status === "done");
	usePixiBoard(host, room);

	return (
		<div
			// The controls take the theme that reads on this table colour.
			className={`${BOARD_SCHEMES[background] ?? "dark"} relative flex h-full min-h-0 min-w-0 flex-col text-foreground`}
			style={{ backgroundColor: background }}
		>
			{/* Kept outside the canvas so the table never sits under the bars. */}
			<div className="flex items-center gap-2 p-3 text-sm">
				<BagBar />
				<RoomActions room={room} />
			</div>
			<div ref={host} className="relative min-h-0 flex-1 overflow-hidden" />
			{solved ? <SolvedBar /> : <BoardControls room={room} />}
			{solved && <Confetti />}
		</div>
	);
}
