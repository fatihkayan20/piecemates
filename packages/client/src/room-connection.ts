import {
	apply,
	type ClientMsg,
	isComplete,
	type Player,
	type ServerMsg,
	type State,
} from "@puzzle/game";

export type RoomStatus = "connecting" | "playing" | "done" | "disconnected";
export type RoomEvent = ServerMsg | { type: "closed" };

/**
 * Keeps a local copy of the room state in sync over one WebSocket. The board
 * only renders it and reacts to events (e.g. end a drag when its drop is echoed).
 */
export class RoomConnection {
	state: State | null = null;
	me = "";
	players: Player[] = [];
	status: RoomStatus = "connecting";
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
