import { TriangleAlertIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export function useToastNotifications() {
	const { t } = useTranslation();

	const showSuccess = (message: string) => {
		toast.success(message);
	};

	const showError = (title: string, error?: unknown) => {
		let errorMessage: string;
		if (error instanceof Error) {
			errorMessage = error.message.startsWith("error.")
				? t(error.message as any)
				: error.message;
		} else if (typeof error === "string") {
			errorMessage = error.startsWith("error.") ? t(error as any) : error;
		} else {
			errorMessage = String(
				error || t("error.unknown" as any, "Unknown error"),
			);
		}

		toast(title, {
			description: errorMessage,
			icon: <TriangleAlertIcon className="size-4 text-red-600" />,
			className:
				"!text-red-600 [&_[data-title]]:!text-red-600 [&_[data-description]]:!text-red-600",
		});
	};

	return { showSuccess, showError };
}
