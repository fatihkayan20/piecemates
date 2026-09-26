const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;

const pad = (n: number) => String(n).padStart(2, "0");

/** "4:05" or "1:02:09" for a play time in ms. */
export function formatDuration(ms: number) {
	const h = Math.floor(ms / HOUR);
	const m = Math.floor((ms % HOUR) / MINUTE);
	const s = pad(Math.floor((ms % MINUTE) / SECOND));
	return h > 0 ? `${h}:${pad(m)}:${s}` : `${m}:${s}`;
}
