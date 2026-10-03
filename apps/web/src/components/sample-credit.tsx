import type { Credit } from "@piecemates/client";
import { UNSPLASH_URL } from "@piecemates/game";
import { cn } from "@piecemates/ui/lib/utils";
import { Trans } from "react-i18next";

export const CREDIT_LINK = "underline underline-offset-2 hover:text-foreground";

/** "Photo by … on Unsplash", which Unsplash asks for wherever its photo shows. */
export function SampleCredit({
	credit,
	className,
}: {
	credit: Credit;
	className?: string;
}) {
	return (
		<p className={cn("text-muted-foreground text-xs", className)}>
			<Trans
				i18nKey="home.sampleCredit"
				values={{ author: credit.author }}
				components={{
					author: (
						// biome-ignore lint/a11y/useAnchorContent: Trans fills in the name.
						<a
							href={credit.authorUrl}
							target="_blank"
							rel="noreferrer"
							className={CREDIT_LINK}
						/>
					),
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
	);
}
