import type { RoomInfo } from "@puzzle/client";
import { View } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";

import { BagBar } from "@/components/bags/bag-bar";
import { useBoardGestures } from "@/hooks/use-board-gestures";
import { useRoomSocket } from "@/hooks/use-room-socket";
import { useSettings } from "@/hooks/use-settings";
import { setViewport } from "@/lib/camera";

import { BoardCanvas } from "./board-canvas";
import { BoardControls } from "./board-controls";

/** A room: bags on top, the table in the middle, controls at the bottom. */
export function PuzzleBoard({ room }: { room: RoomInfo }) {
	useRoomSocket(room.code);
	const gesture = useBoardGestures(room.seed);
	const background = useSettings((s) => s.background);

	return (
		<View className="flex-1" style={{ backgroundColor: background }}>
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
			<BoardControls room={room} />
		</View>
	);
}
