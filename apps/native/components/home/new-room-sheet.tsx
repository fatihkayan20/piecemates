import {
	BottomSheet,
	Button,
	Host,
	Picker,
	Text,
	Toggle,
	VStack,
} from "@expo/ui/swift-ui";
import {
	buttonStyle,
	font,
	foregroundStyle,
	padding,
	pickerStyle,
	presentationDragIndicator,
	tag,
} from "@expo/ui/swift-ui/modifiers";
import { defaultGrid } from "@piecemates/client";
import { gridOptions } from "@piecemates/game";
import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";

import { api } from "@/lib/api";

export type PickedImage = { url: string; width: number; height: number };

const SHEET = { spacing: 16, padding: 24, titleSize: 20 };

/** Room options for a picked image: piece count and turned pieces. */
export function NewRoomSheet({
	image,
	onClose,
}: {
	image: PickedImage;
	onClose: () => void;
}) {
	const { t } = useTranslation();
	const options = gridOptions(image.width, image.height);
	const [count, setCount] = useState(defaultGrid(options)?.count);
	const [rotate, setRotate] = useState(false);
	const [busy, setBusy] = useState(false);
	const [open, setOpen] = useState(true);
	const grid = options.find((o) => o.count === count);

	const create = async () => {
		if (!grid) return;
		setBusy(true);
		try {
			const room = await api.createRoom({
				imageUrl: image.url,
				imageW: image.width,
				imageH: image.height,
				rows: grid.rows,
				cols: grid.cols,
				rotate,
			});
			setOpen(false);
			router.push({ pathname: "/room/[code]", params: { code: room.code } });
		} catch {
			Alert.alert(t("home.createFailed"));
		} finally {
			setBusy(false);
		}
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
					spacing={SHEET.spacing}
					modifiers={[
						padding({ all: SHEET.padding }),
						presentationDragIndicator("visible"),
					]}
				>
					<Text
						modifiers={[font({ size: SHEET.titleSize, weight: "semibold" })]}
					>
						{t("home.newRoom")}
					</Text>
					<Picker
						label={t("home.pieceCount")}
						selection={count}
						onSelectionChange={(c: number) => setCount(c)}
						modifiers={[pickerStyle("menu")]}
					>
						{options.map((o) => (
							<Text key={o.count} modifiers={[tag(o.count)]}>
								{t("home.pieces", { count: o.count })}
							</Text>
						))}
					</Picker>
					<Toggle
						label={t("home.rotate")}
						isOn={rotate}
						onIsOnChange={setRotate}
					/>
					<Text modifiers={[foregroundStyle("secondary")]}>
						{t("home.rotateHint")}
					</Text>
					<Button
						label={t("home.create")}
						modifiers={[buttonStyle("borderedProminent")]}
						onPress={busy ? undefined : create}
					/>
				</VStack>
			</BottomSheet>
		</Host>
	);
}
