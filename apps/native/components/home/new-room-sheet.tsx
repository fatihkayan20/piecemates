import {
	BottomSheet,
	Button,
	HStack,
	Text,
	Toggle,
	VStack,
} from "@expo/ui/swift-ui";
import {
	font,
	foregroundStyle,
	frame,
	padding,
} from "@expo/ui/swift-ui/modifiers";
import { createErrorText, defaultGrid } from "@piecemates/client";
import { gridOptions } from "@piecemates/game";
import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";

import { AppHost } from "@/components/app-host";
import { useSheetStyle } from "@/hooks/use-sheet-style";
import { api } from "@/lib/api";

export type PickedImage = { url: string; width: number; height: number };

const SHEET = { spacing: 16, padding: 24, titleSize: 20, buttonGap: 8 };
/** Piece count buttons per row, so every option shows at once. */
const COUNTS_PER_ROW = 4;

/** Room options for a picked image: piece count and turned pieces. */
export function NewRoomSheet({
	image,
	onClose,
}: {
	image: PickedImage;
	onClose: () => void;
}) {
	const { t } = useTranslation();
	const style = useSheetStyle();
	const options = gridOptions(image.width, image.height);
	const [count, setCount] = useState(defaultGrid(options)?.count);
	const [rotate, setRotate] = useState(false);
	const [busy, setBusy] = useState(false);
	const [open, setOpen] = useState(true);
	const grid = options.find((o) => o.count === count);
	const rows = Array.from(
		{ length: Math.ceil(options.length / COUNTS_PER_ROW) },
		(_, r) => options.slice(r * COUNTS_PER_ROW, (r + 1) * COUNTS_PER_ROW),
	);

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
		} catch (e) {
			Alert.alert(createErrorText(e));
		} finally {
			setBusy(false);
		}
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
						{t("home.newRoom")}
					</Text>
					<Text modifiers={[foregroundStyle("secondary")]}>
						{t("home.pieceCount")}
					</Text>
					{rows.map((row) => (
						<HStack key={row[0]?.count} spacing={SHEET.buttonGap}>
							{row.map((o) => (
								<Button
									key={o.count}
									label={String(o.count)}
									onPress={() => setCount(o.count)}
									modifiers={[
										...(o.count === count ? style.prominent : style.button),
										frame({ maxWidth: Number.POSITIVE_INFINITY }),
									]}
								/>
							))}
						</HStack>
					))}
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
						modifiers={style.prominent}
						onPress={busy ? undefined : create}
					/>
				</VStack>
			</BottomSheet>
		</AppHost>
	);
}
