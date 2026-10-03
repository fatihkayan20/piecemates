import type { PickedImage } from "@piecemates/client";
import {
	SAMPLE_CATEGORIES,
	type SampleCategory,
	UNSPLASH_URL,
} from "@piecemates/game";
import { Button } from "@piecemates/ui/components/button";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Trans, useTranslation } from "react-i18next";

import { PhotoTiles } from "@/components/home/photo-tiles";
import { SampleTile } from "@/components/home/sample-tile";
import { CREDIT_LINK } from "@/components/sample-credit";
import { api } from "@/lib/api";

/** A featured tile is 10rem wide. */
const FEATURED_SIZES = "10rem";

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
		<div className="grid gap-3">
			<p className="text-muted-foreground text-xs">
				<Trans
					i18nKey="home.samplesFrom"
					components={{
						unsplash: (
							// biome-ignore lint/a11y/useAnchorContent: Trans fills in "Unsplash".
							<a
								href={UNSPLASH_URL}
								target="_blank"
								rel="noreferrer"
								className={CREDIT_LINK}
							/>
						),
					}}
				/>
			</p>
			{featured.length > 0 && (
				<>
					<h3 className="text-muted-foreground text-sm">
						{t("home.featured")}
					</h3>
					<div className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1">
						{featured.map((sample) => (
							<SampleTile
								key={sample.id}
								sample={sample}
								sizes={FEATURED_SIZES}
								disabled={disabled}
								className="w-40 shrink-0 snap-start"
								onPick={onPick}
							/>
						))}
					</div>
				</>
			)}
			<div className="flex flex-wrap gap-2">
				{SAMPLE_CATEGORIES.map((c) => (
					<Button
						key={c}
						size="sm"
						variant={c === category ? "default" : "outline"}
						aria-pressed={c === category}
						onClick={() => setCategory(c)}
					>
						{t(`home.categories.${c}`)}
					</Button>
				))}
			</div>
			<PhotoTiles samples={samples} disabled={disabled} onPick={onPick} />
		</div>
	);
}
