import { createApi } from "@piecemates/client";

import { ENV } from "../src/env";
import { authClient, ensureSession } from "./auth-client";

// Native has no browser cookie jar; the Expo auth client keeps the session cookie.
const authHeaders = async () => ({ cookie: await authClient.getCookie() });

export const api = createApi({
	serverUrl: ENV.EXPO_PUBLIC_SERVER_URL,
	ensureSession,
	credentials: "omit",
	authHeaders,
});

/** React Native's WebSocket takes headers as a third argument, so the socket can authenticate. */
export async function openRoomSocket(code: string) {
	// biome-ignore lint/plugin: the DOM WebSocket type lacks React Native's headers argument.
	const NativeWebSocket = WebSocket as unknown as new (
		url: string,
		protocols: undefined,
		options: { headers: Record<string, string> },
	) => WebSocket;
	return new NativeWebSocket(api.roomSocketUrl(code), undefined, {
		headers: await authHeaders(),
	});
}
