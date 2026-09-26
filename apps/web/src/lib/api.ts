import { ENV } from "../env.public";
import { ensureSession } from "./auth-client";

export type RoomInfo = {
	code: string;
	imageUrl: string;
	seed: number;
	rows: number;
	cols: number;
	status: "playing" | "done";
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
	await ensureSession();
	const res = await fetch(`${ENV.VITE_SERVER_URL}${path}`, {
		...init,
		credentials: "include",
		headers: { "content-type": "application/json" },
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
	`${ENV.VITE_SERVER_URL.replace(/^http/, "ws")}/rooms/${code}/ws`;
