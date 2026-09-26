import {
	BottomSheet,
	Button,
	Circle,
	Host,
	HStack,
	Spacer,
	Text as SwiftText,
	TextField,
	useNativeState,
	VStack,
} from "@expo/ui/swift-ui";
import {
	buttonStyle,
	font,
	foregroundStyle,
	frame,
	onTapGesture,
	opacity,
	padding,
	presentationDragIndicator,
} from "@expo/ui/swift-ui/modifiers";
import { BAG_COLORS, type RoomConnection } from "@puzzle/client";
import type { Bag } from "@puzzle/game";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

/** Drop target id for "back to the table"; every other id is a bag. */
export const DROP_TABLE = "table";

export type DropRect = { x: number; y: number; width: number; height: number };

/** Drop targets by id, so the board can measure them when a drag starts. */
export type DropTargets = Map<string, View>;

/** Window rects of every drop target (measured once per drag). */
export function measureTargets(targets: DropTargets) {
	const rects = new Map<string, DropRect>();
	for (const [id, view] of targets)
		view.measureInWindow((x, y, width, height) =>
			rects.set(id, { x, y, width, height }),
		);
	return rects;
}

/** The drop target under a window point, if any. */
export function targetAt(rects: Map<string, DropRect>, x: number, y: number) {
	for (const [id, r] of rects)
		if (x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height)
			return id;
	return null;
}

const chip = "flex-row items-center gap-2 rounded bg-black/60 px-3 py-1.5";
const dashed = "border border-dashed border-white/40";

/**
 * Bags along the top. On the table: one chip per bag (drop a piece on it to bag
 * it, tap to open it). Inside a bag: back, the bag (tap to edit) and a take-out zone.
 */
export function BagBar({
	conn,
	targets,
	hovered,
}: {
	conn: RoomConnection;
	targets: DropTargets;
	hovered: string | null;
}) {
	// The room state is mutated in place, so compiler memoization would show stale bags.
	"use no memo";
	/** undefined = sheet closed, null = new bag, string = editing that bag. */
	const [editing, setEditing] = useState<string | null>();
	const state = conn.state;
	if (!state) return null;
	const count = (bag: string) =>
		state.pieces.filter((p) => p.bag === bag).length;
	const current = conn.view === null ? undefined : state.bags[conn.view];
	const target = (id: string) => (view: View | null) => {
		if (view) targets.set(id, view);
		else targets.delete(id);
	};
	const ring = (id: string) => (hovered === id ? "border-2 border-white" : "");

	return (
		<View>
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				contentContainerClassName="gap-2 p-3"
			>
				{conn.view !== null && current ? (
					<>
						<Pressable
							accessibilityRole="button"
							className={`${chip} bg-white/15`}
							onPress={() => conn.setView(null)}
						>
							<Text className="text-white">← Table</Text>
						</Pressable>
						<Pressable
							accessibilityRole="button"
							className={chip}
							onPress={() => setEditing(conn.view)}
						>
							<BagLabel bag={current} count={count(conn.view)} />
						</Pressable>
						<View
							ref={target(DROP_TABLE)}
							className={`${chip} ${dashed} ${ring(DROP_TABLE)}`}
						>
							<Text className="text-white">Drop here to take out</Text>
						</View>
					</>
				) : (
					<>
						{Object.entries(state.bags).map(([id, bag]) => (
							<Pressable
								key={id}
								ref={target(id)}
								accessibilityRole="button"
								className={`${chip} ${ring(id)}`}
								onPress={() => conn.setView(id)}
							>
								<BagLabel bag={bag} count={count(id)} />
							</Pressable>
						))}
						<Pressable
							accessibilityRole="button"
							className={`${chip} ${dashed}`}
							onPress={() => setEditing(null)}
						>
							<Text className="text-white">+ Bag</Text>
						</Pressable>
					</>
				)}
			</ScrollView>
			{editing !== undefined && (
				<BagSheet
					key={String(editing)}
					conn={conn}
					editing={editing}
					onClose={() => setEditing(undefined)}
				/>
			)}
		</View>
	);
}

function BagLabel({ bag, count }: { bag: Bag; count: number }) {
	return (
		<>
			<View
				className="size-3 rounded-full"
				style={{ backgroundColor: bag.color }}
			/>
			<Text className="text-white">{bag.name}</Text>
			<Text className="text-white/60">{count}</Text>
		</>
	);
}

function BagSheet({
	conn,
	editing,
	onClose,
}: {
	conn: RoomConnection;
	editing: string | null;
	onClose: () => void;
}) {
	const bags = conn.state?.bags ?? {};
	const existing = editing ? bags[editing] : undefined;
	const initialName = existing?.name ?? `Bag ${Object.keys(bags).length + 1}`;
	const nameField = useNativeState(initialName);
	const [name, setName] = useState(initialName);
	const [color, setColor] = useState(
		existing?.color ?? (BAG_COLORS[0] as string),
	);
	const [open, setOpen] = useState(true);
	const close = () => setOpen(false);

	const save = () => {
		const bag = editing ?? Math.random().toString(36).slice(2, 10);
		const type = editing ? "bag:update" : "bag:create";
		conn.send({ type, bag, name: name.trim() || "Bag", color });
		close();
	};

	return (
		<Host matchContents>
			<BottomSheet
				isPresented={open}
				onIsPresentedChange={setOpen}
				onDismiss={onClose}
				fitToContents
			>
				<VStack
					alignment="leading"
					spacing={20}
					modifiers={[
						padding({ all: 24 }),
						presentationDragIndicator("visible"),
					]}
				>
					<SwiftText modifiers={[font({ size: 20, weight: "semibold" })]}>
						{editing ? "Edit bag" : "New bag"}
					</SwiftText>
					<TextField
						text={nameField}
						placeholder="Name"
						maxLength={40}
						onTextChange={setName}
					/>
					<HStack spacing={14}>
						{BAG_COLORS.map((c) => (
							<Circle
								key={c}
								modifiers={[
									foregroundStyle(c),
									frame({ width: 36, height: 36 }),
									opacity(c === color ? 1 : 0.35),
									onTapGesture(() => setColor(c)),
								]}
							/>
						))}
					</HStack>
					<HStack>
						{editing ? (
							<Button
								role="destructive"
								label="Delete bag"
								onPress={() => {
									conn.send({ type: "bag:delete", bag: editing });
									close();
								}}
							/>
						) : (
							<Spacer />
						)}
						{editing && <Spacer />}
						<Button
							label={editing ? "Save" : "Create"}
							modifiers={[buttonStyle("borderedProminent")]}
							onPress={save}
						/>
					</HStack>
				</VStack>
			</BottomSheet>
		</Host>
	);
}
