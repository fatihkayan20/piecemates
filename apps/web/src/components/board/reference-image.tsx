import type { RoomInfo } from "@puzzle/client";
import { Button } from "@puzzle/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogTitle,
	DialogTrigger,
} from "@puzzle/ui/components/dialog";

/** The Image button and a dialog with the finished picture. */
export function ReferenceImage({ room }: { room: RoomInfo }) {
	return (
		<Dialog>
			<DialogTrigger render={<Button size="sm" variant="outline" />}>
				Image
			</DialogTrigger>
			<DialogContent className="sm:max-w-3xl">
				<DialogTitle>Reference image</DialogTitle>
				<img
					src={room.imageUrl}
					alt="The finished puzzle"
					className="max-h-[75vh] w-full object-contain"
				/>
			</DialogContent>
		</Dialog>
	);
}
