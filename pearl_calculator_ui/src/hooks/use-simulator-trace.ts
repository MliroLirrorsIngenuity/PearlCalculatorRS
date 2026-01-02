import { useTranslation } from "react-i18next";
import { useToastNotifications } from "@/hooks/use-toast-notifications";
import { calculatorService } from "@/services";
import type { PearlTraceResult, SimulatorConfig } from "@/types/domain";

export function useSimulatorTrace() {
	const { t } = useTranslation();
	const { showError } = useToastNotifications();

	const calculateSimulatorTrace = async (
		config: SimulatorConfig,
		version: string = "Post1212",
	): Promise<PearlTraceResult | null> => {
		try {
			const input = {
				pearlX: config.pearl.pos.x,
				pearlY: config.pearl.pos.y,
				pearlZ: config.pearl.pos.z,
				pearlMotionX: config.pearl.momentum.x,
				pearlMotionY: config.pearl.momentum.y,
				pearlMotionZ: config.pearl.momentum.z,

				tntGroups: (["tntA", "tntB", "tntC", "tntD"] as const).map((key) => ({
					x: config[key].pos.x,
					y: config[key].pos.y,
					z: config[key].pos.z,
					amount: config[key].amount,
				})),

				version: version,
			};

			return await calculatorService.calculateRawTrace(input);
		} catch (error) {
			console.error("Pearl trace calculation failed:", error);
			showError(t("error.calculator.pearl_trace"), error);
			return null;
		}
	};

	return { calculateSimulatorTrace };
}
