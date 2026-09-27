import type { PickedImage, Sample } from "@piecemates/client";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

import { SampleTile } from "@/components/home/sample-tile";
import { UploadTile } from "@/components/home/upload-tile";
import { Photo } from "@/components/photo";
import { api } from "@/lib/api";

/** Three tiles a row. */
const TILE = "aspect-video w-[31%] self-start overflow-hidden rounded";

/** Photos to start a room from: my uploaded photo not yet used or a new upload, then a category's samples. */
export function PhotoTiles({
	samples,
	disabled,
	onPick,
}: {
	samples: Sample[];
	disabled: boolean;
	onPick: (image: PickedImage) => void;
}) {
	const { t } = useTranslation();
	const { data: unused } = useQuery(api.unusedUpload());
	return (
		<View className="flex-row flex-wrap justify-between gap-y-2">
			{unused && (
				<Pressable
					accessibilityRole="button"
					accessibilityLabel={t("upload.resume")}
					disabled={disabled}
					className={`${TILE} ${disabled ? "opacity-50" : ""}`}
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
			{samples.map((sample) => (
				<SampleTile
					key={sample.id}
					sample={sample}
					disabled={disabled}
					className={TILE}
					onPick={onPick}
				/>
			))}
			{/* Keep the last row's tiles on the left. */}
			<View className="w-[31%]" />
			<View className="w-[31%]" />
		</View>
	);
}
