import {
	apply,
	type ClientMsg,
	inPile,
	isComplete,
	type Player,
	type Point,
	type ServerMsg,
	type State,
	tidyPositions,
	visibleIn,
} from "@puzzle/game";

import { type Cue, cue, progress } from "./feedback.ts";

export type RoomStatus = "connecting" | "playing" | "done" | "disconnected";
export type RoomEvent =
	| ServerMsg
	| { type: "closed" }
	| { type: "tidied" }
	| { type: "view" };

/**
 * Keeps a local copy of the room state in sync over one WebSocket. The board
 * only renders it and reacts to events (e.g. end a drag when its drop is echoed).
 */
export class RoomConnection {
	state: State | null = null;
	me = "";
	players: Player[] = [];
	status: RoomStatus = "connecting";
	/** The bag I'm looking at, or null for the table. Only this device sees it. */
	view: string | null = null;
	/** Where my own tidy put pile pieces. Only this device sees these. */
	private pilePositions = new Map<number, Point>();
	private visibleCache: Set<number> | null = null;
	private socket: WebSocket;
	private onEvent: (event: RoomEvent) => void;

	constructor(socket: WebSocket, onEvent: (event: RoomEvent) => void) {
		this.socket = socket;
		this.onEvent = onEvent;
		socket.onmessage = (ev) =>
			this.receive(JSON.parse(String(ev.data)) as ServerMsg);
		socket.onclose = () => {
			this.status = "disconnected";
			this.onEvent({ type: "closed" });
		};
	}

	send(msg: ClientMsg) {
		if (this.socket.readyState === WebSocket.OPEN)
			this.socket.send(JSON.stringify(msg));
	}

	/** Where to draw a piece: my tidied spot while it's still in the pile, else the shared one. */
	position(index: number): Point {
		const piece = this.state?.pieces[index];
		const local = this.pilePositions.get(index);
		if (!piece) return { x: 0, y: 0 };
		return local && this.state && inPile(this.state, index, piece.bag)
			? local
			: piece;
	}

	/** Whether a piece shows in my current view. */
	visible(index: number) {
		if (!this.state) return false;
		this.visibleCache ??= visibleIn(this.state, this.view);
		return this.visibleCache.has(index);
	}

	/** Switches to a bag, or back to the table (null). */
	setView(view: string | null) {
		this.view = view;
		this.visibleCache = null;
		this.onEvent({ type: "view" });
	}

	/** Packs my current view's pile around the board, for this device only. */
	tidy() {
		if (!this.state) return;
		const tidied = tidyPositions(this.state, this.view, (i) =>
			this.position(i),
		);
		for (const [i, p] of tidied) this.pilePositions.set(i, p);
		this.onEvent({ type: "tidied" });
	}

	/** Closes without firing any more events. */
	close() {
		this.socket.onmessage = null;
		this.socket.onclose = null;
		this.socket.close();
	}

	private receive(msg: ServerMsg) {
		const wasDone = this.status === "done";
		let heard: Cue | undefined;
		switch (msg.type) {
			case "state":
				this.state = msg.state;
				this.me = msg.you;
				break;
			case "applied": {
				if (!this.state) break;
				const bags = this.state.pieces.map((p) => p.bag);
				const mine =
					msg.by === this.me && msg.msg.type === "drop" ? msg.msg.piece : null;
				const before = mine === null ? 0 : progress(this.state, mine);
				apply(this.state, msg.by, msg.msg);
				// Only a drop that joins pieces or places them makes a sound.
				if (mine !== null && progress(this.state, mine) > before)
					heard = "snap";
				// A piece that changed view lands in a new pile slot; forget my old tidy spot.
				this.state.pieces.forEach((p, i) => {
					if (p.bag !== bags[i]) this.pilePositions.delete(i);
				});
				break;
			}
			case "presence":
				this.players = msg.players;
				break;
			case "clock":
				if (this.state) this.state.clock = msg.clock;
				break;
		}
		this.visibleCache = null;
		if (this.state) {
			this.status = isComplete(this.state) ? "done" : "playing";
			// Someone deleted the bag I was in.
			if (this.view !== null && !(this.view in this.state.bags))
				this.view = null;
		}
		if (msg.type === "applied" && !wasDone && this.status === "done")
			heard = "win";
		if (heard) cue(heard);
		this.onEvent(msg);
	}
}
