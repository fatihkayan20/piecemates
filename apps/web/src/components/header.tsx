import { PRIVACY_PATH } from "@piecemates/client";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { ModeToggle } from "./mode-toggle";
import { UserMenu } from "./user-menu";

export function Header() {
	const { t } = useTranslation();
	const links = [
		{ to: "/", label: t("nav.home") },
		{ to: "/history", label: t("nav.history") },
		{ to: "/dashboard", label: t("nav.dashboard") },
		{ to: PRIVACY_PATH, label: t("nav.privacy") },
	] as const;

	return (
		<div>
			<div className="flex flex-row items-center justify-between px-2 py-1">
				<nav className="flex gap-4 text-lg">
					{links.map(({ to, label }) => {
						return (
							<Link key={to} to={to}>
								{label}
							</Link>
						);
					})}
				</nav>
				<div className="flex items-center gap-2">
					<ModeToggle />
					<UserMenu />
				</div>
			</div>
			<hr />
		</div>
	);
}
