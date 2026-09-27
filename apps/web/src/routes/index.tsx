import type { PickedImage } from "@piecemates/client";
import { MAX_OPEN_ROOMS, ROOM_CODE_LENGTH } from "@piecemates/game";
import { Button } from "@piecemates/ui/components/button";
import { Input } from "@piecemates/ui/components/input";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { NewRoomSheet } from "@/components/home/new-room-sheet";
import { PhotoTiles } from "@/components/home/photo-tiles";
import { RoomRow } from "@/components/room-row";
import { api } from "@/lib/api";

export const Route = createFileRoute("/")({
	component: HomeComponent,
});

function HomeComponent() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const [picked, setPicked] = useState<PickedImage>();
	const [code, setCode] = useState("");
	// Home still works without the list; creating a room is checked again on the server.
	const { data: open = [] } = useQuery(api.openRooms());
	const full = open.length >= MAX_OPEN_ROOMS;
	return (
		<div className="container mx-auto grid max-w-3xl content-start gap-8 px-4 py-6">
			<section className="grid gap-3">
				<h2 className="font-medium">{t("home.joinRoom")}</h2>
				<form
					className="flex gap-2"
					onSubmit={(e) => {
						e.preventDefault();
						if (code.trim())
							void navigate({
								to: "/room/$code",
								params: { code: code.trim().toUpperCase() },
							});
					}}
				>
					<Input
						aria-label={t("home.roomCode")}
						placeholder="ABCD2345"
						maxLength={ROOM_CODE_LENGTH}
						value={code}
						onChange={(e) => setCode(e.target.value)}
						className="font-mono uppercase"
					/>
					<Button type="submit">{t("home.join")}</Button>
				</form>
			</section>

			{open.length > 0 && (
				<section className="grid gap-3">
					<h2 className="font-medium">{t("home.continue")}</h2>
					<ul className="grid gap-2">
						{open.map((room) => (
							<li key={room.code}>
								<RoomRow room={room} />
							</li>
						))}
					</ul>
				</section>
			)}

			<section className="grid gap-3">
				<h2 className="font-medium">{t("home.newPuzzle")}</h2>
				{full && (
					<p className="text-muted-foreground text-sm">
						{t("home.openRoomsFull", { max: MAX_OPEN_ROOMS })}
					</p>
				)}
				<PhotoTiles disabled={full} onPick={setPicked} />
			</section>
			<NewRoomSheet
				image={picked}
				onClose={() => {
					if (picked?.file) URL.revokeObjectURL(picked.url);
					setPicked(undefined);
				}}
			/>
		</div>
	);
}
