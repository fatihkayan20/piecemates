import { deleteAccountToGuest } from "@piecemates/client";
import { Button } from "@piecemates/ui/components/button";
import { Input } from "@piecemates/ui/components/input";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { api } from "@/lib/api";
import { authClient } from "@/lib/auth-client";

/** Delete account, confirmed in place with my password (App Store rule: accounts can be deleted in the app). */
export function DeleteAccount({ onLeave }: { onLeave: () => void }) {
	const { t } = useTranslation();
	const [confirming, setConfirming] = useState(false);
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);

	if (!confirming)
		return (
			<Button variant="ghost" onClick={() => setConfirming(true)}>
				{t("account.deleteAccount")}
			</Button>
		);

	return (
		<form
			className="grid gap-2 border border-destructive/40 p-3"
			onSubmit={async (event) => {
				event.preventDefault();
				setBusy(true);
				const refused = await deleteAccountToGuest(authClient, password);
				setBusy(false);
				if (refused !== null) return setError(refused);
				await api.queryClient.invalidateQueries();
				toast.success(t("account.deleted"));
				onLeave();
			}}
		>
			<h4 className="font-medium text-sm">{t("account.deleteTitle")}</h4>
			<p className="text-muted-foreground text-sm">{t("account.deleteHint")}</p>
			<Input
				type="password"
				autoComplete="current-password"
				aria-label={t("account.password")}
				placeholder={t("account.password")}
				value={password}
				aria-invalid={error !== null}
				onChange={(event) => setPassword(event.target.value)}
			/>
			{error !== null && <p className="text-destructive text-sm">{error}</p>}
			<div className="grid grid-cols-2 gap-2">
				<Button
					type="button"
					variant="outline"
					onClick={() => setConfirming(false)}
				>
					{t("account.cancel")}
				</Button>
				<Button
					type="submit"
					variant="destructive"
					disabled={busy || password === ""}
				>
					{t("account.deleteConfirm")}
				</Button>
			</div>
		</form>
	);
}
