import { cn } from "heroui-native";
import type { PropsWithChildren } from "react";
import {
	ScrollView,
	type ScrollViewProps,
	View,
	type ViewProps,
} from "react-native";
import Animated, { type AnimatedProps } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const AnimatedView = Animated.createAnimatedComponent(View);

type Props = AnimatedProps<ViewProps> & {
	/** Styles the content (padding, gap), inside the scroll view. */
	className?: string;
	isScrollable?: boolean;
	scrollViewProps?: Omit<ScrollViewProps, "contentContainerStyle">;
};

export function Container({
	children,
	className,
	isScrollable = true,
	scrollViewProps,
	...props
}: PropsWithChildren<Props>) {
	const insets = useSafeAreaInsets();

	return (
		<AnimatedView
			className="flex-1 bg-background"
			style={{
				paddingBottom: insets.bottom,
			}}
			{...props}
		>
			{isScrollable ? (
				<ScrollView
					contentContainerClassName={cn("grow", className)}
					keyboardShouldPersistTaps="handled"
					contentInsetAdjustmentBehavior="automatic"
					{...scrollViewProps}
				>
					{children}
				</ScrollView>
			) : (
				<View className={cn("flex-1", className)}>{children}</View>
			)}
		</AnimatedView>
	);
}
