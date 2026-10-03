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
import {
	createErrorText,
	defaultGrid,
	type PickedImage,
} from "@piecemates/client";
import { gridOptions, UNSPLASH_URL } from "@piecemates/game";
import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Dimensions } from "react-native";

import { AppHost } from "@/components/app-host";
import { useSheetStyle } from "@/hooks/use-sheet-style";
import { api } from "@/lib/api";

const SHEET = {
	spacing: 16,
	padding: 24,
	titleSize: 20,
	creditSize: 13,
	buttonGap: 8,
};

/** The credit's <author> and <unsplash> tags as Markdown links, which SwiftUI's Text opens. */
const credit = (text: string, authorUrl: string) =>
	text
		.replace(
			/<author>(.*?)<\/author>/,
			(_, name: string) => `[${name.replace(/[[\]]/g, "")}](${authorUrl})`,
		)
		.replace(/<unsplash>(.*?)<\/unsplash>/, `[$1](${UNSPLASH_URL})`);
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
	const [count, setCount] = useState(
		defaultGrid(options, Dimensions.get("window"))?.count,
	);
	const [rotate, setRotate] = useState(false);
	const { mutateAsync, isPending } = useMutation(api.createRoom());
	const [open, setOpen] = useState(true);
	const grid = options.find((o) => o.count === count);
	const rows = Array.from(
		{ length: Math.ceil(options.length / COUNTS_PER_ROW) },
		(_, r) => options.slice(r * COUNTS_PER_ROW, (r + 1) * COUNTS_PER_ROW),
	);

	const create = async () => {
		if (!grid) return;
		try {
			const { rows, cols } = grid;
			// The pile is laid out to suit this screen's shape.
			const { width, height } = Dimensions.get("window");
			const aspect = width / height;
			const room = await mutateAsync({ image, rows, cols, rotate, aspect });
			setOpen(false);
			router.push({ pathname: "/room/[code]", params: { code: room.code } });
		} catch (e) {
			Alert.alert(createErrorText(e));
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
					{image.sample && (
						<Text
							markdownEnabled
							modifiers={[
								font({ size: SHEET.creditSize }),
								foregroundStyle("secondary"),
							]}
						>
							{credit(
								t("home.sampleCredit", { author: image.sample.author }),
								image.sample.authorUrl,
							)}
						</Text>
					)}
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
						label={
							isPending && image.file ? t("upload.uploading") : t("home.create")
						}
						modifiers={style.prominent}
						onPress={isPending ? undefined : create}
					/>
				</VStack>
			</BottomSheet>
		</AppHost>
	);
}
