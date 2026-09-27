import type { Sample } from "@piecemates/client";
import { UNSPLASH_URL } from "@piecemates/game";
import { Trans } from "react-i18next";

const LINK = "underline underline-offset-2 hover:text-foreground";

/** "Photo by … on Unsplash", which Unsplash asks for wherever its photo shows. */
export function SampleCredit({ sample }: { sample: Sample }) {
	return (
		<p className="text-muted-foreground text-xs">
			<Trans
				i18nKey="home.sampleCredit"
				values={{ author: sample.author }}
				components={{
					author: (
						// biome-ignore lint/a11y/useAnchorContent: Trans fills in the name.
						<a
							href={sample.authorUrl}
							target="_blank"
							rel="noreferrer"
							className={LINK}
						/>
					),
					unsplash: (
						// biome-ignore lint/a11y/useAnchorContent: Trans fills in "Unsplash".
						<a
							href={UNSPLASH_URL}
							target="_blank"
							rel="noreferrer"
							className={LINK}
						/>
					),
				}}
			/>
		</p>
	);
}
