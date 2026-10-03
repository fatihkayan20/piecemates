import type { PickedImage, Sample } from "@piecemates/client";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

import { CreditLink } from "@/components/credit-link";
import { Photo } from "@/components/photo";

/** A sample photo to start a room from, in its own colour until it loads, with its photographer under it. */
export function SampleTile({
	sample,
	disabled,
	className,
	onPick,
}: {
	sample: Sample;
	disabled: boolean;
	/** The tile's width. */
	className: string;
	onPick: (image: PickedImage) => void;
}) {
	const { t } = useTranslation();
	const { url, width, height, color, author, authorUrl } = sample;
	return (
		<View className={`gap-1 ${className}`}>
			<Pressable
				accessibilityRole="button"
				accessibilityLabel={t("home.sampleBy", { author })}
				disabled={disabled}
				// The photo's own colour comes from the catalogue, not the theme.
				style={{ backgroundColor: color }}
				className={`aspect-video overflow-hidden rounded ${disabled ? "opacity-50" : ""}`}
				onPress={() => onPick({ url, width, height, sample })}
			>
				<Photo url={url} className="h-full w-full" />
			</Pressable>
			<Text numberOfLines={1} className="text-muted text-xs">
				<CreditLink url={authorUrl}>{author}</CreditLink>
			</Text>
		</View>
	);
}
