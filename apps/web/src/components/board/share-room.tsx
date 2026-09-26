import { roomUrl } from "@puzzle/client";
import { Share } from "lucide-react";
import { toast } from "sonner";

import { iconButton } from "./icon-button";

/** Shares the room link (phones) or copies it. */
export function ShareRoom({ code }: { code: string }) {
	const share = async () => {
		const url = roomUrl(location.origin, code);
		// Desktop share sheets are rare and clumsy; copying is what people expect there.
		if (navigator.share && matchMedia("(pointer: coarse)").matches) {
			await navigator.share({ url }).catch(() => undefined);
			return;
		}
		await navigator.clipboard.writeText(url);
		toast.success("Room link copied");
	};

	return (
		<button
			type="button"
			title={`Copy link to room ${code}`}
			aria-label="Share room link"
			className={iconButton}
			onClick={share}
		>
			<Share className="size-4" />
		</button>
	);
}
