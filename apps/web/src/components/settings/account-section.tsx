import { signOutToGuest } from "@piecemates/client";
import { Button } from "@piecemates/ui/components/button";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { api } from "@/lib/api";
import { authClient } from "@/lib/auth-client";

import { DeleteAccount } from "./delete-account";

/** Who I am: a guest gets Link account, a signed-up player sees their email, Sign out and Delete account. */
export function AccountSection({ onLeave }: { onLeave: () => void }) {
	const { t } = useTranslation();
	const { data: session } = authClient.useSession();
	if (!session) return null;
	const { name, email, isAnonymous } = session.user;
	return (
		<section className="grid gap-2">
			<h3 className="font-medium text-sm">{t("account.title")}</h3>
			<p className="text-sm">
				{name}
				<span className="block text-muted-foreground">
					{isAnonymous ? t("account.guest") : email}
				</span>
			</p>
			{isAnonymous ? (
				<>
					<p className="text-muted-foreground text-sm">
						{t("account.linkHint")}
					</p>
					<Button
						nativeButton={false}
						render={<Link to="/login" />}
						onClick={onLeave}
					>
						{t("account.linkAccount")}
					</Button>
				</>
			) : (
				<>
					<Button
						variant="destructive"
						onClick={async () => {
							await signOutToGuest(authClient);
							await api.queryClient.invalidateQueries();
							onLeave();
						}}
					>
						{t("account.signOut")}
					</Button>
					<DeleteAccount onLeave={onLeave} />
				</>
			)}
		</section>
	);
}
