// How every canvas draws the board. The table colour behind it is the CSS
// theme token `board` (web and native), since the canvases are transparent.
export const BOARD_STYLE = {
	// Mid grey, so it shows on light and dark table colours alike.
	frame: { width: 2, color: "rgba(128,128,128,0.4)" },
	outline: { width: 1, color: "rgba(0,0,0,0.4)" },
	/**
	 * A light rim just inside every piece's edge, so pieces read as raised
	 * tiles against the table and each other. Widths are in table units (a
	 * cell is CELL_WIDTH wide).
	 */
	bevel: { width: 3, color: "rgba(255,255,255,0.35)" },
	/** A flat copy under loose pieces, down and right; placed pieces lie flat. */
	shadow: { offset: 4, color: "rgba(0,0,0,0.35)" },
	/** Pieces another player is holding. */
	heldOpacity: 0.5,
};
