import { MAX_PLAYERS } from "@piecemates/game";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@piecemates/ui/components/sheet";
import { Users } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useRoom } from "@/hooks/use-room";

import { iconButton } from "./icon-button";
import { ShareRoom } from "./share-room";

/** The players button and a sheet listing who is in the room, with its share link. */
export function PlayersSheet({ code }: { code: string }) {
	const { t } = useTranslation();
	const players = useRoom((r) => r.players);
	const me = useRoom((r) => r.conn?.me);
	const status = useRoom((r) => r.status);

	return (
		<Sheet>
			<SheetTrigger aria-label={t("players.title")} className={iconButton}>
				<Users className="size-4" />
			</SheetTrigger>
			<SheetContent side="bottom">
				<div className="mx-auto flex w-full max-w-md flex-col gap-4 p-4">
					<SheetHeader className="p-0">
						<SheetTitle>
							{t("players.count", { count: players.length, max: MAX_PLAYERS })}
						</SheetTitle>
						{(status === "connecting" || status === "disconnected") && (
							<SheetDescription>
								{status === "connecting"
									? t("players.connecting")
									: t("players.disconnected")}
							</SheetDescription>
						)}
					</SheetHeader>
					<ul className="flex flex-col gap-2 text-sm">
						{players.map((p) => (
							<li key={p.id}>
								{p.id === me ? t("players.me", { name: p.name }) : p.name}
							</li>
						))}
					</ul>
					<ShareRoom code={code} />
				</div>
			</SheetContent>
		</Sheet>
	);
}
