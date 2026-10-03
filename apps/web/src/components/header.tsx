import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { ModeToggle } from "./mode-toggle";
import { UserMenu } from "./user-menu";

export function Header() {
	const { t } = useTranslation();
	return (
		<header className="flex items-center justify-between gap-4 border-b px-4 py-2">
			<nav className="flex items-center gap-5">
				<Link to="/" className="font-semibold text-lg">
					{t("app.name")}
				</Link>
				<Link
					to="/history"
					className="text-muted-foreground text-sm hover:text-foreground"
					activeProps={{ className: "text-foreground" }}
				>
					{t("nav.history")}
				</Link>
			</nav>
			<div className="flex items-center gap-2">
				<ModeToggle />
				<UserMenu />
			</div>
		</header>
	);
}
