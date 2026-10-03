import { Linking, Text } from "react-native";

/** A link inside a line of text. */
export function CreditLink({
	url,
	children,
}: {
	url: string;
	children?: string;
}) {
	return (
		<Text
			accessibilityRole="link"
			className="underline"
			onPress={() => Linking.openURL(url)}
		>
			{children}
		</Text>
	);
}
