import type { CalculatorInputs, CannonMode } from "@/types/domain";

const isLongRange = (mode: string) =>
	mode === "Vector3D" || mode === "Accumulation";

export function defaultTickRange(mode: string): [number, number] {
	return isLongRange(mode) ? [0, 100] : [0, 20];
}

export function defaultDistanceRange(mode: string): [number, number] {
	return isLongRange(mode) ? [0, 50] : [0, 20];
}

const sameRange = (a: number[], b: number[]) => a[0] === b[0] && a[1] === b[1];

export function hasCustomFilters(inputs: CalculatorInputs, mode: CannonMode) {
	if (inputs.planeInterceptY) return false;
	return (
		!sameRange(inputs.tickRange, defaultTickRange(mode)) ||
		!sameRange(inputs.distanceRange, defaultDistanceRange(mode))
	);
}

export function targetHeight(inputs: CalculatorInputs, mode: CannonMode) {
	if (mode !== "Vector3D" && !inputs.planeInterceptY) return undefined;
	const value = parseFloat(inputs.destY ?? "");
	return Number.isFinite(value) ? value : undefined;
}
