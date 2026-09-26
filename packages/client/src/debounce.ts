/** Runs `fn` once calls have stopped for `ms`; `cancel` drops a pending run. */
export function debounce(fn: () => void, ms: number) {
	let timer: ReturnType<typeof setTimeout> | undefined;
	const run = () => {
		clearTimeout(timer);
		timer = setTimeout(fn, ms);
	};
	return Object.assign(run, { cancel: () => clearTimeout(timer) });
}
