import { type PickedImage, SAMPLE_IMAGES } from "@piecemates/client";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

import { UploadTile } from "@/components/home/upload-tile";
import { Photo } from "@/components/photo";
import { api } from "@/lib/api";

/** Three tiles a row. */
const TILE = "aspect-video w-[31%] self-start overflow-hidden rounded";
type Size = { width: number; height: number };

/** Photos to start a room from: the samples, my uploaded photo not yet used, and a new upload. */
export function PhotoTiles({
	disabled,
	onPick,
}: {
	disabled: boolean;
	onPick: (image: PickedImage) => void;
}) {
	const { t } = useTranslation();
	const { data: unused } = useQuery(api.unusedUpload());
	// Any resized copy has the photo's aspect, which is all the grid needs.
	const [sizes, setSizes] = useState<Record<string, Size>>({});
	const dim = disabled ? "opacity-50" : "";
	return (
		<View className="flex-row flex-wrap justify-between gap-y-2">
			{SAMPLE_IMAGES.map((url, i) => (
				<Pressable
					key={url}
					accessibilityRole="button"
					accessibilityLabel={t("home.sampleImage", { n: i + 1 })}
					disabled={disabled}
					className={`${TILE} ${dim}`}
					onPress={() => {
						const size = sizes[url];
						if (size) onPick({ url, ...size });
					}}
				>
					<Photo
						url={url}
						className="h-full w-full"
						onLoad={({ source: { width, height } }) =>
							setSizes((s) => ({ ...s, [url]: { width, height } }))
						}
					/>
				</Pressable>
			))}
			{unused && (
				<Pressable
					accessibilityRole="button"
					accessibilityLabel={t("upload.resume")}
					disabled={disabled}
					className={`${TILE} ${dim}`}
					onPress={() => onPick({ ...unused, upload: unused.id })}
				>
					<Photo url={unused.url} className="h-full w-full" />
					<Text className="absolute inset-x-0 bottom-0 bg-background/80 p-1 text-center text-foreground text-xs">
						{t("upload.resume")}
					</Text>
				</Pressable>
			)}
			{/* An uploaded photo is resumed, not replaced. */}
			{!unused && (
				<UploadTile disabled={disabled} className={TILE} onPick={onPick} />
			)}
			{/* Keeps the last row's tiles on the left. */}
			<View className="w-[31%]" />
		</View>
	);
}
