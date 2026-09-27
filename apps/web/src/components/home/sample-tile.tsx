import type { PickedImage, Sample } from "@piecemates/client";
import { cn } from "@piecemates/ui/lib/utils";
import { useTranslation } from "react-i18next";

import { Photo } from "@/components/photo";

/** A sample photo to start a room from, in its own colour until it loads. */
export function SampleTile({
	sample,
	sizes,
	disabled,
	className,
	onPick,
}: {
	sample: Sample;
	/** The tile's CSS width, for the photo's resized copy. */
	sizes: string;
	disabled: boolean;
	className?: string;
	onPick: (image: PickedImage) => void;
}) {
	const { t } = useTranslation();
	const { url, width, height, color, author } = sample;
	return (
		<button
			type="button"
			aria-label={t("home.sampleBy", { author })}
			disabled={disabled}
			// The photo's own colour comes from the catalogue, not the theme.
			style={{ backgroundColor: color }}
			className={cn(
				"overflow-hidden rounded disabled:opacity-50 [&>img]:aspect-video [&>img]:w-full [&>img]:object-cover",
				className,
			)}
			onClick={() => onPick({ url, width, height, sample })}
		>
			<Photo url={url} sizes={sizes} />
		</button>
	);
}
