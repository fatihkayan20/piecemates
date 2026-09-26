import { newBag, newBagId } from "@piecemates/client";
import { BAG_NAME_MAX } from "@piecemates/game";
import { Button } from "@piecemates/ui/components/button";
import { Input } from "@piecemates/ui/components/input";
import {
	Sheet,
	SheetContent,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@piecemates/ui/components/sheet";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useRoom } from "@/hooks/use-room";

import { ColorSwatches } from "./color-swatches";

/** Creates a bag (`editing` null) or renames, recolours or deletes one; closed when undefined. */
export function BagSheet({
	editing,
	onClose,
}: {
	editing: string | null | undefined;
	onClose: () => void;
}) {
	const { t } = useTranslation();
	const conn = useRoom((r) => r.conn);
	const bags = useRoom((r) => r.bags);
	const initial = bags.find((b) => b.id === editing) ?? newBag(bags.length);
	const [name, setName] = useState(initial.name);
	const [color, setColor] = useState(initial.color);

	const save = () => {
		const bag = editing ?? newBagId();
		const type = editing ? "bag:update" : "bag:create";
		conn?.send({ type, bag, name: name.trim() || t("bags.unnamed"), color });
		onClose();
	};
	const remove = () => {
		if (editing) conn?.send({ type: "bag:delete", bag: editing });
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
						<SheetTitle>
							{editing ? t("bags.editBag") : t("bags.newBag")}
						</SheetTitle>
					</SheetHeader>
					<Input
						autoFocus
						aria-label={t("bags.name")}
						maxLength={BAG_NAME_MAX}
						value={name}
						onChange={(e) => setName(e.target.value)}
					/>
					<ColorSwatches value={color} onChange={setColor} />
					<SheetFooter className="flex-row justify-end p-0">
						{editing && (
							<Button
								type="button"
								variant="destructive"
								className="mr-auto"
								onClick={remove}
							>
								{t("bags.delete")}
							</Button>
						)}
						<Button type="submit">
							{editing ? t("bags.save") : t("bags.create")}
						</Button>
					</SheetFooter>
				</form>
			</SheetContent>
		</Sheet>
	);
}
