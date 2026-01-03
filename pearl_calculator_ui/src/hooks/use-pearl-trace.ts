import { useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { useConfig } from "@/context/ConfigContext";
import { useConfigurationState } from "@/context/ConfigurationStateContext";
import { useToastNotifications } from "@/hooks/use-toast-notifications";
import { CoercedNumberSchema } from "@/lib/schemas";
import { toBackendMode } from "@/lib/config-utils";
import { calculatorService } from "@/services";
import type { PearlTraceResult } from "@/types/domain";

export interface PearlTraceInputs {
	pearlX: string;
	pearlZ: string;
	offsetX: string;
	offsetZ: string;
	cannonY: string;
	destX: string;
	destZ: string;
}

export function usePearlTrace() {
	const { t } = useTranslation();
	const { showError } = useToastNotifications();
	const { configData, version } = useConfig();
	const { calculationMode } = useConfigurationState();
	const [loading, setLoading] = useState(false);

	const calculatePearlTrace = async (
		inputs: PearlTraceInputs,
		tntResult: {
			red: number;
			blue: number;
			vertical?: number;
			direction: string;
		},
	): Promise<PearlTraceResult | null> => {
		const parseOrConfig = (val: string, defaultVal: number) => {
			if (!val) return defaultVal;
			const res = z.coerce.number().safeParse(val);
			return res.success ? res.data : defaultVal;
		};

		const parseOrZero = (val: string) => {
			const res = CoercedNumberSchema.safeParse(val);
			return res.success ? res.data : 0;
		};

		setLoading(true);
		try {
			const traceInput = {
				pearlX: parseOrConfig(inputs.pearlX, configData.pearl_x_position),
				pearlY: configData.pearl_y_position,
				pearlZ: parseOrConfig(inputs.pearlZ, configData.pearl_z_position),
				pearlMotionX: 0,
				pearlMotionY: configData.pearl_y_motion,
				pearlMotionZ: 0,
				offsetX: parseOrZero(inputs.offsetX),
				offsetZ: parseOrZero(inputs.offsetZ),
				cannonY: parseOrConfig(
					inputs.cannonY,
					Math.floor(configData.pearl_y_position),
				),

				mode: toBackendMode(calculationMode),

				northWestTnt: configData.north_west_tnt,
				northEastTnt: configData.north_east_tnt,
				southWestTnt: configData.south_west_tnt,
				southEastTnt: configData.south_east_tnt,

				verticalTntAmount: tntResult.vertical,
				verticalTnt: configData.vertical_tnt,

				defaultRedDirection: configData.default_red_tnt_position,
				defaultBlueDirection: configData.default_blue_tnt_position,
				destinationX: parseFloat(inputs.destX) || 0,
				destinationZ: parseFloat(inputs.destZ) || 0,
				redTnt: tntResult.red,
				blueTnt: tntResult.blue,
				direction: tntResult.direction,
				version: version,
			};

			console.log("Sending trace input:", traceInput);

			const traceResult =
				await calculatorService.calculatePearlTrace(traceInput);
			return traceResult;
		} catch (error) {
			console.error("Pearl trace calculation failed:", error);
			showError(t("error.calculator.pearl_trace"), error);
			return null;
		} finally {
			setLoading(false);
		}
	};

	return { calculatePearlTrace, loading };
}
