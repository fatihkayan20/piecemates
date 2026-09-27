import { IMAGE_STEP, imageWidth, MAX_IMAGE_WIDTH } from "@piecemates/game";

/** The history and Continue row thumbnail, in px (web) and pt (native). */
export const ROW_IMAGE_SIZE = 96;

// Our resize route and Unsplash (imgix) both take the width as `w`; a local
// file picked for upload (blob:, file:) stays as it is.
const sized = (url: string, width: number) => {
	const u = new URL(url);
	if (!u.protocol.startsWith("http")) return url;
	u.searchParams.set("w", String(width));
	return u.toString();
};

/** The photo resized for `size` points on screen: device pixels rounded up to a step. */
export const imageSrc = (url: string, size: number, pixelRatio: number) =>
	sized(url, imageWidth(size * pixelRatio));

/** Every width the server makes, for an `<img srcset>`; the browser picks one. None for a local file. */
export const imageSrcSet = (url: string) =>
	!url.startsWith("http")
		? undefined
		: Array.from({ length: MAX_IMAGE_WIDTH / IMAGE_STEP }, (_, i) => {
				const w = (i + 1) * IMAGE_STEP;
				return `${sized(url, w)} ${w}w`;
			}).join(", ");
