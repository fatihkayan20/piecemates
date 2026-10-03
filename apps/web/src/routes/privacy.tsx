import { createFileRoute } from "@tanstack/react-router";

import { PRIVACY_POLICY } from "@/lib/privacy-policy";

export const Route = createFileRoute("/privacy")({
	component: PrivacyComponent,
});

/** The privacy policy; the app links here too. */
function PrivacyComponent() {
	const { title, updatedOn, contact, intro, sections } = PRIVACY_POLICY;
	return (
		<article className="container mx-auto grid max-w-3xl content-start gap-4 px-4 py-6 text-sm">
			<header className="grid gap-1">
				<h1 className="font-medium text-xl">{title}</h1>
				<p className="text-muted-foreground">Last updated {updatedOn}</p>
			</header>
			<p>{intro}</p>
			{sections.map((section) => (
				<section key={section.title} className="grid gap-2">
					<h2 className="font-medium text-base">{section.title}</h2>
					{section.body.map((paragraph) => (
						<p key={paragraph}>{paragraph}</p>
					))}
				</section>
			))}
			<p>
				Questions or requests:{" "}
				<a href={`mailto:${contact}`} className="underline">
					{contact}
				</a>
			</p>
		</article>
	);
}
