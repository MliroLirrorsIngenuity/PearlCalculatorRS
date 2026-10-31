import i18n from "i18next";
import { TriangleAlertIcon } from "lucide-react";
import { toast } from "sonner";

function errorText(error: unknown) {
	const translate = (key: string) => i18n.t(key as any);
	if (error instanceof Error) {
		return error.message.startsWith("error.")
			? translate(error.message)
			: error.message;
	}
	if (typeof error === "string") {
		return error.startsWith("error.") ? translate(error) : error;
	}
	return String(error || i18n.t("error.unknown" as any, "Unknown error"));
}

export function toastError(title: string, error?: unknown) {
	toast(title, {
		description: errorText(error),
		icon: <TriangleAlertIcon className="size-4 text-red-600" />,
		className:
			"!text-red-600 [&_[data-title]]:!text-red-600 [&_[data-description]]:!text-red-600",
	});
}

export function useToastNotifications() {
	const showSuccess = (message: string) => {
		toast.success(message);
	};

	return { showSuccess, showError: toastError };
}
