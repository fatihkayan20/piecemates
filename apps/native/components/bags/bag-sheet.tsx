import {
	BottomSheet,
	Button,
	HStack,
	Spacer,
	Text,
	TextField,
	useNativeState,
	VStack,
} from "@expo/ui/swift-ui";
import { font, padding } from "@expo/ui/swift-ui/modifiers";
import { newBag, newBagId } from "@piecemates/client";
import { BAG_NAME_MAX } from "@piecemates/game";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { AppHost } from "@/components/app-host";
import { useRoom } from "@/hooks/use-room";
import { useSheetStyle } from "@/hooks/use-sheet-style";

import { ColorSwatches } from "./color-swatches";

const SHEET = { spacing: 20, padding: 24, titleSize: 20 };

/** Creates a bag (`editing` null) or renames, recolours or deletes one. */
export function BagSheet({
	editing,
	onClose,
}: {
	editing: string | null;
	onClose: () => void;
}) {
	const { t } = useTranslation();
	const style = useSheetStyle();
	const conn = useRoom((r) => r.conn);
	const bags = useRoom((r) => r.bags);
	const initial = bags.find((b) => b.id === editing) ?? newBag(bags.length);
	const nameField = useNativeState(initial.name);
	const [name, setName] = useState(initial.name);
	const [color, setColor] = useState(initial.color);
	const [open, setOpen] = useState(true);

	const save = () => {
		const bag = editing ?? newBagId();
		const type = editing ? "bag:update" : "bag:create";
		conn?.send({ type, bag, name: name.trim() || t("bags.unnamed"), color });
		setOpen(false);
	};
	const remove = () => {
		if (editing) conn?.send({ type: "bag:delete", bag: editing });
		setOpen(false);
	};

	return (
		<AppHost matchContents>
			<BottomSheet
				isPresented={open}
				onIsPresentedChange={setOpen}
				onDismiss={onClose}
				fitToContents
			>
				<VStack
					alignment="leading"
					spacing={SHEET.spacing}
					modifiers={[padding({ all: SHEET.padding }), ...style.sheet]}
				>
					<Text
						modifiers={[font({ size: SHEET.titleSize, weight: "semibold" })]}
					>
						{editing ? t("bags.editBag") : t("bags.newBag")}
					</Text>
					<TextField
						text={nameField}
						placeholder={t("bags.name")}
						maxLength={BAG_NAME_MAX}
						onTextChange={setName}
					/>
					<ColorSwatches value={color} onChange={setColor} />
					<HStack>
						{editing && (
							// biome-ignore lint/a11y/useValidAriaRole: SwiftUI's button role, not ARIA.
							<Button
								role="destructive"
								label={t("bags.delete")}
								onPress={remove}
							/>
						)}
						<Spacer />
						<Button
							label={editing ? t("bags.save") : t("bags.create")}
							modifiers={style.prominent}
							onPress={save}
						/>
					</HStack>
				</VStack>
			</BottomSheet>
		</AppHost>
	);
}
