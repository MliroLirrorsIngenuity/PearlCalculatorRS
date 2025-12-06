import { calculatorService } from "@/services";
import { useToastNotifications } from "@/hooks/use-toast-notifications";
import type { PearlTraceResult, SimulatorConfig } from "@/types/domain";

export function useSimulatorTrace() {
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

				tntGroups: [
					{
						x: config.tntA.pos.x,
						y: config.tntA.pos.y,
						z: config.tntA.pos.z,
						amount: config.tntA.amount
					},
					{
						x: config.tntB.pos.x,
						y: config.tntB.pos.y,
						z: config.tntB.pos.z,
						amount: config.tntB.amount
					}
				],

				version: version,
			};

			return await calculatorService.calculateRawTrace(input);
		} catch (error) {
			console.error("Pearl trace calculation failed:", error);
			showError("Pearl Trace Error", error);
			return null;
		}
	};

	return { calculateSimulatorTrace };
}
