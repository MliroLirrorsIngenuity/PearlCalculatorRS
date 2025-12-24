import { useTranslation } from "react-i18next";
import { useToastNotifications } from "@/hooks/use-toast-notifications";
import { calculatorService } from "@/services";
import type { GeneralConfig, PearlTraceResult } from "@/types/domain";
import { CoercedNumberSchema } from "@/lib/schemas";

export function usePearlTrace() {
	const { t } = useTranslation();
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
			const parse = (v: string) => CoercedNumberSchema.parse(v);

			const input = {
				redTnt: inputs.red,
				blueTnt: inputs.blue,
				pearlX: parse(inputs.pearlX),
				pearlY: configData.pearl_y_position,
				pearlZ: parse(inputs.pearlZ),
				pearlMotionX: 0,
				pearlMotionY: configData.pearl_y_motion,
				pearlMotionZ: 0,
				offsetX: parse(inputs.offsetX),
				offsetZ: parse(inputs.offsetZ),
				cannonY: parse(inputs.cannonY),
				northWestTnt: configData.north_west_tnt,
				northEastTnt: configData.north_east_tnt,
				southWestTnt: configData.south_west_tnt,
				southEastTnt: configData.south_east_tnt,
				defaultRedDirection: configData.default_red_tnt_position,
				defaultBlueDirection: configData.default_blue_tnt_position,
				direction: inputs.direction,
				destinationX: parse(inputs.destX),
				destinationZ: parse(inputs.destZ),
				version: version,
			};

			const result = await calculatorService.calculatePearlTrace(input);
			return result;
		} catch (error) {
			console.error("Pearl trace calculation failed:", error);
			showError(t("error.pearl_trace"), error);
			return null;
		}
	};

	return { calculatePearlTrace };
}
