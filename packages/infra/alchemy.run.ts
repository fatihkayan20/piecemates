import * as Alchemy from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import * as Config from "effect/Config";
import * as Effect from "effect/Effect";
import "varlock/auto-load";

import type { Room } from "../../apps/server/src/room";

export const db = Cloudflare.D1.Database("database", {
	migrations: "../../packages/db/src/migrations",
});

/** Uploaded photos (private) and the resized copies the Worker serves. A real bucket even in dev, since presigned URLs need R2's S3 API. */
export const images = Cloudflare.R2.Bucket("images", {
	cors: [
		{
			allowedMethods: ["PUT"],
			allowedOrigins: [process.env.CORS_ORIGIN ?? ""],
			allowedHeaders: ["content-type", "if-none-match"],
		},
	],
}).pipe(Alchemy.remote());

// Built after the bucket, so its name and account reach the Worker.
export const server = Effect.flatMap(images, (bucket) =>
	Cloudflare.Worker("server", {
		main: "../../apps/server/src/index.ts",
		env: {
			DB: db,
			ROOM: Cloudflare.DurableObject<Room>("Room"),
			IMAGES_BUCKET: images,
			IMAGES: Cloudflare.Images.Images("IMAGES"),
			// Writes one user can make per minute (API mutations and room connects).
			API_LIMIT: Cloudflare.RateLimit("API_LIMIT", {
				namespaceId: 1001,
				simple: { limit: 30, period: 60 },
			}),
			// Reads one user can make per minute (API queries).
			READ_LIMIT: Cloudflare.RateLimit("READ_LIMIT", {
				namespaceId: 1002,
				simple: { limit: 120, period: 60 },
			}),
			// For presigned upload URLs to R2's S3 API.
			R2_ACCOUNT_ID: bucket.accountId,
			R2_BUCKET: bucket.bucketName,
			R2_ACCESS_KEY_ID: Config.Redacted("R2_ACCESS_KEY_ID"),
			R2_SECRET_ACCESS_KEY: Config.Redacted("R2_SECRET_ACCESS_KEY"),
			CORS_ORIGIN: Config.String("CORS_ORIGIN"),
			BETTER_AUTH_SECRET: Config.Redacted("BETTER_AUTH_SECRET"),
			BETTER_AUTH_URL: Cloudflare.Worker.URL,
			NODE_ENV: Config.String("NODE_ENV").pipe(
				Config.withDefault("production"),
			),
			// Empty turns Sentry off.
			SENTRY_DSN: Config.String("SENTRY_DSN").pipe(Config.withDefault("")),
		},
		// Daily at 03:00 UTC: unused uploads and stray files (apps/server/src/cleanup.ts).
		crons: ["0 3 * * *"],
		dev: {
			port: 3000,
		},
	}),
);

export type ServerEnv = Cloudflare.InferEnv<typeof server>;

export default Alchemy.Stack(
	"piecemates",
	{
		providers: Cloudflare.providers(),
		state: Cloudflare.state(),
	},
	Effect.gen(function* () {
		const serverWorker = yield* server;
		const webWorker = yield* Cloudflare.Website.Vite("web", {
			rootDir: "../../apps/web",
			assets: {
				htmlHandling: "auto-trailing-slash",
				notFoundHandling: "single-page-application",
			},
			env: {
				VITE_SERVER_URL: serverWorker.url.as<string>(),
			},
			dev: {
				port: 3001,
			},
		});

		return {
			web: webWorker.url,
			server: serverWorker.url,
		};
	}),
);
