/** The room's web link: opens on the web, and in the app once universal links are set up. */
export const roomUrl = (webOrigin: string, code: string) =>
	new URL(`/room/${code}`, webOrigin).href;

/** The privacy policy lives on the web; the app opens it in a browser. */
export const PRIVACY_PATH = "/privacy";
export const privacyUrl = (webOrigin: string) =>
	new URL(PRIVACY_PATH, webOrigin).href;
