import { useTranslation } from "react-i18next";
import { useToastNotifications } from "@/hooks/use-toast-notifications";
import { copyText } from "@/plugins/copy";
import { calculatorService } from "@/services";

export type TraceView = "trajectory" | "momentum";

export function useTracePointCopy() {
	const { t } = useTranslation();
	const { showSuccess, showError } = useToastNotifications();

	return async (
		tick: number,
		view: TraceView,
		point: { X: number; Y: number; Z: number },
	) => {
		const text = [point.X, point.Y, point.Z]
			.map((value) => value.toFixed(10))
			.join(" ");
		try {
			const output = await copyText("trace", text, {
				tick,
				view,
				x: point.X,
				y: point.Y,
				z: point.Z,
			});
			await calculatorService.copyToClipboard(output);
			showSuccess(t(`trace.copied_${view}`, { tick }));
		} catch (error) {
			showError(t("trace.copy_failed"), error);
		}
	};
}
