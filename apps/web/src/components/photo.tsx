import { imageSrc, imageSrcSet } from "@piecemates/client";
import { IMAGE_STEP } from "@piecemates/game";
import type { ComponentProps } from "react";

/**
 * A room photo at the width it shows at: the browser picks a resized copy
 * from `sizes` (the CSS width, like `6rem` or `33vw`) and caches it.
 */
export function Photo({
	url,
	sizes,
	...props
}: { url: string; sizes: string } & ComponentProps<"img">) {
	return (
		<img
			src={imageSrc(url, IMAGE_STEP, 1)}
			srcSet={imageSrcSet(url)}
			sizes={sizes}
			alt=""
			loading="lazy"
			decoding="async"
			{...props}
		/>
	);
}
