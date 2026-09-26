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
} from "@puzzle/game";

export type RoomStatus = "connecting" | "playing" | "done" | "disconnected";
export type RoomEvent = ServerMsg | { type: "closed" } | { type: "tidied" };

/**
 * Keeps a local copy of the room state in sync over one WebSocket. The board
 * only renders it and reacts to events (e.g. end a drag when its drop is echoed).
 */
export class RoomConnection {
	state: State | null = null;
	me = "";
	players: Player[] = [];
	status: RoomStatus = "connecting";
	/** Where my own tidy put pile pieces. Only this device sees these. */
	private pilePositions = new Map<number, Point>();
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
		return local && this.state && inPile(this.state, index) ? local : piece;
	}

	/** Packs the pile pieces around the board, for this device only. */
	tidy() {
		if (!this.state) return;
		this.pilePositions = tidyPositions(this.state, (i) => this.position(i));
		this.onEvent({ type: "tidied" });
	}

	/** Closes without firing any more events. */
	close() {
		this.socket.onmessage = null;
		this.socket.onclose = null;
		this.socket.close();
	}

	private receive(msg: ServerMsg) {
		switch (msg.type) {
			case "state":
				this.state = msg.state;
				this.me = msg.you;
				break;
			case "applied":
				if (this.state) apply(this.state, msg.by, msg.msg);
				break;
			case "presence":
				this.players = msg.players;
				break;
		}
		if (this.state) this.status = isComplete(this.state) ? "done" : "playing";
		this.onEvent(msg);
	}
}
