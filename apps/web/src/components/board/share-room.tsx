import { roomUrl } from "@puzzle/client";
import { Button } from "@puzzle/ui/components/button";
import { Share } from "lucide-react";
import { toast } from "sonner";

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
		<Button
			variant="outline"
			size="lg"
			className="w-full"
			title={`Copy link to room ${code}`}
			onClick={share}
		>
			<Share data-icon="inline-start" />
			Share room link
		</Button>
	);
}
