import type { PickedImage } from "@piecemates/client";
import { SAMPLE_CATEGORIES, type SampleCategory } from "@piecemates/game";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, View } from "react-native";

import { PhotoTiles } from "@/components/home/photo-tiles";
import { SampleTile } from "@/components/home/sample-tile";
import { api } from "@/lib/api";

/** Where a new puzzle starts: featured photos, then a category's photos next to my own upload. */
export function SamplePicker({
	disabled,
	onPick,
}: {
	disabled: boolean;
	onPick: (image: PickedImage) => void;
}) {
	const { t } = useTranslation();
	const [category, setCategory] = useState<SampleCategory>("nature");
	const { data: featured = [] } = useQuery(api.featuredSamples());
	const { data: samples = [] } = useQuery(api.samples(category));
	return (
		<View className="gap-3">
			{featured.length > 0 && (
				<>
					<Text className="text-muted">{t("home.featured")}</Text>
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						className="-mx-6"
						contentContainerClassName="gap-2 px-6"
					>
						{featured.map((sample) => (
							<SampleTile
								key={sample.id}
								sample={sample}
								disabled={disabled}
								className="aspect-video w-40 overflow-hidden rounded"
								onPick={onPick}
							/>
						))}
					</ScrollView>
				</>
			)}
			<View className="flex-row flex-wrap gap-2">
				{SAMPLE_CATEGORIES.map((c) => (
					<Pressable
						key={c}
						accessibilityRole="button"
						accessibilityState={{ selected: c === category }}
						onPress={() => setCategory(c)}
						className={`rounded-full border border-border px-3 py-1.5 active:opacity-70 ${c === category ? "bg-foreground" : ""}`}
					>
						<Text
							className={c === category ? "text-background" : "text-foreground"}
						>
							{t(`home.categories.${c}`)}
						</Text>
					</Pressable>
				))}
			</View>
			<PhotoTiles samples={samples} disabled={disabled} onPick={onPick} />
		</View>
	);
}
