import { MAX_NAME_LENGTH, needsName } from "@piecemates/game";
import { Button } from "@piecemates/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
} from "@piecemates/ui/components/dialog";
import { Input } from "@piecemates/ui/components/input";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";

/** Asks for my name before others see me (sharing or joining a room), then saves it. */
export function NameDialog({
	open,
	onOpenChange,
	onSaved,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSaved: () => void;
}) {
	const { t } = useTranslation();
	const [name, setName] = useState("");
	const [saving, setSaving] = useState(false);
	const valid = !needsName(name);

	const save = async () => {
		setSaving(true);
		const { error } = await authClient.updateUser({ name: name.trim() });
		setSaving(false);
		if (error) toast.error(t("name.failed"));
		else onSaved();
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogTitle>{t("name.title")}</DialogTitle>
				<DialogDescription>{t("name.hint")}</DialogDescription>
				<form
					className="flex gap-2"
					onSubmit={(e) => {
						e.preventDefault();
						if (valid) void save();
					}}
				>
					<Input
						autoFocus
						value={name}
						maxLength={MAX_NAME_LENGTH}
						aria-label={t("name.title")}
						onChange={(e) => setName(e.target.value)}
					/>
					<Button type="submit" disabled={!valid || saving}>
						{t("name.save")}
					</Button>
				</form>
			</DialogContent>
		</Dialog>
	);
}
