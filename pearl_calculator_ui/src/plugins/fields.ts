import type { FieldValue, InputValues, Vec3 } from "@/plugins/pearlcalc-plugin";
import type { Column, InputField } from "./localize";

export type RawValue =
	| string
	| boolean
	| [string, string]
	| { x: string; y: string; z: string };

export type RawValues = Record<string, RawValue | undefined>;

export interface FieldError {
	key: string;
	label: string;
	reason: "required" | "number" | "integer" | "range" | "option";
}

const text = (value: unknown) =>
	value === undefined || value === null ? "" : String(value);

function lookup(source: unknown, path: unknown): unknown {
	if (typeof path !== "string") return undefined;
	return path
		.split(".")
		.reduce<unknown>(
			(value, key) =>
				value !== null && typeof value === "object"
					? (value as Record<string, unknown>)[key]
					: undefined,
			source,
		);
}

export function initialRaw(field: InputField, scope: unknown): RawValue {
	const derived = field.from ? lookup(scope, field.from) : undefined;
	switch (field.type) {
		case "boolean":
			return typeof derived === "boolean" ? derived : (field.default ?? false);
		case "range": {
			const value = Array.isArray(derived) ? derived : field.default;
			return [text(value?.[0]), text(value?.[1])];
		}
		case "vec3": {
			const value = (
				derived && typeof derived === "object" ? derived : field.default
			) as Partial<Vec3> | undefined;
			return { x: text(value?.x), y: text(value?.y), z: text(value?.z) };
		}
		case "select":
			return text(derived ?? field.default ?? field.options[0]?.value);
		default:
			return text(derived ?? field.default);
	}
}

export function toRaw(field: InputField, value: unknown): RawValue | undefined {
	if (value === undefined || value === null) return undefined;
	switch (field.type) {
		case "boolean":
			return Boolean(value);
		case "range":
			return Array.isArray(value)
				? [text(value[0]), text(value[1])]
				: undefined;
		case "vec3": {
			const vector = value as Partial<Vec3>;
			return { x: text(vector.x), y: text(vector.y), z: text(vector.z) };
		}
		default:
			return text(value);
	}
}

type SelectOption = Extract<InputField, { type: "select" }>["options"][number];

const same = (left: unknown, right: unknown) =>
	JSON.stringify(left) === JSON.stringify(right);

function presetRaw(fields: InputField[], option: SelectOption | undefined) {
	const sets = option?.sets;
	if (!sets || typeof sets !== "object" || Array.isArray(sets)) return [];
	return Object.entries(sets).flatMap(([key, value]) => {
		const target = fields.find((field) => field.key === key);
		const raw = target ? toRaw(target, value) : undefined;
		return raw === undefined ? [] : [[key, raw] as const];
	});
}

function selectedOption(field: InputField, values: RawValues) {
	return field.type === "select"
		? field.options.find((option) => option.value === values[field.key])
		: undefined;
}

function withPresets(fields: InputField[], values: RawValues): RawValues {
	let next = values;
	for (const field of fields) {
		const preset = presetRaw(fields, selectedOption(field, next));
		if (preset.length > 0) next = { ...next, ...Object.fromEntries(preset) };
	}
	return next;
}

export function applyEdit(
	fields: InputField[],
	values: RawValues,
	key: string,
	value: RawValue,
): RawValues {
	let next: RawValues = { ...values, [key]: value };
	const matches = (option: SelectOption) =>
		presetRaw(fields, option).every(([target, raw]) => same(next[target], raw));
	for (const field of fields) {
		if (field.type !== "select" || field.key === key) continue;
		const current = selectedOption(field, next);
		const touched = presetRaw(fields, current).some(
			([target]) => target === key,
		);
		if (!current || !touched || matches(current)) continue;
		const fallback =
			field.options.find(
				(option) => presetRaw(fields, option).length > 0 && matches(option),
			) ??
			field.options.find((option) => presetRaw(fields, option).length === 0);
		if (fallback) next = { ...next, [field.key]: fallback.value };
	}
	return withPresets(fields, next);
}

