// How every canvas draws the board. The table colour behind it is the CSS
// theme token `board` (web and native), since the canvases are transparent.
export const BOARD_STYLE = {
	// Mid grey, so it shows on light and dark table colours alike.
	frame: { width: 2, color: "rgba(128,128,128,0.4)" },
	outline: { width: 1, color: "rgba(0,0,0,0.4)" },
	/** Pieces another player is holding. */
	heldOpacity: 0.5,
};
