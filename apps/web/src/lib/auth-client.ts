import { createEnsureSession } from "@piecemates/client";
import { anonymousClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import { ENV } from "../env.public";

export const authClient = createAuthClient({
	baseURL: ENV.VITE_SERVER_URL,
	plugins: [anonymousClient()],
});

export const ensureSession = createEnsureSession(authClient);
