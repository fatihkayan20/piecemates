import type { PickedImage, Sample } from "@piecemates/client";
import { useTranslation } from "react-i18next";
import { Pressable } from "react-native";

import { Photo } from "@/components/photo";

/** A sample photo to start a room from, in its own colour until it loads. */
export function SampleTile({
	sample,
	disabled,
	className,
	onPick,
}: {
	sample: Sample;
	disabled: boolean;
	className: string;
	onPick: (image: PickedImage) => void;
}) {
	const { t } = useTranslation();
	const { url, width, height, color, author } = sample;
	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={t("home.sampleBy", { author })}
			disabled={disabled}
			// The photo's own colour comes from the catalogue, not the theme.
			style={{ backgroundColor: color }}
			className={`${className} ${disabled ? "opacity-50" : ""}`}
			onPress={() => onPick({ url, width, height, sample })}
		>
			<Photo url={url} className="h-full w-full" />
		</Pressable>
	);
}
