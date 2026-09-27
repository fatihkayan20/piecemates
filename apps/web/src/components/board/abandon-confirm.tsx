import { Button } from "@piecemates/ui/components/button";
import { useNavigate } from "@tanstack/react-router";
import { Flag } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { api } from "@/lib/api";

/** The settings sheet's second face: asks before abandoning, then back home. */
export function AbandonConfirm({
	code,
	onCancel,
}: {
	code: string;
	onCancel: () => void;
}) {
	const { t } = useTranslation();
	const navigate = useNavigate();

	const abandon = async () => {
		try {
			await api.abandon(code);
			await navigate({ to: "/" });
		} catch {
			toast.error(t("room.abandonFailed"));
		}
	};

	return (
		<div className="flex flex-col items-center justify-center gap-3 text-center">
			<Flag className="size-8 fill-destructive text-destructive" />
			<p className="font-semibold text-lg">{t("room.abandonTitle")}</p>
			<p className="text-muted-foreground text-sm">{t("room.abandonHint")}</p>
			<Button variant="destructive" className="w-full" onClick={abandon}>
				{t("room.abandonConfirm")}
			</Button>
			{/* Focused first, so Enter keeps playing. */}
			<Button variant="outline" className="w-full" onClick={onCancel} autoFocus>
				{t("room.keepPlaying")}
			</Button>
		</div>
	);
}
