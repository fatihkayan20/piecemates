import { useTranslation } from "react-i18next";

import { TabStack } from "@/components/tab-stack";

export default function HistoryLayout() {
	const { t } = useTranslation();
	return <TabStack title={t("nav.history")} />;
}
