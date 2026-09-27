import { type Context, type ImageInfo, imageProblem } from "@piecemates/api";
import { isImageWidth } from "@piecemates/game";
import { AwsClient } from "aws4fetch";

import { ENV } from "./env.server";
import { STATUS } from "./http";

const UPLOAD_URL_TTL_S = 300;
const WEBP_QUALITY = 85;
/** A variant never changes, so clients keep it. */
const CACHE_FOREVER = "public, max-age=31536000, immutable";
const UPLOAD_ID =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const original = (id: string) => `uploads/${id}`;
const variants = (id: string) => `variants/${id}/`;
const variant = (id: string, width: number) => `${variants(id)}${width}.webp`;

let r2: AwsClient | undefined;

/** Reads an image's real format and size; throws when it isn't one. */
async function measure(file: ReadableStream): Promise<ImageInfo> {
	const info = await ENV.IMAGES.info(file);
	return "width" in info
		? { format: info.format, width: info.width, height: info.height }
		: { format: info.format, width: 0, height: 0 };
}

/** Uploaded photos: originals stay private in R2, players get resized copies from `/images/:id`. */
export const photoStorage: Context["images"] = {
	uploadUrl: async (id, type, size) => {
		r2 ??= new AwsClient({
			accessKeyId: ENV.R2_ACCESS_KEY_ID,
			secretAccessKey: ENV.R2_SECRET_ACCESS_KEY,
			service: "s3",
			region: "auto",
		});
		const url = new URL(
			`https://${ENV.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${ENV.R2_BUCKET}/${original(id)}`,
		);
		url.searchParams.set("X-Amz-Expires", String(UPLOAD_URL_TTL_S));
		// Signed type and length, so R2 refuses any other file, and If-None-Match,
		// so it refuses a second file on the same key: one URL puts one photo.
		const request = new Request(url, {
			method: "PUT",
			headers: {
				"content-type": type,
				"content-length": String(size),
				"if-none-match": "*",
			},
		});
		const signed = await r2.sign(request, {
			aws: { signQuery: true, allHeaders: true },
		});
		return signed.url;
	},
	info: async (id) => {
		const file = await ENV.IMAGES_BUCKET.get(original(id));
		return file && measure(file.body);
	},
	url: (id) => `${ENV.BETTER_AUTH_URL}/images/${id}`,
	remove: async (id) => {
		const { objects } = await ENV.IMAGES_BUCKET.list({ prefix: variants(id) });
		await ENV.IMAGES_BUCKET.delete([
			original(id),
			...objects.map((o) => o.key),
		]);
	},
};

/** The photo resized to `width` as WebP (which drops EXIF), made once and kept in R2. */
export async function serveImage(id: string, width: number) {
	if (!UPLOAD_ID.test(id) || !isImageWidth(width))
		return new Response("Bad request", { status: STATUS.badRequest });
	const headers = {
		"content-type": "image/webp",
		"cache-control": CACHE_FOREVER,
	};
	const kept = await ENV.IMAGES_BUCKET.get(variant(id, width));
	if (kept) return new Response(kept.body, { headers });
	const file = await ENV.IMAGES_BUCKET.get(original(id));
	if (!file) return new Response("Not found", { status: STATUS.notFound });
	const [head, body] = file.body.tee();
	const info = await measure(head).catch(() => undefined);
	// Never transform a file that couldn't be a room's photo (e.g. a pixel bomb).
	if (!info || imageProblem(info)) {
		await body.cancel();
		return new Response("Not found", { status: STATUS.notFound });
	}
	const resized = await ENV.IMAGES.input(body)
		.transform({ width, fit: "scale-down" })
		.output({ format: "image/webp", quality: WEBP_QUALITY });
	const bytes = await resized.response().arrayBuffer();
	await ENV.IMAGES_BUCKET.put(variant(id, width), bytes, {
		httpMetadata: { contentType: "image/webp" },
	});
	return new Response(bytes, { headers });
}
