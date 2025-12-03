import { TriangleAlertIcon } from "lucide-react";
import { toast } from "sonner";

export function useToastNotifications() {
	const showSuccess = (message: string) => {
		toast.success(message);
	};

	const showError = (title: string, error?: unknown) => {
		const errorMessage =
			error instanceof Error
				? error.message
				: typeof error === "string"
					? error
					: String(error || "Unknown error");

		toast(title, {
			description: errorMessage,
			icon: <TriangleAlertIcon className="size-4 text-red-600" />,
			className:
				"!text-red-600 [&_[data-title]]:!text-red-600 [&_[data-description]]:!text-red-600",
		});
	};

	return { showSuccess, showError };
}
