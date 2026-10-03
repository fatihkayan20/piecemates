import { PRIVACY_PATH } from "@piecemates/client";
import { Checkbox } from "@piecemates/ui/components/checkbox";
import { Label } from "@piecemates/ui/components/label";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@piecemates/ui/components/sheet";
import { Link } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useTheme } from "@/components/theme-provider";

import { AccountSection } from "./account-section";
import { BoardSettings } from "./board-settings";

/** The header's gear: my account, puzzle and theme settings, and the privacy policy, like native's Settings tab. */
export function AppSettingsSheet() {
	const { t } = useTranslation();
	const { resolvedTheme, setTheme } = useTheme();
	const [open, setOpen] = useState(false);
	return (
		<Sheet open={open} onOpenChange={setOpen}>
			<SheetTrigger
				aria-label={t("settings.title")}
				className="rounded p-2 hover:bg-muted"
			>
				<Settings className="size-5" />
			</SheetTrigger>
			<SheetContent className="overflow-y-auto">
				<SheetHeader>
					<SheetTitle>{t("settings.title")}</SheetTitle>
				</SheetHeader>
				<div className="grid gap-6 px-4 pb-6">
					<AccountSection onLeave={() => setOpen(false)} />
					<section className="grid gap-3">
						<h3 className="font-medium text-sm">{t("settings.board")}</h3>
						<BoardSettings />
					</section>
					<section className="grid gap-3">
						<h3 className="font-medium text-sm">{t("settings.appearance")}</h3>
						<Label className="text-sm">
							<Checkbox
								checked={resolvedTheme === "dark"}
								onCheckedChange={(dark) => setTheme(dark ? "dark" : "light")}
							/>
							{t("settings.darkMode")}
						</Label>
					</section>
					<section className="grid gap-3">
						<h3 className="font-medium text-sm">{t("settings.about")}</h3>
						<Link
							to={PRIVACY_PATH}
							className="text-sm underline"
							onClick={() => setOpen(false)}
						>
							{t("settings.privacyPolicy")}
						</Link>
					</section>
				</div>
			</SheetContent>
		</Sheet>
	);
}
