export const chip =
	"flex-row items-center gap-2 rounded bg-background/70 px-3 py-1.5";
export const dashed = "border border-dashed border-foreground/40";
/** Highlights the drop target under a drag. */
export const ring = (on: boolean) => (on ? "border-2 border-foreground" : "");
