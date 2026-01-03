import { useState } from "react";
import { calculatorService } from "@/services";
import type {
	CalculatorInputs,
	GeneralConfig,
	TNTResult,
} from "@/types/domain";
import { z } from "zod";
import { CoercedNumberSchema } from "@/lib/schemas";
import { toBackendMode } from "@/lib/config-utils";
import type { CannonMode } from "@/types/domain";

type CalculationResult =
	| { success: true; data: TNTResult[] }
	| { success: false; error: string };

export function useTNTCalculator() {
	const [isCalculating, setIsCalculating] = useState(false);

	const calculate = async (
		inputs: CalculatorInputs,
		config: GeneralConfig,
		version: string,
		mode: CannonMode,
	): Promise<CalculationResult> => {
		const DestSchema = z.object({
			destX: z.coerce.number(),
			destZ: z.coerce.number(),
		});

		const destResult = DestSchema.safeParse(inputs);
		if (!destResult.success) {
			return {
				success: false,
				error: "Invalid Inputs: Destination coordinates must be valid numbers",
			};
		}

		const { destX, destZ } = destResult.data;

		if (!inputs.destX || !inputs.destZ) {
			return {
				success: false,
				error: "Missing Inputs: Please enter Destination X and Z coordinates",
			};
		}

		const parseOrConfig = (val: string, defaultVal: number) => {
			if (!val) return defaultVal;
			const res = z.coerce.number().safeParse(val);
			return res.success ? res.data : defaultVal;
		};

		const parseOrZero = (val: string) => {
			const res = CoercedNumberSchema.safeParse(val);
			return res.success ? res.data : 0;
		};

		setIsCalculating(true);
		try {
			const verticalTnt = config.vertical_tnt;
			const backendMode = toBackendMode(mode);

			const calculationInput = {
				pearlX: parseOrConfig(inputs.pearlX, config.pearl_x_position),
				pearlY: config.pearl_y_position,
				pearlZ: parseOrConfig(inputs.pearlZ, config.pearl_z_position),
				pearlMotionX: 0.0,
				pearlMotionY: config.pearl_y_motion,
				pearlMotionZ: 0.0,
				offsetX: parseOrZero(inputs.offsetX),
				offsetZ: parseOrZero(inputs.offsetZ),
				cannonY: parseOrConfig(
					inputs.cannonY,
					Math.floor(config.pearl_y_position),
				),
				northWestTnt: config.north_west_tnt,
				northEastTnt: config.north_east_tnt,
				southWestTnt: config.south_west_tnt,
				southEastTnt: config.south_east_tnt,
				defaultRedDirection: config.default_red_tnt_position,
				defaultBlueDirection: config.default_blue_tnt_position,
				destinationX: destX,
				destinationY: inputs.destY ? parseFloat(inputs.destY) || 0 : 0,
				destinationZ: destZ,
				maxTnt: config.max_tnt,
				maxTicks: 10000,
				maxDistance: 50.0,
				version: version,
				mode: backendMode,
				verticalTnt: verticalTnt,
			};

			console.log("Sending calculation input:", calculationInput);

			const results =
				await calculatorService.calculateTNTAmount(calculationInput);

			return { success: true, data: results };
		} catch (error) {
			console.error("Calculation failed:", error);
			const msg = error instanceof Error ? error.message : "An error occurred";
			return {
				success: false,
				error: typeof error === "string" ? error : msg,
			};
		} finally {
			setIsCalculating(false);
		}
	};

	return { calculate, isCalculating };
}
