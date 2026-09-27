import { createErrorText, type PickedImage } from "@piecemates/client";
import { UPLOAD_TYPES } from "@piecemates/game";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { api } from "@/lib/api";
import { preparePhoto } from "@/lib/photo";

/** Picks a photo from this device; it's uploaded once the room is created. */
export function UploadTile({
	disabled,
	onPick,
}: {
	disabled: boolean;
	onPick: (image: PickedImage) => void;
}) {
	const { t } = useTranslation();
	const { data: credits } = useQuery(api.uploadCredits());
	const pick = async (file: File | undefined) => {
		if (!file) return;
		try {
			const { blob, width, height } = await preparePhoto(file);
			onPick({ url: URL.createObjectURL(blob), width, height, file: blob });
		} catch (e) {
			toast.error(createErrorText(e));
		}
	};
	return (
		<label className="grid aspect-video cursor-pointer place-content-center gap-0.5 rounded border border-dashed text-center text-sm has-disabled:cursor-default has-disabled:opacity-50 has-focus-visible:ring-2">
			<input
				type="file"
				accept={UPLOAD_TYPES.join(",")}
				className="sr-only"
				disabled={disabled}
				onChange={(e) => {
					void pick(e.target.files?.[0]);
					// Picking the same file again still fires a change.
					e.target.value = "";
				}}
			/>
			<span className="font-medium">{t("upload.photo")}</span>
			{credits !== undefined && (
				<span className="text-muted-foreground text-xs">
					{t("upload.creditsLeft", { count: credits })}
				</span>
			)}
		</label>
	);
}
