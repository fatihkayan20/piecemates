import { MAX_PLAYERS } from "@puzzle/game";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@puzzle/ui/components/sheet";
import { Users } from "lucide-react";

import { useRoom } from "@/hooks/use-room";

import { iconButton } from "./icon-button";
import { ShareRoom } from "./share-room";

/** The players button and a sheet listing who is in the room, with its share link. */
export function PlayersSheet({ code }: { code: string }) {
	const players = useRoom((r) => r.players);
	const me = useRoom((r) => r.conn?.me);
	const status = useRoom((r) => r.status);

	return (
		<Sheet>
			<SheetTrigger aria-label="Players" className={iconButton}>
				<Users className="size-4" />
			</SheetTrigger>
			<SheetContent side="bottom">
				<div className="mx-auto flex w-full max-w-md flex-col gap-4 p-4">
					<SheetHeader className="p-0">
						<SheetTitle>
							Players {players.length} / {MAX_PLAYERS}
						</SheetTitle>
						{(status === "connecting" || status === "disconnected") && (
							<SheetDescription>You are {status}.</SheetDescription>
						)}
					</SheetHeader>
					<ul className="flex flex-col gap-2 text-sm">
						{players.map((p) => (
							<li key={p.id}>
								{p.name}
								{p.id === me && (
									<span className="text-muted-foreground"> (you)</span>
								)}
							</li>
						))}
					</ul>
					<ShareRoom code={code} />
				</div>
			</SheetContent>
		</Sheet>
	);
}
