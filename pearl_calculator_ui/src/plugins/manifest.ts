import type { SlotName } from "@/plugins/pearlcalc-plugin";
import {
	currentLocale,
	localize,
	localizeColumn,
	localizeField,
} from "./localize";
import type { PluginManifest, RawPluginManifest } from "./runtime/protocol";

export const SLOT_NAMES: SlotName[] = [
	"solve",
	"trace",
	"simulate",
	"bits",
	"copy",
	"importConfig",
	"exportConfig",
];

const PHYSICS_SLOTS: SlotName[] = ["solve", "trace", "simulate"];

export function missingPhysicsSlots(manifest: PluginManifest) {
	return manifest.physics === "custom"
		? PHYSICS_SLOTS.filter((slot) => !manifest.slots.includes(slot))
		: [];
}

export const PLUGIN_DOCS_URL =
	"https://github.com/MliroLirrorsIngenuity/PearlCalculatorRS/blob/main/PLUGINS.md";

export function pluginToolPath(pluginId: string, toolId: string) {
	return `/tools/${encodeURIComponent(pluginId)}/${encodeURIComponent(toolId)}`;
}

const MAX_NAME_LENGTH = 60;

export function localizeManifest(
	raw: RawPluginManifest,
	locale = currentLocale(),
): PluginManifest {
	const fields = (list: RawPluginManifest["settings"]) =>
		list.map((field) => localizeField(field, locale));
	return {
		...raw,
		name: localize(raw.name, locale).slice(0, MAX_NAME_LENGTH),
		description:
			raw.description === undefined
				? undefined
				: localize(raw.description, locale),
		settings: fields(raw.settings),
		calculatorInputs: fields(raw.calculatorInputs),
		simulatorInputs: fields(raw.simulatorInputs),
		resultColumns: raw.resultColumns.map((column) =>
			localizeColumn(column, locale),
		),
		tools: raw.tools.map((tool) => ({
			...tool,
			title: localize(tool.title, locale),
			description:
				tool.description === undefined
					? undefined
					: localize(tool.description, locale),
			inputs: fields(tool.inputs),
			columns: tool.columns.map((column) => localizeColumn(column, locale)),
		})),
		panels: raw.panels.map((panel) => ({
			...panel,
			title:
				panel.title === undefined ? undefined : localize(panel.title, locale),
		})),
	};
}
