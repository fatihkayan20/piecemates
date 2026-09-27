import { sentryVitePlugin } from "@sentry/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
	const { SENTRY_AUTH_TOKEN } = loadEnv(mode, process.cwd(), "SENTRY_");
	return {
		server: {
			port: 3001,
		},
		resolve: {
			tsconfigPaths: true,
		},
		build: {
			// Only uploaded to Sentry, never served.
			sourcemap: "hidden",
		},
		plugins: [
			tailwindcss(),
			tanstackRouter({
				target: "react",
				autoCodeSplitting: true,
			}),
			react(),
			// Last, as its docs say. Without a token (local builds) it skips the upload.
			sentryVitePlugin({
				org: "piecemates",
				project: "web",
				authToken: SENTRY_AUTH_TOKEN,
				disable: !SENTRY_AUTH_TOKEN,
				sourcemaps: { filesToDeleteAfterUpload: ["./dist/**/*.map"] },
			}),
		],
	};
});
