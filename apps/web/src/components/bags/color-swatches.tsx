import { BAG_COLORS } from "@puzzle/client";

/** The bag colours as round buttons; the picked one gets a ring. */
export function ColorSwatches({
	value,
	onChange,
}: {
	value: string;
	onChange: (color: string) => void;
}) {
	return (
		<div className="flex gap-2">
			{BAG_COLORS.map((c) => (
				<button
					key={c}
					type="button"
					aria-label={`Colour ${c}`}
					aria-pressed={c === value}
					className="size-8 rounded-full aria-pressed:ring-2 aria-pressed:ring-foreground aria-pressed:ring-offset-2 aria-pressed:ring-offset-popover"
					style={{ background: c }}
					onClick={() => onChange(c)}
				/>
			))}
		</div>
	);
}
