/** The room's web link: opens on the web, and in the app once universal links are set up. */
export const roomUrl = (webOrigin: string, code: string) =>
	new URL(`/room/${code}`, webOrigin).href;
