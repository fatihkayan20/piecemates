import type { AppRouter } from "@piecemates/api";
import { track } from "@piecemates/telemetry";
import { MutationCache, QueryClient } from "@tanstack/query-core";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";

type Outputs = inferRouterOutputs<AppRouter>;
/** A room as I open it. */
export type RoomInfo = Outputs["rooms"]["open"];
/** One of my rooms, for Continue and History. Times are ms since the epoch. */
export type RoomSummary = Outputs["rooms"]["list"][number];
export type NewRoom = inferRouterInputs<AppRouter>["rooms"]["create"];

/** Someone else can change my rooms too, so lists also refetch after this; my own changes invalidate them at once. */
const LIST_STALE_MS = 60_000;
/** Every key under it is one of my room lists. */
const LISTS = ["rooms"];

/**
 * The server's API behind TanStack Query: the options go straight into each
 * app's `useQuery` / `useMutation`. Each app passes in how it authenticates.
 */
export function createApi(opts: {
	serverUrl: string;
	ensureSession: () => Promise<void>;
	/** Browsers send the session cookie themselves; native passes it as a header. */
	credentials: "include" | "omit";
	authHeaders?: () => Promise<Record<string, string>>;
}) {
	const client = createTRPCClient<AppRouter>({
		links: [
			httpBatchLink({
				// The Worker's API_PATH; a value import would bundle the server.
				url: `${opts.serverUrl}/trpc`,
				fetch: (url, init) =>
					fetch(url, { ...init, credentials: opts.credentials }),
				headers: async () => {
					await opts.ensureSession();
					return (await opts.authHeaders?.()) ?? {};
				},
			}),
		],
	});
	const refreshLists = (): Promise<void> =>
		queryClient.invalidateQueries({ queryKey: LISTS });
	const queryClient = new QueryClient({
		defaultOptions: { queries: { staleTime: LIST_STALE_MS } },
		// Every mutation changes my rooms.
		mutationCache: new MutationCache({ onSuccess: refreshLists }),
	});

	return {
		queryClient,
		/** My unsolved rooms that I haven't abandoned, newest first. */
		openRooms: () => ({
			queryKey: [...LISTS, "open"],
			queryFn: () => client.rooms.list.query({ list: "open" }),
		}),
		/** My solved or abandoned rooms, newest first. */
		history: () => ({
			queryKey: [...LISTS, "history"],
			queryFn: () => client.rooms.list.query({ list: "history" }),
		}),
		/** Opens (joins) the room on every visit; playing it changes my lists. */
		room: (code: string) => ({
			queryKey: ["room", code],
			queryFn: async () => {
				const room = await client.rooms.open.mutate({ code });
				void refreshLists();
				return room;
			},
			staleTime: 0,
			gcTime: 0,
			retry: false,
		}),
		createRoom: () => ({
			mutationFn: (room: NewRoom) => client.rooms.create.mutate(room),
			onSuccess: (_: unknown, room: NewRoom) =>
				track("room_created", { pieces: room.rows * room.cols }),
		}),
		/** Drops the room from my open rooms; opening it again brings it back. */
		abandon: () => ({
			mutationFn: (code: string) => client.rooms.abandon.mutate({ code }),
		}),
		roomSocketUrl: (code: string) =>
			`${opts.serverUrl.replace(/^http/, "ws")}/rooms/${code}/ws`,
	};
}
