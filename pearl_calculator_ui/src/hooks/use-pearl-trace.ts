import { calculatorService } from "@/services";
import { useToastNotifications } from "@/hooks/use-toast-notifications";
import type { GeneralConfig, PearlTraceResult } from "@/types/domain";

export function usePearlTrace() {
	const { showError } = useToastNotifications();

	const calculatePearlTrace = async (
		inputs: {
			red: number;
			blue: number;
			direction: string;
			pearlX: string;
			pearlZ: string;
			offsetX: string;
			offsetZ: string;
			cannonY: string;
			destX: string;
			destZ: string;
		},
		configData: GeneralConfig,
		version: string,
	): Promise<PearlTraceResult | null> => {
		try {
			const input = {
				redTnt: inputs.red,
				blueTnt: inputs.blue,
				pearlX: parseFloat(inputs.pearlX) || 0,
				pearlY: configData.pearl_y_position,
				pearlZ: parseFloat(inputs.pearlZ) || 0,
				pearlMotionX: 0,
				pearlMotionY: configData.pearl_y_motion,
				pearlMotionZ: 0,
				offsetX: parseFloat(inputs.offsetX) || 0,
				offsetZ: parseFloat(inputs.offsetZ) || 0,
				cannonY: parseFloat(inputs.cannonY) || 36,
				northWestTnt: configData.north_west_tnt,
				northEastTnt: configData.north_east_tnt,
				southWestTnt: configData.south_west_tnt,
				southEastTnt: configData.south_east_tnt,
				defaultRedDirection: configData.default_red_tnt_position,
				defaultBlueDirection: configData.default_blue_tnt_position,
				direction: inputs.direction,
				destinationX: parseFloat(inputs.destX) || 0,
				destinationZ: parseFloat(inputs.destZ) || 0,
				version: version,
			};

			const result = await calculatorService.calculatePearlTrace(input);
			return result;
		} catch (error) {
			console.error("Pearl trace calculation failed:", error);
			showError("Pearl Trace Error", error);
			return null;
		}
	};

	return { calculatePearlTrace };
}
