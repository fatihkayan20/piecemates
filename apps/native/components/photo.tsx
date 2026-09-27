import { imageSrc } from "@piecemates/client";
import { Image } from "expo-image";
import { type ComponentProps, useState } from "react";
import { PixelRatio } from "react-native";
import { withUniwind } from "uniwind";

const StyledImage = withUniwind(Image);
/** Fade-in for a photo that just loaded. */
const FADE_MS = 150;

/**
 * A room photo at the width it shows at: measured, then asked for in device
 * pixels. expo-image keeps it in memory and on disk.
 */
export function Photo({
	url,
	...props
}: { url: string } & ComponentProps<typeof StyledImage>) {
	const [width, setWidth] = useState(0);
	return (
		<StyledImage
			source={width ? imageSrc(url, width, PixelRatio.get()) : null}
			transition={FADE_MS}
			onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
			{...props}
		/>
	);
}
