import { type RoomSnapshot, roomStore } from "@puzzle/client";
import { useStore } from "zustand";

/** Reads the open room. Select a field, not a new object, or it re-renders forever. */
export const useRoom = <T>(select: (room: RoomSnapshot) => T) =>
	useStore(roomStore, select);
