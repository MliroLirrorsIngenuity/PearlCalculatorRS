import i18n from "i18next";
import type * as Api from "@/plugins/pearlcalc-plugin";

type LocalizeField<F> = F extends Api.SelectField
	? Omit<F, "label" | "description" | "options"> & {
			label: string;
			description?: string;
			options: { value: string; label: string }[];
		}
	: F extends unknown
		? Omit<F, "label" | "description"> & { label: string; description?: string }
		: never;

export type InputField = LocalizeField<Api.InputField>;
export type Column = Omit<Api.Column, "label"> & { label: string };

export const hasOwn = (target: object, key: PropertyKey) =>
	Object.getOwnPropertyDescriptor(target, key) !== undefined;

export function currentLocale(): Api.Locale {
	return i18n.language?.startsWith("zh") ? "zh" : "en";
}

export function localize(text: unknown, locale = currentLocale()): string {
	if (typeof text === "string") return text;
	if (typeof text === "number") return String(text);
	if (!text || typeof text !== "object") return "";
	const map = text as Record<string, unknown>;
	const pick = [locale, "en", "zh"].find(
		(key) => hasOwn(map, key) && typeof map[key] === "string",
	);
	const value = pick ? map[pick] : Object.values(map)[0];
	return typeof value === "string" ? value : "";
}

const optional = (text: unknown, locale: Api.Locale) =>
	text === undefined ? undefined : localize(text, locale);

export function localizeField(
	field: Api.InputField,
	locale = currentLocale(),
): InputField {
	const base = {
		...field,
		label: localize(field.label, locale),
		description: optional(field.description, locale),
	};
	return field.type === "select"
		? ({
				...base,
				options: (field.options ?? []).map((option) => ({
					value: String(option.value),
					label: localize(option.label, locale),
				})),
			} as InputField)
		: (base as InputField);
}

export function localizeColumn(
	column: Api.Column,
	locale = currentLocale(),
): Column {
	return { ...column, label: localize(column.label, locale) };
}
