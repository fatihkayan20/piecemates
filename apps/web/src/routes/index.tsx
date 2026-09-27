import { SAMPLE_IMAGES } from "@piecemates/client";
import { MAX_OPEN_ROOMS } from "@piecemates/game";
import { Button } from "@piecemates/ui/components/button";
import { Input } from "@piecemates/ui/components/input";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import {
	NewRoomSheet,
	type PickedImage,
} from "@/components/home/new-room-sheet";
import { RoomRow } from "@/components/room-row";
import { api } from "@/lib/api";

export const Route = createFileRoute("/")({
	// Home still works without the list; creating a room is checked again on the server.
	loader: () => api.openRooms().catch(() => []),
	component: HomeComponent,
});

function HomeComponent() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const [picked, setPicked] = useState<PickedImage>();
	const [code, setCode] = useState("");
	const open = Route.useLoaderData();
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
				<div className="grid grid-cols-3 gap-2">
					{SAMPLE_IMAGES.map((url, i) => (
						<button
							key={url}
							type="button"
							aria-label={t("home.sampleImage", { n: i + 1 })}
							disabled={full}
							className="overflow-hidden rounded disabled:opacity-50"
							onClick={(e) => {
								const img = e.currentTarget.querySelector("img");
								if (img)
									setPicked({
										url,
										width: img.naturalWidth,
										height: img.naturalHeight,
									});
							}}
						>
							<img
								src={url}
								alt=""
								crossOrigin="anonymous"
								className="aspect-video w-full object-cover"
							/>
						</button>
					))}
				</div>
			</section>
			<NewRoomSheet image={picked} onClose={() => setPicked(undefined)} />
		</div>
	);
}
