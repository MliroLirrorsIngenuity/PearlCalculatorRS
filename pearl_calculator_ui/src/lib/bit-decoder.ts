import type { BitInputState, MaskGroup } from "@/types/domain";

export interface BitValidationResult {
	isValid: boolean;
	errorKey?: string;
	errorParams?: Record<string, string | number>;
}

export interface BitDecodeResult {
	activatedBits: number[];
	activatedIndices: number[];
}

export interface BitCalculationOutput {
	blue: number[];
	red: number[];
	direction: [boolean, boolean];
}

export function validateBitTemplate(values: number[]): BitValidationResult {
	if (values.length === 0) {
		return { isValid: false, errorKey: "calculator.bit_validation_empty" };
	}

	const sorted = [...values].sort((a, b) => a - b);

	if (sorted[0] !== 1) {
		return { isValid: false, errorKey: "calculator.bit_validation_no_unit" };
	}

	let currentMaxReach = 0;
	for (const num of sorted) {
		if (num > currentMaxReach + 1) {
			return {
				isValid: false,
				errorKey: "calculator.bit_validation_gap",
				errorParams: { gap: currentMaxReach + 1, sum: currentMaxReach },
			};
		}
		currentMaxReach += num;
	}

	return { isValid: true };
}

export function decodeBitValue(
	values: number[],
	targetValue: number,
): BitDecodeResult {
	const maxCapacity = values.reduce((sum, v) => sum + v, 0);

	if (targetValue > maxCapacity || targetValue < 0) {
		return { activatedBits: [], activatedIndices: [] };
	}

	const indexed = values.map((val, idx) => ({ val, idx }));
	indexed.sort((a, b) => b.val - a.val);

	const activatedBits: number[] = [];
	const activatedIndices: number[] = [];
	let remaining = targetValue;

	for (const { val, idx } of indexed) {
		if (remaining >= val) {
			remaining -= val;
			activatedBits.push(val);
			activatedIndices.push(idx);
		}
		if (remaining === 0) break;
	}

	return { activatedBits, activatedIndices };
}

export function getDirectionBits(
	masks: MaskGroup[],
	direction: string,
): [boolean, boolean] {
	for (const mask of masks) {
		if (mask.direction === direction) {
			return [mask.bits[0] === "1", mask.bits[1] === "1"];
		}
	}
	return [false, false];
}

export function parseTemplateValues(state: BitInputState): number[] | null {
	const values: number[] = [];
	for (const v of state.sideValues) {
		const num = parseInt(v, 10);
		if (isNaN(num) || num <= 0) {
			return null;
		}
		values.push(num);
	}
	return values;
}

export function calculateBits(
	state: BitInputState,
	blueTNT: number,
	redTNT: number,
	direction: string,
): { result: BitCalculationOutput } | { error: BitValidationResult } {
	const values = parseTemplateValues(state);

	if (!values) {
		return {
			error: { isValid: false, errorKey: "calculator.bit_validation_invalid" },
		};
	}

	const validation = validateBitTemplate(values);
	if (!validation.isValid) {
		return { error: validation };
	}

	const blueResult = decodeBitValue(values, blueTNT);
	const redResult = decodeBitValue(values, redTNT);
	const directionBits = getDirectionBits(state.masks, direction);

	return {
		result: {
			blue: blueResult.activatedIndices,
			red: redResult.activatedIndices,
			direction: directionBits,
		},
	};
}
