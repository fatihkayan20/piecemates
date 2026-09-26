import { BOARD_SCHEMES, type RoomInfo } from "@piecemates/client";
import { useHeaderHeight } from "expo-router/build/react-navigation";
import { View } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import { ScopedTheme } from "uniwind";
import { BagBar } from "@/components/bags/bag-bar";
import { Confetti } from "@/components/win/confetti";
import { SolvedBar } from "@/components/win/solved-bar";
import { useBoardGestures } from "@/hooks/use-board-gestures";
import { useRoom } from "@/hooks/use-room";
import { useRoomSocket } from "@/hooks/use-room-socket";
import { useSettings } from "@/hooks/use-settings";
import { setViewport } from "@/lib/camera";
import { BoardCanvas } from "./board-canvas";
import { BoardControls } from "./board-controls";

/** A room: bags on top, the table in the middle, controls (or the win) at the bottom. */
export function PuzzleBoard({ room }: { room: RoomInfo }) {
	const headerHeight = useHeaderHeight();
	useRoomSocket(room.code);
	const gesture = useBoardGestures(room.seed);
	const background = useSettings((s) => s.background);
	const solved = useRoom((r) => r.status === "done");

	return (
		// The controls take the theme that reads on this table colour.
		<ScopedTheme theme={BOARD_SCHEMES[background] ?? "dark"}>
			<View
				className="flex-1"
				style={{ backgroundColor: background, paddingTop: headerHeight }}
			>
				<BagBar />
				<GestureDetector gesture={gesture}>
					{/* Kept apart from the bars, so the table never sits under them. */}
					<View
						className="flex-1"
						onLayout={(e) => setViewport(e.nativeEvent.layout)}
					>
						<BoardCanvas room={room} />
					</View>
				</GestureDetector>
				{solved ? <SolvedBar /> : <BoardControls room={room} />}
				{solved && <Confetti />}
			</View>
		</ScopedTheme>
	);
}
