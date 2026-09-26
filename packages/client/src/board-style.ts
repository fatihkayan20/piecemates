// How every canvas draws the board. The table colour behind it is the CSS
// theme token `board` (web and native), since the canvases are transparent.
export const BOARD_STYLE = {
	frame: { width: 2, color: "rgba(255,255,255,0.15)" },
	outline: { width: 1, color: "rgba(0,0,0,0.4)" },
	/** Pieces another player is holding. */
	heldOpacity: 0.5,
};
