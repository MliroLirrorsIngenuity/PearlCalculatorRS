import type { BitsInput, SlotName } from "@/plugins/pearlcalc-plugin";
import type {
	CalculationInput,
	PearlTraceInput,
	RawTraceInput,
} from "@/services/interface";

const MAX_TICKS = 10000;
const MAX_DISTANCE = 1000;
const MAX_TNT = 1_000_000;
const MAX_GROUPS = 64;
const MAX_SIDES = 64;

const isRecord = (value: unknown): value is Record<string, unknown> =>
	value !== null && typeof value === "object" && !Array.isArray(value);

function record<T>(value: unknown): T {
	if (!isRecord(value)) throw new Error("Calculation input must be an object");
	return value as T;
}

function count(value: unknown, max: number, fallback: number) {
	return typeof value === "number" && Number.isFinite(value)
		? Math.min(max, Math.max(0, Math.floor(value)))
		: fallback;
}

function distance(value: unknown) {
	return typeof value === "number" && Number.isFinite(value)
		? Math.min(MAX_DISTANCE, Math.max(0, value))
		: 50;
}

export function boundSolve(value: unknown): CalculationInput {
	const input = record<Record<string, unknown>>(value);
	return {
		...input,
		maxTicks: count(input.maxTicks, MAX_TICKS, MAX_TICKS),
		maxDistance: distance(input.maxDistance),
		maxTnt: count(input.maxTnt, MAX_TNT, 0),
		...(input.maxVerticalTnt === undefined
			? {}
			: { maxVerticalTnt: count(input.maxVerticalTnt, MAX_TNT, 0) }),
	} as unknown as CalculationInput;
}

export function boundTrace(value: unknown): PearlTraceInput {
	const input = record<PearlTraceInput>(value);
	return {
		...input,
		maxTicks:
			input.maxTicks === undefined
				? undefined
				: count(input.maxTicks, MAX_TICKS, MAX_TICKS),
	};
}

export function boundRawTrace(value: unknown): RawTraceInput {
	const input = record<RawTraceInput>(value);
	if (!Array.isArray(input.tntGroups) || input.tntGroups.length > MAX_GROUPS) {
		throw new Error(`tntGroups must be an array of at most ${MAX_GROUPS}`);
	}
	return {
		...input,
		tntGroups: input.tntGroups.map((group) => ({
			...group,
			amount: count(group?.amount, MAX_TNT, 0),
		})),
	};
}

export function boundBits(value: unknown): BitsInput {
	const input = record<BitsInput>(value);
	const sides = (state: unknown) =>
		isRecord(state) &&
		count(state.sideCount, Number.MAX_SAFE_INTEGER, 0) <= MAX_SIDES &&
		(!Array.isArray(state.sideValues) || state.sideValues.length <= MAX_SIDES);
	if (
		!sides(input.template) ||
		(input.multiplier && !sides(input.multiplier))
	) {
		throw new Error(`Bit templates are limited to ${MAX_SIDES} sides`);
	}
	return input;
}

export const SLOT_BOUNDS: Partial<
	Record<SlotName, (value: unknown) => unknown>
> = {
	solve: boundSolve,
	trace: boundTrace,
	simulate: boundRawTrace,
	bits: boundBits,
};
