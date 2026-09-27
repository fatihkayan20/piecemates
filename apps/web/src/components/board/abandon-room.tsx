import { Button } from "@piecemates/ui/components/button";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { useRoom } from "@/hooks/use-room";
import { api } from "@/lib/api";

/** Abandon, with a confirm step, for an unsolved room; then back home. */
export function AbandonRoom({ code }: { code: string }) {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const done = useRoom((r) => r.status === "done");
	const [confirming, setConfirming] = useState(false);
	if (done) return null;

	const abandon = async () => {
		try {
			await api.abandon(code);
			await navigate({ to: "/" });
		} catch {
			toast.error(t("room.abandonFailed"));
		}
	};

	if (!confirming)
		return (
			<Button variant="destructive" onClick={() => setConfirming(true)}>
				{t("room.abandon")}
			</Button>
		);
	return (
		<div className="grid gap-2 rounded border p-3">
			<p className="font-medium">{t("room.abandonTitle")}</p>
			<p className="text-muted-foreground text-sm">{t("room.abandonHint")}</p>
			<div className="flex justify-end gap-2">
				<Button variant="outline" onClick={() => setConfirming(false)}>
					{t("room.keepPlaying")}
				</Button>
				<Button variant="destructive" onClick={abandon}>
					{t("room.abandonConfirm")}
				</Button>
			</div>
		</div>
	);
}
