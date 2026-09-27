import { isNameNeeded, roomUrl } from "@piecemates/client";
import { track } from "@piecemates/telemetry";
import { Button } from "@piecemates/ui/components/button";
import { useMutation } from "@tanstack/react-query";
import { Share } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { NameDialog } from "@/components/name-dialog";
import { useRoom } from "@/hooks/use-room";
import { api } from "@/lib/api";

/** Makes the room joinable (after asking my name if I have none), then shares its link (phones) or copies it. */
export function ShareRoom({ code }: { code: string }) {
	const { t } = useTranslation();
	const { mutateAsync } = useMutation(api.share());
	const [askName, setAskName] = useState(false);
	const conn = useRoom((r) => r.conn);
	const share = async () => {
		const shared = await mutateAsync(code).catch((error: unknown) => {
			if (isNameNeeded(error)) setAskName(true);
			else toast.error(t("players.shareFailed"));
		});
		if (!shared) return;
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
		<>
			<NameDialog
				open={askName}
				onOpenChange={setAskName}
				onSaved={() => {
					setAskName(false);
					conn?.renamed();
					void share();
				}}
			/>
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
		</>
	);
}
