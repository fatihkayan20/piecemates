import type { RoomInfo } from "@puzzle/client";
import { Button } from "@puzzle/ui/components/button";

import { useRoom } from "@/hooks/use-room";

import { PlayTime } from "./play-time";
import { ReferenceImage } from "./reference-image";

/** Play time, the reference image and Tidy, under the table. */
export function BoardControls({ room }: { room: RoomInfo }) {
	const conn = useRoom((r) => r.conn);

	return (
		<div className="flex items-center justify-end gap-2 p-3">
			<PlayTime />
			<ReferenceImage room={room} />
			<Button size="sm" onClick={() => conn?.tidy()}>
				Tidy pile
			</Button>
		</div>
	);
}
