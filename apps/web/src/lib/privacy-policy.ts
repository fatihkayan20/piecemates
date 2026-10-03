/** The privacy policy, in English only. Bump updatedOn with every change. */
export const PRIVACY_POLICY = {
	title: "Privacy policy",
	updatedOn: "3 October 2026",
	contact: "fatihkayann20@gmail.com",
	intro:
		"Piecemates is a multiplayer jigsaw puzzle on the web and on iOS. This page says what it collects, why, who else sees it, and when it is deleted. Piecemates has no ads and never sells data.",
	sections: [
		{
			title: "Your account",
			body: [
				"When you first play, Piecemates makes a guest account for you. It holds the name you pick and a random id.",
				"If you sign up, it also holds your email address and a hashed password (never the password itself).",
				"Each signed-in device has a session, which stores its IP address and browser or device type, so you stay signed in and we can stop abuse.",
			],
		},
		{
			title: "Rooms and puzzles",
			body: [
				"A room stores its picture, who joined it, where every piece is, and how long you played. Other players in a room see your name and your moves.",
				"A room is cleared once it is solved, everyone leaves it, or nobody plays it for 30 days: its pieces and an uploaded original are deleted. A short record (picture, size, time played) stays so your History can show it.",
			],
		},
		{
			title: "Your photos",
			body: [
				"Photos you upload are stored privately on Cloudflare R2. Players in your room see a resized copy; the original is never public. An upload no room uses is deleted after a day.",
				"With each upload we keep the IP address it came from, to limit how many uploads one address can make.",
			],
		},
		{
			title: "Unsplash photos",
			body: [
				"Sample pictures come from Unsplash and load straight from Unsplash's servers, so Unsplash sees your IP address and browser like any website you visit. When a room starts from a sample, our server tells Unsplash the photo was used; that call carries no data about you.",
				"Unsplash's own privacy policy is at unsplash.com/privacy.",
			],
		},
		{
			title: "Analytics and errors",
			body: [
				"We use PostHog (EU servers) to count how the app is used, such as rooms started and puzzles solved. Events are tied to your account id, not your name or email. Screen recording is off.",
				"We use Sentry to catch crashes and errors. Reports carry the error, the device or browser type and, after an error, a short replay of the screen with all text and images masked. They don't include your name, email or cookies.",
			],
		},
		{
			title: "On your device",
			body: [
				"Your settings (theme, sounds, music, haptics) and your sign-in are kept on your device.",
			],
		},
		{
			title: "Who runs it",
			body: [
				"Everything runs on Cloudflare (Workers, D1, R2). PostHog, Sentry and Unsplash see only what is described above. We share nothing else with anyone, unless the law requires it.",
			],
		},
		{
			title: "Your choices",
			body: [
				"You can ask us to see, export or delete your account and everything tied to it by emailing the address below. We reply within 30 days.",
				"Piecemates is not meant for children under 13.",
			],
		},
	],
} as const;
