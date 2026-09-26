import { useTranslation } from "react-i18next";
// "cat-dance-cat" from Tenor, kept in the repo so a moved link can't break it.
import dancingCats from "@/assets/images/dancing-cats.gif";

/** Dancing cats that pop up over the table when the puzzle is done. */
export function WinCat() {
	const { t } = useTranslation();
	return (
		<img
			src={dancingCats}
			alt={t("room.winCat")}
			className="fade-in zoom-in-50 slide-in-from-bottom-10 pointer-events-none absolute bottom-16 left-1/2 size-40 -translate-x-1/2 animate-in rounded-lg duration-700"
		/>
	);
}
