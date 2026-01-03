import type {
	BitInputState,
	BitTemplateConfig,
	MaskGroup,
	MultiplierBitInputState,
	MultiplierConfig,
} from "@/types/domain";

import {
	BitTemplateConfigSchema,
	CoercedNumberSchema,
	MultiplierConfigSchema,
} from "@/lib/schemas";

export function configToInputState(
	config: BitTemplateConfig | null,
): BitInputState | undefined {
	if (!config) return undefined;

	const masks: MaskGroup[] = [
		{ bits: ["0", "0"], direction: config.DirectionMasks["00"] || "" },
		{ bits: ["0", "1"], direction: config.DirectionMasks["01"] || "" },
		{ bits: ["1", "0"], direction: config.DirectionMasks["10"] || "" },
		{ bits: ["1", "1"], direction: config.DirectionMasks["11"] || "" },
	];

	return {
		sideCount: config.SideMode,
		masks,
		sideValues: [...config.RedValues]
			.reverse()
			.map((v) => (v === 0 ? "" : v.toString())),
		isSwapped: config.IsRedArrowCenter,
	};
}

export function inputStateToConfig(state: BitInputState): BitTemplateConfig {
	const directionMasks: BitTemplateConfig["DirectionMasks"] = {};
	for (const mask of state.masks) {
		const key = mask.bits.join("") as "00" | "01" | "10" | "11";
		if (mask.direction) {
			directionMasks[key] =
				mask.direction as BitTemplateConfig["DirectionMasks"]["00"];
		}
	}

	const config = {
		SideMode: state.sideCount,
		DirectionMasks: directionMasks,
		RedValues: state.sideValues
			.map((v) => CoercedNumberSchema.parse(v))
			.reverse(),
		IsRedArrowCenter: state.isSwapped,
	};

	return BitTemplateConfigSchema.parse(config);
}

export function configToMultiplierInputState(
	config: MultiplierConfig | null,
): MultiplierBitInputState | undefined {
	if (!config) return undefined;

	return {
		sideCount: config.MultiplierSideMode,
		sideValues: config.MultiplierValues.map((v) =>
			v === 0 ? "" : v.toString(),
		).reverse(),
		multiplier: config.Multiplier,
		isSwapped: config.MultiplierIsSwapped,
	};
}

export function inputStateToMultiplierConfig(
	state: MultiplierBitInputState,
): MultiplierConfig {
	return MultiplierConfigSchema.parse({
		MultiplierSideMode: state.sideCount,
		MultiplierValues: state.sideValues
			.map((v) => parseInt(v, 10) || 0)
			.reverse(),
		Multiplier: state.multiplier,
		MultiplierIsSwapped: state.isSwapped,
	});
}
