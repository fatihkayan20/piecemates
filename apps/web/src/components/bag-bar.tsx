import { BAG_COLORS, type RoomConnection } from "@puzzle/client";
import type { Bag } from "@puzzle/game";
import { Button } from "@puzzle/ui/components/button";
import { Input } from "@puzzle/ui/components/input";
import {
	Sheet,
	SheetContent,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@puzzle/ui/components/sheet";
import { useState } from "react";

/** A drop target's `data-drop` value: a bag id, or this for "back to the table". */
export const DROP_TABLE = "table";

const chip =
	"flex shrink-0 items-center gap-2 rounded bg-black/60 px-2 py-1 data-[hover]:ring-2 data-[hover]:ring-white";

/**
 * Bags along the top. On the table: one chip per bag (drop a piece on it to bag
 * it, tap to open it). Inside a bag: back, the bag (tap to edit) and a take-out zone.
 */
export function BagBar({ conn }: { conn: RoomConnection }) {
	/** undefined = sheet closed, null = new bag, string = editing that bag. */
	const [editing, setEditing] = useState<string | null>();
	const state = conn.state;
	if (!state) return null;
	const bags = Object.entries(state.bags);
	const count = (bag: string) =>
		state.pieces.filter((p) => p.bag === bag).length;
	const current = conn.view === null ? undefined : state.bags[conn.view];

	return (
		<div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto">
			{conn.view !== null && current ? (
				<>
					<Button
						size="sm"
						variant="outline"
						onClick={() => conn.setView(null)}
					>
						← Table
					</Button>
					<button
						type="button"
						className={chip}
						onClick={() => setEditing(conn.view)}
					>
						<BagLabel bag={current} count={count(conn.view)} />
					</button>
					<div
						data-drop={DROP_TABLE}
						className={`${chip} border border-white/40 border-dashed`}
					>
						Drop here to take out
					</div>
				</>
			) : (
				<>
					{bags.map(([id, bag]) => (
						<button
							key={id}
							type="button"
							data-drop={id}
							className={chip}
							onClick={() => conn.setView(id)}
						>
							<BagLabel bag={bag} count={count(id)} />
						</button>
					))}
					<button
						type="button"
						className={`${chip} border border-white/40 border-dashed`}
						onClick={() => setEditing(null)}
					>
						+ Bag
					</button>
				</>
			)}
			<BagSheet
				key={String(editing)}
				conn={conn}
				editing={editing}
				onClose={() => setEditing(undefined)}
			/>
		</div>
	);
}

function BagLabel({ bag, count }: { bag: Bag; count: number }) {
	return (
		<>
			<span className="size-3 rounded-full" style={{ background: bag.color }} />
			{bag.name}
			<span className="opacity-60">{count}</span>
		</>
	);
}

function BagSheet({
	conn,
	editing,
	onClose,
}: {
	conn: RoomConnection;
	editing: string | null | undefined;
	onClose: () => void;
}) {
	const bags = conn.state?.bags ?? {};
	const existing = editing ? bags[editing] : undefined;
	const [name, setName] = useState(
		existing?.name ?? `Bag ${Object.keys(bags).length + 1}`,
	);
	const [color, setColor] = useState(
		existing?.color ?? (BAG_COLORS[0] as string),
	);

	const save = () => {
		const bag = editing ?? crypto.randomUUID().slice(0, 8);
		const type = editing ? "bag:update" : "bag:create";
		conn.send({ type, bag, name: name.trim() || "Bag", color });
		onClose();
	};

	return (
		<Sheet
			open={editing !== undefined}
			onOpenChange={(open) => !open && onClose()}
		>
			<SheetContent side="bottom">
				<form
					className="mx-auto flex w-full max-w-md flex-col gap-4 p-4"
					onSubmit={(e) => {
						e.preventDefault();
						save();
					}}
				>
					<SheetHeader className="p-0">
						<SheetTitle>{editing ? "Edit bag" : "New bag"}</SheetTitle>
					</SheetHeader>
					<Input
						autoFocus
						aria-label="Name"
						maxLength={40}
						value={name}
						onChange={(e) => setName(e.target.value)}
					/>
					<div className="flex gap-2">
						{BAG_COLORS.map((c) => (
							<button
								key={c}
								type="button"
								aria-label={`Colour ${c}`}
								aria-pressed={c === color}
								className="size-8 rounded-full aria-pressed:ring-2 aria-pressed:ring-foreground aria-pressed:ring-offset-2 aria-pressed:ring-offset-popover"
								style={{ background: c }}
								onClick={() => setColor(c)}
							/>
						))}
					</div>
					<SheetFooter className="flex-row justify-end p-0">
						{editing && (
							<Button
								type="button"
								variant="destructive"
								className="mr-auto"
								onClick={() => {
									conn.send({ type: "bag:delete", bag: editing });
									onClose();
								}}
							>
								Delete bag
							</Button>
						)}
						<Button type="submit">{editing ? "Save" : "Create"}</Button>
					</SheetFooter>
				</form>
			</SheetContent>
		</Sheet>
	);
}
