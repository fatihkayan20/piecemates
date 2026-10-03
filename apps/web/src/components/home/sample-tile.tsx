import type { PickedImage, Sample } from "@piecemates/client";
import { cn } from "@piecemates/ui/lib/utils";
import { useTranslation } from "react-i18next";

import { Photo } from "@/components/photo";
import { CREDIT_LINK } from "@/components/sample-credit";

/** A sample photo to start a room from, in its own colour until it loads, with its photographer under it. */
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
	const { url, width, height, color, author, authorUrl } = sample;
	return (
		<div className={cn("grid min-w-0 content-start gap-1", className)}>
			<button
				type="button"
				aria-label={t("home.sampleBy", { author })}
				disabled={disabled}
				// The photo's own colour comes from the catalogue, not the theme.
				style={{ backgroundColor: color }}
				className="overflow-hidden rounded disabled:opacity-50 [&>img]:aspect-video [&>img]:w-full [&>img]:object-cover"
				onClick={() => onPick({ url, width, height, sample })}
			>
				<Photo url={url} sizes={sizes} />
			</button>
			<a
				href={authorUrl}
				target="_blank"
				rel="noreferrer"
				className={cn(CREDIT_LINK, "truncate text-muted-foreground text-xs")}
			>
				{author}
			</a>
		</div>
	);
}
