import {
	imageProblem,
	MAX_IMAGE_WIDTH,
	UPLOAD_QUALITY,
} from "@piecemates/game";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";

/**
 * Makes a picked photo ready to upload: redrawn upright (the library keeps
 * the EXIF orientation, which the server doesn't apply), no wider than the
 * widest size we show, as JPEG (HEIC too). Throws an upload problem.
 */
export async function preparePhoto(picked: { uri: string; width: number }) {
	const context = ImageManipulator.manipulate(picked.uri);
	if (picked.width > MAX_IMAGE_WIDTH)
		context.resize({ width: MAX_IMAGE_WIDTH });
	const image = await context.renderAsync();
	const { uri, width, height } = await image.saveAsync({
		compress: UPLOAD_QUALITY,
		format: SaveFormat.JPEG,
	});
	const type = "image/jpeg";
	const problem = imageProblem({ format: type, width, height });
	if (problem) throw new Error(problem);
	// A fetched file's Blob has no type, and React Native sends that as the content-type.
	const data = await (await fetch(uri)).blob();
	return { uri, width, height, file: new Blob([data], { type }) };
}
