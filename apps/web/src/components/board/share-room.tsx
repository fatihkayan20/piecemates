import { roomUrl } from "@piecemates/client";
import { track } from "@piecemates/telemetry";
import { Button } from "@piecemates/ui/components/button";
import { Share } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

/** Shares the room link (phones) or copies it. */
export function ShareRoom({ code }: { code: string }) {
	const { t } = useTranslation();
	const share = async () => {
		const url = roomUrl(location.origin, code);
		track("room_shared", {});
		// Desktop share sheets are rare and clumsy; copying is what people expect there.
		if (navigator.share && matchMedia("(pointer: coarse)").matches) {
			await navigator.share({ url }).catch(() => undefined);
			return;
		}
		await navigator.clipboard.writeText(url);
		toast.success(t("players.copied"));
	};

	return (
		<Button
			variant="outline"
			size="lg"
			className="w-full"
			title={t("players.copyLink", { code })}
			onClick={share}
		>
			<Share data-icon="inline-start" />
			{t("players.share")}
		</Button>
	);
}
