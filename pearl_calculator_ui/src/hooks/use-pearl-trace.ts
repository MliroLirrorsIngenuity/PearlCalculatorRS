import { useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { useConfig } from "@/context/ConfigContext";
import { useConfigurationState } from "@/context/ConfigurationStateContext";
import { useToastNotifications } from "@/hooks/use-toast-notifications";
import { toBackendMode } from "@/lib/config-utils";
import { PearlTraceResultSchema } from "@/lib/schemas";
import { runSlot } from "@/plugins/pipeline";
import { calculatorService } from "@/services";
import type { PearlTraceInput } from "@/services/interface";
import type {
	CannonMode,
	GeneralConfig,
	PearlTraceResult,
	PearlVersion,
} from "@/types/domain";

export interface PearlTraceInputs {
	pearlX: string;
	pearlZ: string;
	cannonY: string;
	destX: string;
	destY?: string;
	destZ: string;
	planeInterceptY?: boolean;
}

export interface TraceTntSelection {
	red: number;
	blue: number;
	vertical?: number;
	direction: string;
	tick?: number;
}

function parseOr(value: string, fallback: number) {
	if (!value) return fallback;
	const parsed = z.coerce.number().safeParse(value);
	return parsed.success ? parsed.data : fallback;
}

export function buildPearlTraceInput(
	inputs: PearlTraceInputs,
	tnt: TraceTntSelection,
	config: GeneralConfig,
	version: PearlVersion,
	mode: CannonMode,
): PearlTraceInput {
	const isVector = mode === "Vector3D";
	return {
		pearlX: parseOr(inputs.pearlX, config.pearl_x_position),
		pearlY: config.pearl_y_position,
		pearlZ: parseOr(inputs.pearlZ, config.pearl_z_position),
		pearlMotionX: config.pearl_x_motion,
		pearlMotionY: config.pearl_y_motion,
		pearlMotionZ: config.pearl_z_motion,
		cannonY: parseOr(inputs.cannonY, Math.floor(config.pearl_y_position)),
		mode: toBackendMode(mode),
		northWestTnt: config.north_west_tnt,
		northEastTnt: config.north_east_tnt,
		southWestTnt: config.south_west_tnt,
		southEastTnt: config.south_east_tnt,
		verticalTntAmount: isVector ? tnt.vertical : undefined,
		verticalTnt:
			isVector && config.vertical_tnt ? config.vertical_tnt : undefined,
		defaultRedDirection: config.default_red_tnt_position,
		defaultBlueDirection: config.default_blue_tnt_position,
		destinationX: parseFloat(inputs.destX) || 0,
		destinationY:
			inputs.planeInterceptY && inputs.destY
				? parseFloat(inputs.destY) || 0
				: undefined,
		destinationZ: parseFloat(inputs.destZ) || 0,
		redTnt: tnt.red,
		blueTnt: tnt.blue,
		direction: tnt.direction,
		version,
	};
}

export function tracePearl(input: PearlTraceInput) {
	return runSlot(
		"trace",
		input,
		(value) => calculatorService.calculatePearlTrace(value),
		(output) => PearlTraceResultSchema.parse(output),
	);
}

export function usePearlTrace() {
	const { t } = useTranslation();
	const { showError } = useToastNotifications();
	const { configData, version } = useConfig();
	const { calculationMode } = useConfigurationState();
	const [loading, setLoading] = useState(false);

	const calculatePearlTrace = async (
		inputs: PearlTraceInputs,
		tntResult: TraceTntSelection,
	): Promise<PearlTraceResult | null> => {
		setLoading(true);
		try {
			return await tracePearl(
				buildPearlTraceInput(
					inputs,
					tntResult,
					configData,
					version,
					calculationMode,
				),
			);
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
