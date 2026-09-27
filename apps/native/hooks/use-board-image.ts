import { imageSrc } from "@piecemates/client";
import { useImage } from "@shopify/react-native-skia";
import { Image } from "expo-image";
import { useEffect, useState } from "react";

/** Enough detail to zoom in on a phone without holding the 3072 web copy in memory. */
const BOARD_IMAGE_WIDTH = 2048;

/**
 * The room photo for Skia, which has no cache of its own: expo-image puts it
 * on disk once and Skia reads that file, so reopening a room downloads nothing.
 */
export function useBoardImage(url: string) {
	const src = imageSrc(url, BOARD_IMAGE_WIDTH, 1);
	const [file, setFile] = useState<string | null>(null);
	useEffect(() => {
		let live = true;
		void (async () => {
			await Image.prefetch(src, "disk");
			const path = await Image.getCachePathAsync(src);
			// Without a cached file Skia downloads it itself.
			if (live) setFile(path ? `file://${path}` : src);
		})();
		return () => {
			live = false;
		};
	}, [src]);
	return useImage(file);
}
