import { createErrorText, type PickedImage } from "@piecemates/client";
import { useQuery } from "@tanstack/react-query";
import { launchImageLibraryAsync } from "expo-image-picker";
import { useTranslation } from "react-i18next";
import { Alert, Pressable, Text } from "react-native";

import { api } from "@/lib/api";
import { preparePhoto } from "@/lib/photo";

/** Picks a photo from the library; it's uploaded once the room is created. */
export function UploadTile({
	disabled,
	className,
	onPick,
}: {
	disabled: boolean;
	className: string;
	onPick: (image: PickedImage) => void;
}) {
	const { t } = useTranslation();
	const { data: credits } = useQuery(api.uploadCredits());
	const pick = async () => {
		const { assets } = await launchImageLibraryAsync({
			mediaTypes: ["images"],
		});
		const photo = assets?.[0];
		if (!photo) return;
		try {
			const { uri, width, height, file } = await preparePhoto(photo);
			onPick({ url: uri, width, height, file });
		} catch (e) {
			Alert.alert(createErrorText(e));
		}
	};
	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={t("upload.photo")}
			disabled={disabled}
			className={`${className} items-center justify-center rounded border border-border border-dashed ${disabled ? "opacity-50" : ""}`}
			onPress={pick}
		>
			<Text className="font-medium text-foreground text-sm">
				{t("upload.photo")}
			</Text>
			{credits !== undefined && (
				<Text className="text-muted text-xs">
					{t("upload.creditsLeft", { count: credits })}
				</Text>
			)}
		</Pressable>
	);
}
