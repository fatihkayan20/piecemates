import { createApi } from "@piecemates/client";

import { ENV } from "../env.public";
import { ensureSession } from "./auth-client";

export const api = createApi({
	serverUrl: ENV.VITE_SERVER_URL,
	ensureSession,
	credentials: "include",
});

export const openRoomSocket = async (code: string) =>
	new WebSocket(api.roomSocketUrl(code));
