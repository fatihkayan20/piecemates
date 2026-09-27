import { historyLines } from "@piecemates/client";
import { createFileRoute, Link } from "@tanstack/react-router";
import i18next from "i18next";
import { useTranslation } from "react-i18next";

import { api } from "@/lib/api";

export const Route = createFileRoute("/history")({
	loader: () => api.history(),
	component: HistoryComponent,
	errorComponent: () => (
		<p className="p-4">{i18next.t("history.loadFailed")}</p>
	),
});

/** Rooms I've played in; an open one resumes, a solved one shows the picture. */
function HistoryComponent() {
	const { t } = useTranslation();
	const rooms = Route.useLoaderData();

	return (
		<div className="container mx-auto grid max-w-3xl content-start gap-3 px-4 py-6">
			<h2 className="font-medium">{t("history.title")}</h2>
			{rooms.length === 0 && (
				<p className="text-muted-foreground text-sm">{t("history.empty")}</p>
			)}
			<ul className="grid gap-2">
				{rooms.map((room) => {
					const lines = historyLines(room);
					return (
						<li key={room.code}>
							<Link
								to="/room/$code"
								params={{ code: room.code }}
								className="grid gap-0.5 rounded border p-3 hover:bg-muted"
							>
								<span className="font-medium">{lines.title}</span>
								<span className="text-sm">{lines.status}</span>
								<span className="text-muted-foreground text-sm">
									{lines.players}
								</span>
							</Link>
						</li>
					);
				})}
			</ul>
		</div>
	);
}
