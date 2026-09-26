import { SAMPLE_IMAGES } from "@piecemates/client";
import { type GridOption, gridOptions } from "@piecemates/game";
import { Button } from "@piecemates/ui/components/button";
import { Input } from "@piecemates/ui/components/input";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { api } from "@/lib/api";

export const Route = createFileRoute("/")({
	component: HomeComponent,
});

type PickedImage = {
	url: string;
	width: number;
	height: number;
	options: GridOption[];
};

function HomeComponent() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const [picked, setPicked] = useState<PickedImage>();
	const [code, setCode] = useState("");
	const [busy, setBusy] = useState(false);

	const pickImage = (url: string, img: HTMLImageElement) => {
		const width = img.naturalWidth;
		const height = img.naturalHeight;
		setPicked({ url, width, height, options: gridOptions(width, height) });
	};

	const createPuzzle = async (grid: GridOption) => {
		if (!picked) return;
		setBusy(true);
		try {
			const room = await api.createRoom({
				imageUrl: picked.url,
				imageW: picked.width,
				imageH: picked.height,
				rows: grid.rows,
				cols: grid.cols,
			});
			await navigate({ to: "/room/$code", params: { code: room.code } });
		} catch {
			toast.error(t("home.createFailed"));
			setBusy(false);
		}
	};

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

			<section className="grid gap-3">
				<h2 className="font-medium">{t("home.newPuzzle")}</h2>
				<div className="grid grid-cols-3 gap-2">
					{SAMPLE_IMAGES.map((url) => (
						<button
							key={url}
							type="button"
							aria-pressed={picked?.url === url}
							className="overflow-hidden rounded border-2 border-transparent aria-pressed:border-primary"
							onClick={(e) => {
								const img = e.currentTarget.querySelector("img");
								if (img) pickImage(url, img);
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
				{picked && (
					<div className="flex flex-wrap gap-2">
						{picked.options.map((grid) => (
							<Button
								key={grid.count}
								variant="outline"
								disabled={busy}
								onClick={() => createPuzzle(grid)}
							>
								{t("home.pieces", { count: grid.count })}
							</Button>
						))}
					</div>
				)}
			</section>
		</div>
	);
}
