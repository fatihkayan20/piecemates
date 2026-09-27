import { track } from "@piecemates/telemetry";

export type RoomInfo = {
	code: string;
	imageUrl: string;
	seed: number;
	rows: number;
	cols: number;
	status: "playing" | "done";
};

/** A room I've been in, for History. Times are ms since the epoch. */
export type RoomSummary = {
	code: string;
	pieces: number;
	status: "playing" | "done";
	playedMs: number;
	createdAt: number;
	finishedAt: number | null;
	/** Names of the other players. */
	players: string[];
};

export type NewRoom = {
	imageUrl: string;
	imageW: number;
	imageH: number;
	rows: number;
	cols: number;
	/** Pieces start turned and players turn them. */
	rotate: boolean;
};

/** A non-2xx answer; the status lets Sentry skip the ones the user caused. */
export class ApiError extends Error {
	readonly status: number;
	constructor(status: number, message: string) {
		super(message);
		this.status = status;
	}
}

/** The server's HTTP routes. Each app passes in how it authenticates. */
export function createApi(opts: {
	serverUrl: string;
	ensureSession: () => Promise<void>;
	/** Browsers send the session cookie themselves; native passes it as a header. */
	credentials: "include" | "omit";
	authHeaders?: () => Promise<Record<string, string>>;
}) {
	async function request<T>(path: string, init?: RequestInit): Promise<T> {
		await opts.ensureSession();
		const res = await fetch(`${opts.serverUrl}${path}`, {
			...init,
			credentials: opts.credentials,
			headers: {
				"content-type": "application/json",
				...(await opts.authHeaders?.()),
			},
		});
		if (!res.ok)
			throw new ApiError(res.status, (await res.text()) || res.statusText);
		return res.json() as Promise<T>;
	}

	return {
		createRoom: async (room: NewRoom) => {
			const created = await request<{ code: string }>("/rooms", {
				method: "POST",
				body: JSON.stringify(room),
			});
			track("room_created", { pieces: room.rows * room.cols });
			return created;
		},
		getRoom: (code: string) => request<RoomInfo>(`/rooms/${code}`),
		/** Rooms I've been in, newest first. */
		history: () => request<RoomSummary[]>("/rooms"),
		roomSocketUrl: (code: string) =>
			`${opts.serverUrl.replace(/^http/, "ws")}/rooms/${code}/ws`,
	};
}