export function resolveRaw(
	fields: InputField[],
	raw: RawValues | undefined,
	scope: unknown,
): RawValues {
	return withPresets(
		fields,
		Object.fromEntries(
			fields.map((field) => [
				field.key,
				raw?.[field.key] ?? initialRaw(field, scope),
			]),
		),
	);
}

function parseNumber(value: string) {
	const trimmed = value.trim();
	return trimmed === "" ? undefined : Number(trimmed);
}

export function normalize(
	fields: InputField[],
	raw: RawValues,
): { values: InputValues; errors: FieldError[] } {
	const values: InputValues = {};
	const errors: FieldError[] = [];
	const problem = (field: InputField, reason: FieldError["reason"]) =>
		errors.push({ key: field.key, label: field.label, reason });

	const number = (field: InputField, input: string, integer: boolean) => {
		const parsed = parseNumber(input);
		if (parsed === undefined) {
			if (field.required) problem(field, "required");
			return undefined;
		}
		if (!Number.isFinite(parsed)) {
			problem(field, "number");
			return undefined;
		}
		if (integer && !Number.isInteger(parsed)) {
			problem(field, "integer");
			return undefined;
		}
		return parsed;
	};

	for (const field of fields) {
		const value = raw[field.key];
		let result: FieldValue | undefined;
		switch (field.type) {
			case "boolean":
				result = value === true;
				break;
			case "number":
			case "integer": {
				const parsed = number(field, text(value), field.type === "integer");
				if (
					parsed !== undefined &&
					((field.min !== undefined && parsed < field.min) ||
						(field.max !== undefined && parsed > field.max))
				) {
					problem(field, "range");
				}
				result = parsed;
				break;
			}
			case "range": {
				const [low, high] = Array.isArray(value) ? value : ["", ""];
				const from = number(field, low, field.integer === true);
				const to = number(field, high, field.integer === true);
				if (from !== undefined && to !== undefined) {
					if (from > to) problem(field, "range");
					result = [from, to];
				}
				break;
			}
			case "vec3": {
				const vector =
					value && typeof value === "object" && !Array.isArray(value)
						? value
						: { x: "", y: "", z: "" };
				const x = number(field, vector.x, false);
				const y = number(field, vector.y, false);
				const z = number(field, vector.z, false);
				if (x !== undefined && y !== undefined && z !== undefined) {
					result = { x, y, z };
				}
				break;
			}
			case "select": {
				const choice = text(value);
				if (!field.options.some((option) => option.value === choice)) {
					if (field.required || choice !== "") problem(field, "option");
				} else {
					result = choice;
				}
				break;
			}
			default: {
				const content = text(value);
				if (field.required && content.trim() === "") problem(field, "required");
				result = content;
			}
		}
		if (result !== undefined) values[field.key] = result;
	}
	return { values, errors };
}

export function editedRaw(
	next: RawValues,
	resolved: RawValues,
	stored: RawValues | undefined,
): RawValues {
	const result: RawValues = { ...(stored ?? {}) };
	for (const [key, value] of Object.entries(next)) {
		if (!same(value, stored?.[key] ?? resolved[key])) {
			result[key] = value;
		}
	}
	return result;
}

export function editedValues(fields: InputField[], raw: RawValues) {
	return normalize(
		fields.filter((field) => raw[field.key] !== undefined),
		raw,
	).values;
}

export function rawFromValues(
	fields: InputField[],
	values: Record<string, unknown> | undefined,
): RawValues {
	if (!values) return {};
	const raw: RawValues = {};
	for (const field of fields) {
		const value = toRaw(field, values[field.key]);
		if (value !== undefined) raw[field.key] = value;
	}
	return raw;
}

export function formatNumber(column: Column, value: number) {
	const digits = column.digits;
	if (
		!Number.isFinite(value) ||
		typeof digits !== "number" ||
		!Number.isInteger(digits) ||
		digits < 0 ||
		digits > 20
	) {
		return String(value);
	}
	return column.format === "exp"
		? value.toExponential(digits)
		: value.toFixed(digits);
}
