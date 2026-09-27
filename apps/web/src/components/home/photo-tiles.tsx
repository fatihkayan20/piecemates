import type { PickedImage, Sample } from "@piecemates/client";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { SampleTile } from "@/components/home/sample-tile";
import { UploadTile } from "@/components/home/upload-tile";
import { Photo } from "@/components/photo";
import { api } from "@/lib/api";

/** A third of Home's column. */
const TILE_SIZES = "(min-width: 48rem) 16rem, 33vw";
const TILE =
	"relative overflow-hidden rounded disabled:opacity-50 [&>img]:aspect-video [&>img]:w-full [&>img]:object-cover";

/** Photos to start a room from: my uploaded photo not yet used or a new upload, then a category's samples. */
export function PhotoTiles({
	samples,
	disabled,
	onPick,
}: {
	samples: Sample[];
	disabled: boolean;
	onPick: (image: PickedImage) => void;
}) {
	const { t } = useTranslation();
	const { data: unused } = useQuery(api.unusedUpload());
	return (
		<div className="grid grid-cols-3 gap-2">
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
			{/* An uploaded photo is resumed, not replaced. */}
			{!unused && <UploadTile disabled={disabled} onPick={onPick} />}
			{samples.map((sample) => (
				<SampleTile
					key={sample.id}
					sample={sample}
					sizes={TILE_SIZES}
					disabled={disabled}
					onPick={onPick}
				/>
			))}
		</div>
	);
}
