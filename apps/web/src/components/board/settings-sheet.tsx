import {
	BACKGROUNDS,
	setBackground,
	setHaptics,
	setSounds,
} from "@piecemates/client";
import { Checkbox } from "@piecemates/ui/components/checkbox";
import { Label } from "@piecemates/ui/components/label";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@piecemates/ui/components/sheet";
import { Settings } from "lucide-react";

import { ColorSwatches } from "@/components/bags/color-swatches";
import { useSettings } from "@/hooks/use-settings";

import { iconButton } from "./icon-button";

/** The gear button and my own view settings, saved on this device. */
export function SettingsSheet() {
	const background = useSettings((s) => s.background);
	const sounds = useSettings((s) => s.sounds);
	const haptics = useSettings((s) => s.haptics);

	return (
		<Sheet>
			<SheetTrigger aria-label="Settings" className={iconButton}>
				<Settings className="size-4" />
			</SheetTrigger>
			<SheetContent side="bottom">
				<div className="mx-auto flex w-full max-w-md flex-col gap-4 p-4">
					<SheetHeader className="p-0">
						<SheetTitle>Settings</SheetTitle>
					</SheetHeader>
					<p className="text-muted-foreground text-sm">Background</p>
					<ColorSwatches
						colors={BACKGROUNDS}
						value={background}
						onChange={setBackground}
					/>
					<Label className="text-sm">
						<Checkbox checked={sounds} onCheckedChange={setSounds} />
						Sounds
					</Label>
					<Label className="text-sm">
						<Checkbox checked={haptics} onCheckedChange={setHaptics} />
						Haptics
					</Label>
				</div>
			</SheetContent>
		</Sheet>
	);
}
