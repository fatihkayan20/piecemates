// The iOS 27 SDK traps at launch unless the app adopts the UIScene life cycle.
// Expo 57 ships `ExpoAppSceneDelegate`, but its prebuild template still creates the
// window in AppDelegate. This backports the SDK 58 template's setup.
// ponytail: delete this plugin when upgrading to Expo SDK 58.
const fs = require("node:fs");
const path = require("node:path");
const {
	IOSConfig,
	withAppDelegate,
	withInfoPlist,
	withXcodeProject,
} = require("expo/config-plugins");

const SCENE_DELEGATE = `internal import Expo

@objc(SceneDelegate)
class SceneDelegate: ExpoAppSceneDelegate {}
`;

function replaceOrThrow(src, pattern, replacement, what) {
	if (!pattern.test(src))
		throw new Error(
			`with-ios-scene: couldn't find ${what} in AppDelegate.swift`,
		);
	return src.replace(pattern, replacement);
}

module.exports = function withIosScene(input) {
	let config = withInfoPlist(input, (c) => {
		c.modResults.UIApplicationSceneManifest = {
			UIApplicationSupportsMultipleScenes: false,
			UISceneConfigurations: {
				UIWindowSceneSessionRoleApplication: [
					{
						UISceneConfigurationName: "Default Configuration",
						UISceneDelegateClassName: "$(PRODUCT_MODULE_NAME).SceneDelegate",
					},
				],
			},
		};
		return c;
	});

	config = withAppDelegate(config, (c) => {
		let src = c.modResults.contents;
		if (!src.includes("ExpoReactNativeFactoryProvider")) {
			src = replaceOrThrow(
				src,
				/class AppDelegate: ExpoAppDelegate \{/,
				"class AppDelegate: ExpoAppDelegate, ExpoReactNativeFactoryProvider {",
				"the AppDelegate class declaration",
			);
			// SceneDelegate creates the window and starts React Native instead.
			src = replaceOrThrow(
				src,
				/#if os\(iOS\) \|\| os\(tvOS\)\n\s*window = UIWindow[\s\S]*?#endif\n/,
				"",
				"the window setup block",
			);
		}
		c.modResults.contents = src;
		return c;
	});

	return withXcodeProject(config, (c) => {
		const name = IOSConfig.XcodeUtils.getProjectName(c.modRequest.projectRoot);
		fs.writeFileSync(
			path.join(c.modRequest.platformProjectRoot, name, "SceneDelegate.swift"),
			SCENE_DELEGATE,
		);
		const filepath = `${name}/SceneDelegate.swift`;
		if (!c.modResults.hasFile(filepath)) {
			IOSConfig.XcodeUtils.addBuildSourceFileToGroup({
				filepath,
				groupName: name,
				project: c.modResults,
			});
		}
		return c;
	});
};
