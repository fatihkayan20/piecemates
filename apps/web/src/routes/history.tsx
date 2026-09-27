import { createFileRoute } from "@tanstack/react-router";
import i18next from "i18next";
import { useTranslation } from "react-i18next";

import { RoomRow } from "@/components/room-row";
import { api } from "@/lib/api";

export const Route = createFileRoute("/history")({
	loader: () => api.history(),
	component: HistoryComponent,
	errorComponent: () => (
		<p className="p-4">{i18next.t("history.loadFailed")}</p>
	),
});

/** My solved rooms; a row shows the finished picture. */
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
				{rooms.map((room) => (
					<li key={room.code}>
						<RoomRow room={room} />
					</li>
				))}
			</ul>
		</div>
	);
}
