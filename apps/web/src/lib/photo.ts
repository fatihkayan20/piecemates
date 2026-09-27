import {
	imageProblem,
	MAX_IMAGE_WIDTH,
	UPLOAD_QUALITY,
	uploadType,
} from "@piecemates/game";

/**
 * Makes a picked photo ready to upload: checked, turned upright (the browser
 * applies its EXIF orientation) and no wider than the widest size we show.
 * Throws an upload problem the player can act on.
 */
export async function preparePhoto(file: File) {
	if (!uploadType(file.type)) throw new Error("notAnImage");
	const bitmap = await createImageBitmap(file).catch(() => {
		throw new Error("notAnImage");
	});
	const { width, height } = bitmap;
	const problem = imageProblem({ format: file.type, width, height });
	if (problem) throw new Error(problem);
	const scale = Math.min(1, MAX_IMAGE_WIDTH / width);
	const canvas = document.createElement("canvas");
	canvas.width = Math.round(width * scale);
	canvas.height = Math.round(height * scale);
	// ponytail: transparent parts of a PNG turn black in the JPEG; keep PNG if players mind.
	canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
	bitmap.close();
	const blob = await new Promise<Blob | null>((done) =>
		canvas.toBlob(done, "image/jpeg", UPLOAD_QUALITY),
	);
	if (!blob) throw new Error("notAnImage");
	return { blob, width: canvas.width, height: canvas.height };
}
