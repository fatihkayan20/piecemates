import {
	MAX_IMAGE_PIXELS,
	MIN_IMAGE_SIDE,
	UPLOAD_TYPES,
} from "@piecemates/game";
import { TRPCError } from "@trpc/server";

import type { Context, ImageInfo } from "./trpc";

type Me = Context & { user: { id: string } };

/** Why a file can't be a puzzle, or undefined when it can. */
export const imageProblem = (info: ImageInfo) => {
	if (!UPLOAD_TYPES.some((type) => type === info.format)) return "notAnImage";
	if (Math.min(info.width, info.height) < MIN_IMAGE_SIDE)
		return "imageTooSmall";
	if (info.width * info.height > MAX_IMAGE_PIXELS) return "imageTooLarge";
	return undefined;
};

const badImage = (problem: string) =>
	new TRPCError({ code: "BAD_REQUEST", message: problem });

/** My upload that no room uses yet; it can be resumed without spending a credit. */
export const unusedUpload = (ctx: Me) =>
	ctx.db.query.uploads.findFirst({
		where: { userId: ctx.user.id, roomCode: { isNull: true } },
	});

/** The photo behind my unused upload, measured by the server. */
export async function uploadedImage(ctx: Me, id: string) {
	const mine = await unusedUpload(ctx);
	if (mine?.id !== id) throw new TRPCError({ code: "NOT_FOUND" });
	const info = await ctx.images.info(id).catch(() => "invalid" as const);
	if (!info) throw new TRPCError({ code: "NOT_FOUND" });
	if (info === "invalid") throw badImage("notAnImage");
	const problem = imageProblem(info);
	if (problem) throw badImage(problem);
	return { url: ctx.images.url(id), width: info.width, height: info.height };
}
