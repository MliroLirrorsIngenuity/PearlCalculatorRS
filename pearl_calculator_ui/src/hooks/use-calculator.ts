import { calculatorService } from "@/services";
import { useState } from "react";
import type {
	CalculatorInputs,
	GeneralConfig,
	TNTResult,
} from "@/types/domain";

type CalculationResult =
	| { success: true; data: TNTResult[] }
	| { success: false; error: string };

export function useTNTCalculator() {
	const [isCalculating, setIsCalculating] = useState(false);

	const calculate = async (
		inputs: CalculatorInputs,
		config: GeneralConfig,
		version: string,
	): Promise<CalculationResult> => {
		if (!inputs.destX || !inputs.destZ) {
			return {
				success: false,
				error: "Missing Inputs: Please enter Destination X and Z coordinates",
			};
		}

		const parseOrConfig = (val: string, defaultVal: number) => {
			if (!val) return defaultVal;
			const parsed = parseFloat(val);
			return Number.isNaN(parsed) ? defaultVal : parsed;
		};

		const parseOrZero = (val: string) => {
			if (!val) return 0;
			const parsed = parseFloat(val);
			return Number.isNaN(parsed) ? 0 : parsed;
		};

		const destX = parseFloat(inputs.destX);
		const destZ = parseFloat(inputs.destZ);

		if (Number.isNaN(destX) || Number.isNaN(destZ)) {
			return {
				success: false,
				error: "Invalid Inputs: Destination coordinates must be valid numbers",
			};
		}

		setIsCalculating(true);
		try {
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
				northWestTnt: {
					x: config.north_west_tnt.x,
					y: config.north_west_tnt.y,
					z: config.north_west_tnt.z,
				},
				northEastTnt: {
					x: config.north_east_tnt.x,
					y: config.north_east_tnt.y,
					z: config.north_east_tnt.z,
				},
				southWestTnt: {
					x: config.south_west_tnt.x,
					y: config.south_west_tnt.y,
					z: config.south_west_tnt.z,
				},
				southEastTnt: {
					x: config.south_east_tnt.x,
					y: config.south_east_tnt.y,
					z: config.south_east_tnt.z,
				},
				defaultRedDirection: config.default_red_tnt_position,
				defaultBlueDirection: config.default_blue_tnt_position,
				destinationX: destX,
				destinationZ: destZ,
				maxTnt: config.max_tnt,
				maxTicks: 10000,
				maxDistance: 50.0,
				version: version,
			};

			console.log("Sending calculation input:", calculationInput);

			const results = await calculatorService.calculateTNTAmount(calculationInput);

			return { success: true, data: results };
		} catch (error) {
			console.error("Calculation failed:", error);
			return {
				success: false,
				error:
					typeof error === "string"
						? error
						: "An error occurred during calculation",
			};
		} finally {
			setIsCalculating(false);
		}
	};

	return { calculate, isCalculating };
}
