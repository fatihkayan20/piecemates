import type { Credit } from "@piecemates/client";
import { UNSPLASH_URL } from "@piecemates/game";
import { Trans } from "react-i18next";
import { Text } from "react-native";

import { CreditLink } from "@/components/credit-link";

/** "Photo by … on Unsplash", which Unsplash asks for wherever its photo shows. */
export function SampleCredit({
	credit,
	className = "text-muted",
}: {
	credit: Credit;
	className?: string;
}) {
	return (
		<Text className={`text-xs ${className}`}>
			<Trans
				i18nKey="home.sampleCredit"
				values={{ author: credit.author }}
				components={{
					author: <CreditLink url={credit.authorUrl} />,
					unsplash: <CreditLink url={UNSPLASH_URL} />,
				}}
			/>
		</Text>
	);
}
