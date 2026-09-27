import { SAMPLE_IMAGES } from "@piecemates/client";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import type { PickedImage } from "@/components/home/new-room-sheet";
import { UploadTile } from "@/components/home/upload-tile";
import { Photo } from "@/components/photo";
import { api } from "@/lib/api";

/** A third of Home's column. */
const TILE_SIZES = "(min-width: 48rem) 16rem, 33vw";
const TILE =
	"relative overflow-hidden rounded disabled:opacity-50 [&>img]:aspect-video [&>img]:w-full [&>img]:object-cover";

/** Photos to start a room from: the samples, my uploaded photo not yet used, and a new upload. */
export function PhotoTiles({
	disabled,
	onPick,
}: {
	disabled: boolean;
	onPick: (image: PickedImage) => void;
}) {
	const { t } = useTranslation();
	const { data: unused } = useQuery(api.unusedUpload());
	return (
		<div className="grid grid-cols-3 gap-2">
			{SAMPLE_IMAGES.map((url, i) => (
				<button
					key={url}
					type="button"
					aria-label={t("home.sampleImage", { n: i + 1 })}
					disabled={disabled}
					className={TILE}
					onClick={(e) => {
						// Any resized copy has the photo's aspect, which is all the grid needs.
						const img = e.currentTarget.querySelector("img");
						if (img)
							onPick({
								url,
								width: img.naturalWidth,
								height: img.naturalHeight,
							});
					}}
				>
					<Photo url={url} sizes={TILE_SIZES} />
				</button>
			))}
			{unused && (
				<button
					type="button"
					aria-label={t("upload.resume")}
					disabled={disabled}
					className={TILE}
					onClick={() => onPick({ ...unused, upload: unused.id })}
				>
					<Photo url={unused.url} sizes={TILE_SIZES} />
					<span className="absolute inset-x-0 bottom-0 bg-background/80 p-1 text-xs">
						{t("upload.resume")}
					</span>
				</button>
			)}
			<UploadTile disabled={disabled} onPick={onPick} />
		</div>
	);
}
