import { ENV } from "../src/env";
import { authClient, ensureSession } from "./auth-client";

export type RoomInfo = {
	code: string;
	imageUrl: string;
	seed: number;
	rows: number;
	cols: number;
	status: "playing" | "done";
};

// Native has no browser cookie jar; the Expo auth client keeps the session cookie.
export const authHeaders = async () => ({
	cookie: await authClient.getCookie(),
});

async function request<T>(path: string, init?: RequestInit): Promise<T> {
	await ensureSession();
	const res = await fetch(`${ENV.EXPO_PUBLIC_SERVER_URL}${path}`, {
		...init,
		credentials: "omit",
		headers: { "content-type": "application/json", ...(await authHeaders()) },
	});
	if (!res.ok) throw new Error((await res.text()) || res.statusText);
	return res.json() as Promise<T>;
}

export const createRoom = (body: {
	imageUrl: string;
	imageW: number;
	imageH: number;
	rows: number;
	cols: number;
}) =>
	request<{ code: string }>("/rooms", {
		method: "POST",
		body: JSON.stringify(body),
	});

export const getRoom = (code: string) => request<RoomInfo>(`/rooms/${code}`);

export const roomSocketUrl = (code: string) =>
	`${ENV.EXPO_PUBLIC_SERVER_URL.replace(/^http/, "ws")}/rooms/${code}/ws`;
