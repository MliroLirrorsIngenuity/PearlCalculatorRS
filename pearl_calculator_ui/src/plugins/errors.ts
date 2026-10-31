import i18n from "i18next";
import { toast } from "sonner";
import { toastError } from "@/hooks/use-toast-notifications";
import { PluginLoadError } from "./runtime/plugin-worker";

export function describePluginError(error: unknown) {
	if (error instanceof PluginLoadError) {
		const { code, params } = error.error;
		if (code === "load_failed") return error.message;
		const key = `plugins.manifest_errors.${code}`;
		return i18n.exists(key)
			? String(i18n.t(key as "plugins.manifest_errors.timeout", params))
			: code;
	}
	return error instanceof Error ? error.message : String(error);
}

export function toastPluginError(title: string, error: unknown) {
	toastError(title, describePluginError(error));
}

export function toastEmbeddedFailures(
	failures: { id: string; error: unknown }[],
) {
	for (const failure of failures) {
		toastPluginError(
			i18n.t("plugins.toast_embedded_failed", { id: failure.id }),
			failure.error,
		);
	}
}

export function noticeWizardPlugins(count: number) {
	if (count > 0) toast.info(i18n.t("plugins.wizard_carried", { count }));
}
