export type RoomInfo = {
	code: string;
	imageUrl: string;
	seed: number;
	rows: number;
	cols: number;
	status: "playing" | "done";
};

export type NewRoom = {
	imageUrl: string;
	imageW: number;
	imageH: number;
	rows: number;
	cols: number;
};

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
		if (!res.ok) throw new Error((await res.text()) || res.statusText);
		return res.json() as Promise<T>;
	}

	return {
		createRoom: (room: NewRoom) =>
			request<{ code: string }>("/rooms", {
				method: "POST",
				body: JSON.stringify(room),
			}),
		getRoom: (code: string) => request<RoomInfo>(`/rooms/${code}`),
		roomSocketUrl: (code: string) =>
			`${opts.serverUrl.replace(/^http/, "ws")}/rooms/${code}/ws`,
	};
}
