import {
	BACKGROUNDS,
	MUSIC_TRACKS,
	setBackground,
	setHaptics,
	setMusic,
	setSounds,
} from "@piecemates/client";
import { Button } from "@piecemates/ui/components/button";
import { Checkbox } from "@piecemates/ui/components/checkbox";
import { Label } from "@piecemates/ui/components/label";
import { useTranslation } from "react-i18next";

import { ColorSwatches } from "@/components/bags/color-swatches";
import { useSettings } from "@/hooks/use-settings";

/** My view settings (saved on this device), for the app's settings and the room's sheet. */
export function BoardSettings() {
	const { t } = useTranslation();
	const background = useSettings((s) => s.background);
	const sounds = useSettings((s) => s.sounds);
	const haptics = useSettings((s) => s.haptics);
	const music = useSettings((s) => s.music);
	return (
		<>
			<p className="text-muted-foreground text-sm">
				{t("settings.background")}
			</p>
			<ColorSwatches
				colors={BACKGROUNDS}
				value={background}
				onChange={setBackground}
			/>
			<Label className="text-sm">
				<Checkbox checked={sounds} onCheckedChange={setSounds} />
				{t("settings.sounds")}
			</Label>
			<Label className="text-sm">
				<Checkbox checked={haptics} onCheckedChange={setHaptics} />
				{t("settings.haptics")}
			</Label>
			<p className="text-muted-foreground text-sm">{t("settings.music")}</p>
			<div className="flex flex-wrap gap-2">
				{[null, ...MUSIC_TRACKS].map((track) => (
					<Button
						key={track ?? "off"}
						size="sm"
						variant={music === track ? "default" : "outline"}
						aria-pressed={music === track}
						onClick={() => setMusic(track)}
					>
						{t(`music.${track ?? "off"}`)}
					</Button>
				))}
			</div>
		</>
	);
}
