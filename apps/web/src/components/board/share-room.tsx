import { roomUrl } from "@puzzle/client";
import { toast } from "sonner";

/** The room code; tapping it shares the room link (phones) or copies it. */
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
			title="Copy room link"
			className="ml-auto shrink-0 rounded bg-black/60 px-2 py-1 font-mono hover:bg-black/80"
			onClick={share}
		>
			Room {code} ⧉
		</button>
	);
}
