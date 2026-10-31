import { calculateBits, decodeWithMultiplier } from "@/lib/bit-decoder";
import type { BitsInput, BitsResult } from "@/plugins/pearlcalc-plugin";
import type { BitInputState } from "@/types/domain";

export class BitTemplateError extends Error {
	constructor(
		readonly errorKey: string | undefined,
		readonly errorParams: Record<string, string | number> | undefined,
	) {
		super(errorKey ?? "error.calculator.calc_failed");
	}
}

function multiplierValues(state: BitsInput["multiplier"]) {
	if (!state) return null;
	const values = state.sideValues.map((value) => Number.parseInt(value, 10));
	return values.every((value) => !Number.isNaN(value) && value > 0)
		? values
		: null;
}

export async function builtinBits(input: BitsInput): Promise<BitsResult> {
	let blue = input.tnt.blue;
	let red = input.tnt.red;
	const multiplier = { blue: [] as number[], red: [] as number[] };
	const values = multiplierValues(input.multiplier);
	if (input.multiplier && values && values.length > 0) {
		const blueResult = decodeWithMultiplier(
			values,
			input.multiplier.multiplier,
			blue,
		);
		const redResult = decodeWithMultiplier(
			values,
			input.multiplier.multiplier,
			red,
		);
		multiplier.blue = blueResult.activatedIndices;
		multiplier.red = redResult.activatedIndices;
		blue = blueResult.remainder;
		red = redResult.remainder;
	}
	const result = calculateBits(
		input.template as BitInputState,
		blue,
		red,
		input.direction,
	);
	if ("error" in result) {
		throw new BitTemplateError(result.error.errorKey, result.error.errorParams);
	}
	return { standard: result.result, multiplier };
}
