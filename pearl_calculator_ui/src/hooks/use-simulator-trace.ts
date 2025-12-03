import { invoke } from "@tauri-apps/api/core";
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
				redTnt: config.tntA.amount,
				blueTnt: config.tntB.amount,
				pearlX: config.pearl.pos.x,
				pearlY: config.pearl.pos.y,
				pearlZ: config.pearl.pos.z,
				pearlMotionX: config.pearl.momentum.x,
				pearlMotionY: config.pearl.momentum.y,
				pearlMotionZ: config.pearl.momentum.z,
				offsetX: 0,
				offsetZ: 0,
				cannonY: 0,

				southEastTnt: config.tntA.pos,

				northWestTnt: config.tntB.pos,

				northEastTnt: { x: 0, y: 0, z: 0 },
				southWestTnt: { x: 0, y: 0, z: 0 },

				defaultRedDirection: "SouthEast",
				defaultBlueDirection: "NorthWest",
				direction: "SouthEast",
				destinationX: 0,
				destinationZ: 0,
				version: version,
			};

			const result: PearlTraceResult = await invoke(
				"calculate_pearl_trace_command",
				{ input },
			);
			return result;
		} catch (error) {
			console.error("Pearl trace calculation failed:", error);
			showError("Pearl Trace Error", error);
			return null;
		}
	};

	return { calculateSimulatorTrace };
}
