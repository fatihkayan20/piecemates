import { useTranslation } from "react-i18next";
import { Image, View } from "react-native";
import Animated, { ZoomIn } from "react-native-reanimated";

// "cat-dance-cat" from Tenor, kept in the repo so a moved link can't break it.
const dancingCats = require("@/assets/images/dancing-cats.gif");
const CAT_SIZE = 160;
/** Space between the cats and the top of the bar. */
const CAT_GAP = 16;

/** Dancing cats that pop up just above the solved bar. */
export function WinCat() {
	const { t } = useTranslation();
	return (
		<View
			pointerEvents="none"
			className="absolute self-center"
			style={{ top: -(CAT_SIZE + CAT_GAP) }}
		>
			<Animated.View entering={ZoomIn.springify()}>
				<Image
					source={dancingCats}
					accessibilityLabel={t("room.winCat")}
					className="rounded-lg"
					style={{ width: CAT_SIZE, height: CAT_SIZE }}
				/>
			</Animated.View>
		</View>
	);
}
