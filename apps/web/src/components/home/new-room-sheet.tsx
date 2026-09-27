import { createErrorText, defaultGrid } from "@piecemates/client";
import { gridOptions } from "@piecemates/game";
import { Button } from "@piecemates/ui/components/button";
import { Checkbox } from "@piecemates/ui/components/checkbox";
import { Label } from "@piecemates/ui/components/label";
import {
	Sheet,
	SheetContent,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@piecemates/ui/components/sheet";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Photo } from "@/components/photo";
import { api } from "@/lib/api";

/** A sample, a new photo to upload (`file`) or my unused upload (`upload`). */
export type PickedImage = {
	url: string;
	width: number;
	height: number;
	file?: Blob;
	upload?: string;
};

/** The sheet is at most 28rem wide. */
const PREVIEW_SIZES = "(min-width: 28rem) 28rem, 100vw";

/** Room options for a picked image: piece count and turned pieces. Closed while `image` is undefined. */
export function NewRoomSheet({
	image,
	onClose,
}: {
	image: PickedImage | undefined;
	onClose: () => void;
}) {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const options = image ? gridOptions(image.width, image.height) : [];
	// A count picked for another image falls back to the default.
	const [count, setCount] = useState<number>();
	const grid = options.find((o) => o.count === count) ?? defaultGrid(options);
	const [rotate, setRotate] = useState(false);
	const sample = useMutation(api.createRoom());
	const uploaded = useMutation(api.createRoomFromUpload());
	const upload = useMutation(api.uploadImage());
	const isPending = sample.isPending || uploaded.isPending || upload.isPending;

	const create = async () => {
		if (!image || !grid) return;
		const { rows, cols } = grid;
		try {
			const id = image.file
				? await upload.mutateAsync(image.file)
				: image.upload;
			const room = id
				? await uploaded.mutateAsync({ upload: id, rows, cols, rotate })
				: await sample.mutateAsync({
						imageUrl: image.url,
						imageW: image.width,
						imageH: image.height,
						rows,
						cols,
						rotate,
					});
			await navigate({ to: "/room/$code", params: { code: room.code } });
		} catch (e) {
			toast.error(createErrorText(e));
		}
	};

	return (
		<Sheet open={!!image} onOpenChange={(open) => !open && onClose()}>
			<SheetContent side="bottom">
				<div className="mx-auto flex w-full max-w-md flex-col gap-4 p-4">
					<SheetHeader className="p-0">
						<SheetTitle>{t("home.newRoom")}</SheetTitle>
					</SheetHeader>
					{image && (
						<Photo
							url={image.url}
							sizes={PREVIEW_SIZES}
							className="aspect-video w-full rounded object-cover"
						/>
					)}
					<p className="text-muted-foreground text-sm">
						{t("home.pieceCount")}
					</p>
					<div className="flex flex-wrap gap-2">
						{options.map((o) => (
							<Button
								key={o.count}
								size="sm"
								variant={o.count === grid?.count ? "default" : "outline"}
								aria-pressed={o.count === grid?.count}
								onClick={() => setCount(o.count)}
							>
								{o.count}
							</Button>
						))}
					</div>
					<Label className="text-sm">
						<Checkbox checked={rotate} onCheckedChange={setRotate} />
						{t("home.rotate")}
					</Label>
					<p className="text-muted-foreground text-sm">
						{t("home.rotateHint")}
					</p>
					<SheetFooter className="p-0">
						<Button disabled={isPending || !grid} onClick={create}>
							{upload.isPending ? t("upload.uploading") : t("home.create")}
						</Button>
					</SheetFooter>
				</div>
			</SheetContent>
		</Sheet>
	);
}
