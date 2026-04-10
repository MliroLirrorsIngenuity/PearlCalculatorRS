import { utilsRust } from "@/lib/utils-rust";
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
	return utilsRust.validate_bit_template(values);
}

export function decodeBitValue(
	values: number[],
	targetValue: number,
): BitDecodeResult {
	return utilsRust.decode_bit_value(values, targetValue);
}

export interface MultiplierDecodeResult {
	activatedIndices: number[];
	remainder: number;
}

export function decodeWithMultiplier(
	values: number[],
	multiplier: number,
	targetValue: number,
): MultiplierDecodeResult {
	return utilsRust.decode_with_multiplier(values, multiplier, targetValue);
}

export function getDirectionBits(
	masks: MaskGroup[],
	direction: string,
): [boolean, boolean] {
	return utilsRust.get_direction_bits(masks, direction);
}

export function parseTemplateValues(state: BitInputState): number[] | null {
	return utilsRust.parse_template_values(state);
}

export function calculateBits(
	state: BitInputState,
	blueTNT: number,
	redTNT: number,
	direction: string,
): { result: BitCalculationOutput } | { error: BitValidationResult } {
	return utilsRust.calculate_bits(state, blueTNT, redTNT, direction);
}
