import type { Msg } from "./messages.ts";
import { rotateGroup } from "./rotate.ts";
import { snap } from "./snap.ts";
import { groupOf, isPlaced, lockedByOther, piecesInGroup } from "./state.ts";
import { clampToTable } from "./table.ts";
import type { State } from "./types.ts";
import { moveToView } from "./views.ts";

/** Applies a message in place. Returns false (and changes nothing) if it's not allowed. */
export function apply(state: State, by: string, msg: Msg): boolean {
	switch (msg.type) {
		case "leave":
			release(state, by);
			return true;
		case "bag:create":
		case "bag:update":
			if (msg.bag in state.bags !== (msg.type === "bag:update")) return false;
			state.bags[msg.bag] = { name: msg.name, color: msg.color };
			return true;
		case "bag:delete": {
			if (!(msg.bag in state.bags)) return false;
			const groups = new Set(
				state.pieces.flatMap((p) => (p.bag === msg.bag ? [p.group] : [])),
			);
			for (const group of groups) moveToView(state, group, null);
			delete state.bags[msg.bag];
			return true;
		}
		case "bag:put": {
			const piece = state.pieces[msg.piece];
			if (
				!piece ||
				piece.bag === msg.bag ||
				(msg.bag !== null && !(msg.bag in state.bags)) ||
				lockedByOther(state, msg.piece, by) ||
				isPlaced(state, msg.piece)
			)
				return false;
			moveToView(state, piece.group, msg.bag);
			return true;
		}
		case "lock": {
			const piece = state.pieces[msg.piece];
			if (
				!piece ||
				lockedByOther(state, msg.piece, by) ||
				isPlaced(state, msg.piece)
			)
				return false;
			release(state, by); // one piece per hand
			state.locks[piece.group] = by;
			return true;
		}
		case "rotate": {
			const piece = state.pieces[msg.piece];
			if (
				!state.rotate ||
				!piece ||
				lockedByOther(state, msg.piece, by) ||
				isPlaced(state, msg.piece)
			)
				return false;
			delete state.locks[piece.group];
			rotateGroup(state, msg.piece);
			const members = groupOf(state, msg.piece);
			const { x: dx, y: dy } = clampToTable(state, members, 0, 0);
			for (const i of members) {
				const m = state.pieces[i];
				if (m) Object.assign(m, { x: m.x + dx, y: m.y + dy });
			}
			// A pile piece is drawn at my own tidy spot, so only a moved one snaps.
			if (piece.touched) snap(state, piece.group);
			return true;
		}
		case "unlock": {
			const piece = state.pieces[msg.piece];
			if (!piece || state.locks[piece.group] !== by) return false;
			delete state.locks[piece.group];
			return true;
		}
		case "drop": {
			const piece = state.pieces[msg.piece];
			if (!piece || state.locks[piece.group] !== by) return false;
			const members = groupOf(state, msg.piece);
			const { x: dx, y: dy } = clampToTable(
				state,
				members,
				msg.x - piece.x,
				msg.y - piece.y,
			);
			for (const member of piecesInGroup(state, piece.group)) {
				member.x += dx;
				member.y += dy;
				member.touched = true;
			}
			delete state.locks[piece.group];
			snap(state, piece.group);
			return true;
		}
	}
}

export function release(state: State, by: string) {
	for (const [group, holder] of Object.entries(state.locks)) {
		if (holder === by) delete state.locks[Number(group)];
	}
}
