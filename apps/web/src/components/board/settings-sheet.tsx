import { Button } from "@piecemates/ui/components/button";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@piecemates/ui/components/sheet";
import { cn } from "@piecemates/ui/lib/utils";
import { Flag, Settings } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { BoardSettings } from "@/components/settings/board-settings";
import { useRoom } from "@/hooks/use-room";

import { AbandonConfirm } from "./abandon-confirm";
import { iconButton } from "./icon-button";

/**
 * The gear button, my own view settings (saved on this device) and Abandon.
 * Abandon turns the sheet into its confirmation in place: both share one grid
 * cell and the settings only go invisible, so the sheet keeps its height.
 */
export function SettingsSheet({ code }: { code: string }) {
	const { t } = useTranslation();
	const done = useRoom((r) => r.status === "done");
	const [confirming, setConfirming] = useState(false);

	return (
		<Sheet onOpenChange={() => setConfirming(false)}>
			<SheetTrigger aria-label={t("settings.title")} className={iconButton}>
				<Settings className="size-4" />
			</SheetTrigger>
			<SheetContent side="bottom">
				<div className="mx-auto grid w-full max-w-md p-4">
					<div
						className={cn(
							"col-start-1 row-start-1 flex flex-col gap-4 transition-opacity",
							confirming && "invisible opacity-0",
						)}
					>
						<SheetHeader className="p-0">
							<SheetTitle>{t("settings.title")}</SheetTitle>
						</SheetHeader>
						<BoardSettings />
						{!done && (
							<Button
								variant="outline"
								className="text-destructive"
								onClick={() => setConfirming(true)}
							>
								<Flag />
								{t("room.abandon")}
							</Button>
						)}
					</div>
					{confirming && (
						<div className="fade-in col-start-1 row-start-1 flex animate-in justify-center">
							<AbandonConfirm
								code={code}
								onCancel={() => setConfirming(false)}
							/>
						</div>
					)}
				</div>
			</SheetContent>
		</Sheet>
	);
}
