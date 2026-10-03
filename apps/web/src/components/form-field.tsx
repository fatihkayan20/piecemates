import { Input } from "@piecemates/ui/components/input";
import { Label } from "@piecemates/ui/components/label";

/** A labelled input with its validation messages under it. */
export function FormField({
	name,
	label,
	type,
	autoComplete,
	value,
	errors,
	onBlur,
	onChange,
}: {
	name: string;
	label: string;
	type?: string;
	autoComplete?: string;
	value: string;
	errors: ({ message?: string } | undefined)[];
	onBlur: () => void;
	onChange: (value: string) => void;
}) {
	return (
		<div className="space-y-2">
			<Label htmlFor={name}>{label}</Label>
			<Input
				id={name}
				name={name}
				type={type}
				autoComplete={autoComplete}
				value={value}
				onBlur={onBlur}
				onChange={(e) => onChange(e.target.value)}
			/>
			{errors.map((error) => (
				<p key={error?.message} className="text-red-500">
					{error?.message}
				</p>
			))}
		</div>
	);
}
