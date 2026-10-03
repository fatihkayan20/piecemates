import { accountForm } from "@piecemates/client";
import { Button } from "@piecemates/ui/components/button";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { api } from "@/lib/api";
import { authClient } from "@/lib/auth-client";

import { FormField } from "./form-field";
import { Loader } from "./loader";

export function SignUpForm({
	onSwitchToSignIn,
}: {
	onSwitchToSignIn: () => void;
}) {
	const { t } = useTranslation();
	const navigate = useNavigate({
		from: "/",
	});
	const { isPending } = authClient.useSession();

	const form = useForm({
		defaultValues: {
			email: "",
			password: "",
			confirm: "",
			name: "",
		},
		onSubmit: async ({ value }) => {
			await authClient.signUp.email(
				{
					email: value.email,
					password: value.password,
					name: value.name,
				},
				{
					onSuccess: () => {
						// A guest's rooms moved to this account.
						void api.queryClient.invalidateQueries();
						navigate({
							to: "/",
						});
						toast.success(t("account.signedUp"));
					},
					onError: (error) => {
						toast.error(error.error.message || error.error.statusText);
					},
				},
			);
		},
		validators: { onSubmit: accountForm(true) },
	});

	if (isPending) {
		return <Loader />;
	}

	return (
		<div className="mx-auto mt-10 w-full max-w-md p-6">
			<h1 className="mb-6 text-center font-bold text-3xl">
				{t("account.createAccount")}
			</h1>

			<form
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
				className="space-y-4"
			>
				<form.Field name="name">
					{(field) => (
						<FormField
							name={field.name}
							label={t("account.name")}
							autoComplete="name"
							value={field.state.value}
							errors={field.state.meta.errors}
							onBlur={field.handleBlur}
							onChange={field.handleChange}
						/>
					)}
				</form.Field>

				<form.Field name="email">
					{(field) => (
						<FormField
							name={field.name}
							label={t("account.email")}
							type="email"
							autoComplete="email"
							value={field.state.value}
							errors={field.state.meta.errors}
							onBlur={field.handleBlur}
							onChange={field.handleChange}
						/>
					)}
				</form.Field>

				<form.Field name="password">
					{(field) => (
						<FormField
							name={field.name}
							label={t("account.password")}
							type="password"
							autoComplete="new-password"
							value={field.state.value}
							errors={field.state.meta.errors}
							onBlur={field.handleBlur}
							onChange={field.handleChange}
						/>
					)}
				</form.Field>

				<form.Field name="confirm">
					{(field) => (
						<FormField
							name={field.name}
							label={t("account.confirmPassword")}
							type="password"
							autoComplete="new-password"
							value={field.state.value}
							errors={field.state.meta.errors}
							onBlur={field.handleBlur}
							onChange={field.handleChange}
						/>
					)}
				</form.Field>

				<form.Subscribe
					selector={(state) => ({
						canSubmit: state.canSubmit,
						isSubmitting: state.isSubmitting,
					})}
				>
					{({ canSubmit, isSubmitting }) => (
						<Button
							type="submit"
							className="w-full"
							disabled={!canSubmit || isSubmitting}
						>
							{isSubmitting ? t("account.submitting") : t("account.signUp")}
						</Button>
					)}
				</form.Subscribe>
			</form>

			<div className="mt-4 text-center">
				<Button
					variant="link"
					onClick={onSwitchToSignIn}
					className="text-indigo-600 hover:text-indigo-800"
				>
					{t("account.haveAccount")}
				</Button>
			</div>
		</div>
	);
}
