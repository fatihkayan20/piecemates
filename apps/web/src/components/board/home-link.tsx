import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { useTranslation } from "react-i18next";

import { iconButton } from "./icon-button";

/** Back Home from a room, which has no header. */
export function HomeLink() {
	const { t } = useTranslation();
	return (
		<Link to="/" aria-label={t("nav.goHome")} className={iconButton}>
			<ChevronLeft className="size-4" />
		</Link>
	);
}
