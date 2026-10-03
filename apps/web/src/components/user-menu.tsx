import { PRIVACY_PATH } from "@piecemates/client";
import { Button } from "@piecemates/ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@piecemates/ui/components/dropdown-menu";
import { Skeleton } from "@piecemates/ui/components/skeleton";
import { Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { authClient } from "@/lib/auth-client";

export function UserMenu() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { data: session, isPending } = authClient.useSession();

	if (isPending) {
		return <Skeleton className="h-9 w-24" />;
	}

	if (!session) {
		return (
			<Link to="/login">
				<Button variant="outline">{t("account.signIn")}</Button>
			</Link>
		);
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger render={<Button variant="outline" />}>
				{session.user.name}
			</DropdownMenuTrigger>
			<DropdownMenuContent className="bg-card">
				<DropdownMenuGroup>
					<DropdownMenuLabel>{t("account.myAccount")}</DropdownMenuLabel>
					<DropdownMenuSeparator />
					{!session.user.isAnonymous && (
						<DropdownMenuItem>{session.user.email}</DropdownMenuItem>
					)}
					<DropdownMenuItem render={<Link to={PRIVACY_PATH} />}>
						{t("nav.privacy")}
					</DropdownMenuItem>
					<DropdownMenuItem
						variant="destructive"
						onClick={() => {
							authClient.signOut({
								fetchOptions: {
									onSuccess: () => {
										navigate({
											to: "/",
										});
									},
								},
							});
						}}
					>
						{t("account.signOut")}
					</DropdownMenuItem>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
