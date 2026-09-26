import { type GridOption, gridOptions } from "@puzzle/game";
import { Button } from "@puzzle/ui/components/button";
import { Input } from "@puzzle/ui/components/input";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { createRoom } from "@/lib/api";

export const Route = createFileRoute("/")({
	component: HomeComponent,
});

// ponytail: fixed samples until Unsplash search lands (step 7).
const SAMPLES = [
	"photo-1506744038136-46273834b3fb",
	"photo-1501785888041-af3ef285b470",
	"photo-1470071459604-3b5ec3a7fe05",
].map((id) => `https://images.unsplash.com/${id}?w=1600&q=80`);

type Picked = { url: string; w: number; h: number; options: GridOption[] };

function HomeComponent() {
	const navigate = useNavigate();
	const [picked, setPicked] = useState<Picked>();
	const [code, setCode] = useState("");
	const [busy, setBusy] = useState(false);

	const pick = (url: string, img: HTMLImageElement) => {
		const w = img.naturalWidth;
		const h = img.naturalHeight;
		setPicked({ url, w, h, options: gridOptions(w, h) });
	};

	const create = async (o: GridOption) => {
		if (!picked) return;
		setBusy(true);
		try {
			const room = await createRoom({
				imageUrl: picked.url,
				imageW: picked.w,
				imageH: picked.h,
				rows: o.rows,
				cols: o.cols,
			});
			await navigate({ to: "/room/$code", params: { code: room.code } });
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Could not create room");
			setBusy(false);
		}
	};

	return (
		<div className="container mx-auto grid max-w-3xl content-start gap-8 px-4 py-6">
			<section className="grid gap-3">
				<h2 className="font-medium">Join a room</h2>
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
						aria-label="Room code"
						placeholder="ABC123"
						value={code}
						onChange={(e) => setCode(e.target.value)}
						className="font-mono uppercase"
					/>
					<Button type="submit">Join</Button>
				</form>
			</section>

			<section className="grid gap-3">
				<h2 className="font-medium">New puzzle</h2>
				<div className="grid grid-cols-3 gap-2">
					{SAMPLES.map((url) => (
						<button
							key={url}
							type="button"
							aria-pressed={picked?.url === url}
							className="overflow-hidden rounded border-2 border-transparent aria-pressed:border-primary"
							onClick={(e) =>
								pick(
									url,
									e.currentTarget.querySelector("img") as HTMLImageElement,
								)
							}
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
						{picked.options.map((o) => (
							<Button
								key={o.count}
								variant="outline"
								disabled={busy}
								onClick={() => create(o)}
							>
								{o.count} pieces
							</Button>
						))}
					</div>
				)}
			</section>
		</div>
	);
}
