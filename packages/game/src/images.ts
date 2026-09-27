/** Photo upload limits and the widths the server resizes to. */

/** Formats a photo may be uploaded in. SVG (scripts), GIF and HEIC are left out. */
export const UPLOAD_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export type UploadType = (typeof UPLOAD_TYPES)[number];
/** 20 MB. */
export const MAX_UPLOAD_BYTES = 20_971_520;
/** JPEG quality a photo is re-encoded to before upload (upright, at most MAX_IMAGE_WIDTH wide). */
export const UPLOAD_QUALITY = 0.85;
/** A smaller photo is too blurry to cut into pieces. */
export const MIN_IMAGE_SIDE = 400;
export const MAX_IMAGE_PIXELS = 50_000_000;
/** Uploads from one IP in a day, so fresh guest logins can't farm their free uploads. */
export const MAX_UPLOADS_PER_IP = 10;
/** A day. */
export const UPLOAD_WINDOW_MS = 86_400_000;

/** Resized widths are multiples of this, so a photo has a few variants however many screens ask. */
export const IMAGE_STEP = 256;
export const MAX_IMAGE_WIDTH = 3072;

/** The resized width to ask for: pixels on screen rounded up to a step, at most the max. */
export const imageWidth = (pixels: number) =>
	Math.min(
		MAX_IMAGE_WIDTH,
		Math.max(IMAGE_STEP, Math.ceil(pixels / IMAGE_STEP) * IMAGE_STEP),
	);

/** A width the server resizes to. */
export const isImageWidth = (w: number) =>
	Number.isInteger(w) && w === imageWidth(w);

/** The upload type for a file's MIME type, or undefined when it can't be uploaded. */
export const uploadType = (type: string) =>
	UPLOAD_TYPES.find((t) => t === type);

/** Why a photo can't be a puzzle, or undefined when it can. `format` is its MIME type. */
export const imageProblem = (info: {
	format: string;
	width: number;
	height: number;
}) => {
	if (!uploadType(info.format)) return "notAnImage";
	if (Math.min(info.width, info.height) < MIN_IMAGE_SIDE)
		return "imageTooSmall";
	if (info.width * info.height > MAX_IMAGE_PIXELS) return "imageTooLarge";
	return undefined;
};
