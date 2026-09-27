import { MAX_API_BATCH } from "@piecemates/game";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import { roomsRouter } from "./rooms";
import { samplesRouter } from "./samples";
import { type Context, router } from "./trpc";
import { uploadsRouter } from "./uploads";

export type { Context, ImageInfo, RoomInit } from "./trpc";

/** Where the Worker serves the API. */
export const API_PATH = "/trpc";

export const appRouter = router({
	rooms: roomsRouter,
	samples: samplesRouter,
	uploads: uploadsRouter,
});

export type AppRouter = typeof appRouter;

/** Answers one API request; `onError` sees the errors that are our bugs. */
export const handleApi = (
	req: Request,
	ctx: Context,
	onError: (error: unknown) => void,
) =>
	fetchRequestHandler({
		endpoint: API_PATH,
		req,
		router: appRouter,
		createContext: () => ctx,
		maxBatchSize: MAX_API_BATCH,
		onError: ({ error }) => {
			if (error.code === "INTERNAL_SERVER_ERROR") onError(error.cause ?? error);
		},
	});
