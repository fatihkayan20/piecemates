import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/_auth/dashboard")({
	component: RouteComponent,
});

function RouteComponent() {
	const { t } = useTranslation();
	const { session } = Route.useRouteContext();

	return (
		<div>
			<h1>{t("nav.dashboard")}</h1>
			<p>{t("account.welcome", { name: session.data?.user.name ?? "" })}</p>
		</div>
	);
}
