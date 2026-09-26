// Alchemy validates deployment inputs with Varlock; Workers use native env bindings.
import type { PublicCoercedEnvSchema } from "./env";

const VITE_SERVER_URL = import.meta.env.VITE_SERVER_URL;
if (!VITE_SERVER_URL) throw new Error("VITE_SERVER_URL is not set");

export const ENV = {
	VITE_SERVER_URL,
} satisfies Pick<PublicCoercedEnvSchema, "VITE_SERVER_URL">;
