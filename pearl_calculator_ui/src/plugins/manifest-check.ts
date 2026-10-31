import type {
	Column,
	InputField,
	PanelMount,
	Permission,
	SlotName,
	SortKey,
	Text,
} from "@/plugins/pearlcalc-plugin";
import { PluginLoadError } from "./runtime/plugin-worker";
import type {
	RawPanelManifest,
	RawPluginManifest,
	RawToolManifest,
} from "./runtime/protocol";

const SLOTS: SlotName[] = [
	"solve",
	"trace",
	"simulate",
	"bits",
	"copy",
	"importConfig",
	"exportConfig",
];
const PERMISSIONS: Permission[] = ["network", "clipboard-read", "full-access"];
const MOUNTS: PanelMount[] = [
	"calculator.general",
	"calculator.config",
	"trace",
	"simulator.inputs",
	"simulator.results",
	"page",
];
const FIELD_TYPES = [
	"number",
	"integer",
	"boolean",
	"text",
	"select",
	"range",
	"vec3",
];
const PLUGIN_ID = /^[a-z0-9][a-z0-9._-]{1,63}$/i;
const ITEM_ID = /^[a-z0-9][a-z0-9._-]{0,63}$/i;
const KEY = /^[a-z0-9_][a-z0-9_.-]{0,63}$/i;
const FROM = /^[a-z0-9_]+(\.[a-z0-9_]+){0,7}$/i;
const FILE_TYPE = /^[a-z0-9]{1,16}$/;
const HOST = /^(https?|wss?):\/\/[a-z0-9-]+(\.[a-z0-9-]+)*(:\d{1,5})?$/i;
const SHORT = 80;
const LABEL = 200;
const LONG = 2000;

function fail(code: string, params?: Record<string, string | number>): never {
	throw new PluginLoadError({ code, params }, code);
}

export function wellFormed(value: string) {
	for (let index = 0; index < value.length; index++) {
		const code = value.charCodeAt(index);
		if (code >= 0xd800 && code <= 0xdbff) {
			const next = value.charCodeAt(index + 1);
			if (!(next >= 0xdc00 && next <= 0xdfff)) return false;
			index++;
		} else if (code >= 0xdc00 && code <= 0xdfff) {
			return false;
		}
	}
	return true;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
	value !== null && typeof value === "object" && !Array.isArray(value);

const isString = (value: unknown, max: number): value is string =>
	typeof value === "string" && value.length <= max && wellFormed(value);

const isText = (value: unknown, max: number): value is Text =>
	isString(value, max) ||
	(isRecord(value) &&
		Object.keys(value).length > 0 &&
		Object.keys(value).length <= 8 &&
		Object.entries(value).every(
			([key, entry]) => isString(key, 16) && isString(entry, max),
		));

const optionalText = (value: unknown, max: number) =>
	value === undefined || isText(value, max);

const isNumber = (value: unknown): value is number =>
	typeof value === "number" && Number.isFinite(value);

const optional = (value: unknown, check: (value: unknown) => boolean) =>
	value === undefined || check(value);

function list(value: unknown, max: number, code: string, where?: string) {
	if (value === undefined) return [];
	if (!Array.isArray(value)) fail(code, where ? { where } : undefined);
	if (value.length > max) fail("too_many", { where: where ?? code });
	return value as unknown[];
}

function validDefault(type: string, value: unknown) {
	switch (type) {
		case "number":
		case "integer":
			return isNumber(value);
		case "boolean":
			return typeof value === "boolean";
		case "range":
			return (
				Array.isArray(value) && value.length === 2 && value.every(isNumber)
			);
		case "vec3":
			return (
				isRecord(value) &&
				["x", "y", "z"].every((axis) => isNumber(value[axis]))
			);
		default:
			return isString(value, LONG);
	}
}

function checkFields(value: unknown, where: string): InputField[] {
	const seen = new Set<string>();
	return list(value, 200, "fields_not_array", where).map((entry) => {
		if (!isRecord(entry) || !isString(entry.key, 64) || !KEY.test(entry.key)) {
			return fail("field_key", { where });
		}
		const key = entry.key;
		if (seen.has(key)) fail("field_duplicate", { where, key });
		seen.add(key);
		if (!isText(entry.label, LABEL) || !optionalText(entry.description, LONG)) {
			fail("field_label", { where, key });
		}
		const type = entry.type;
		if (typeof type !== "string" || !FIELD_TYPES.includes(type)) {
			return fail("field_type", { where, key, type: String(type) });
		}
		if (
			!optional(entry.default, (item) => validDefault(type, item)) ||
			!optional(entry.min, isNumber) ||
			!optional(entry.max, isNumber) ||
			!optional(entry.step, isNumber) ||
			!optional(entry.required, (item) => typeof item === "boolean") ||
			!optional(entry.multiline, (item) => typeof item === "boolean") ||
			!optional(entry.integer, (item) => typeof item === "boolean") ||
			!optional(entry.from, (item) => isString(item, 120) && FROM.test(item))
		) {
			fail("field_type", { where, key, type });
		}
		const field: Record<string, unknown> = {
			key,
			label: entry.label,
			description: entry.description,
			type,
			required: entry.required,
			default: entry.default,
			from: entry.from,
			min: entry.min,
			max: entry.max,
			step: entry.step,
			multiline: entry.multiline,
			integer: entry.integer,
		};
		if (type === "select") {
			const options = list(entry.options, 500, "field_options", where);
			if (
				options.length === 0 ||
				options.some(
					(option) =>
						!isRecord(option) ||
						!isString(option.value, LABEL) ||
						!isText(option.label, LABEL),
				)
			) {
				fail("field_options", { where, key });
			}
			field.options = options.map((option) => {
				const item = option as Record<string, unknown>;
				return { value: item.value, label: item.label };
			});
		}
		return JSON.parse(JSON.stringify(field)) as InputField;
	});
}

function checkColumns(value: unknown, where: string): Column[] {
	return list(value, 100, "columns_not_array", where).map((entry) => {
		if (
			!isRecord(entry) ||
			!isString(entry.key, 64) ||
			!KEY.test(entry.key) ||
			!isText(entry.label, LABEL) ||
			!optional(
				entry.digits,
				(item) =>
					Number.isInteger(item) &&
					(item as number) >= 0 &&
					(item as number) <= 20,
			) ||
			!optional(entry.format, (item) => item === "fixed" || item === "exp") ||
			!optional(
				entry.width,
				(item) => isNumber(item) && item > 0 && item <= 100,
			) ||
			!optional(entry.hidden, (item) => typeof item === "boolean")
		) {
			return fail("column", { where });
		}
		return JSON.parse(
			JSON.stringify({
				key: entry.key,
				label: entry.label,
				digits: entry.digits,
				format: entry.format,
				width: entry.width,
				hidden: entry.hidden,
			}),
		) as Column;
	});
}

function checkSort(value: unknown, id: string): SortKey[] | undefined {
	if (value === undefined) return undefined;
	const keys = list(value, 10, "tool_sort", id);
	if (
		keys.some(
			(key) =>
				!(
					(isString(key, 64) && KEY.test(key)) ||
					(isRecord(key) &&
						isString(key.key, 64) &&
						KEY.test(key.key) &&
						optional(key.order, (item) => item === "asc" || item === "desc"))
				),
		)
	) {
		fail("tool_sort", { id });
	}
	return keys.map((key) =>
		typeof key === "string"
			? key
			: {
					key: (key as { key: string }).key,
					order: (key as { order?: "asc" | "desc" }).order,
				},
	);
}

const names = (value: unknown, max: number) =>
	Array.isArray(value) &&
	value.length <= max &&
	value.every((item) => isString(item, 64) && KEY.test(item));

function checkTools(value: unknown): RawToolManifest[] {
	const seen = new Set<string>();
	return list(value, 32, "tools_not_array").map((entry) => {
		if (
			!isRecord(entry) ||
			!isString(entry.id, 64) ||
			!ITEM_ID.test(entry.id)
		) {
			return fail("tool_id", {
				id: String(isRecord(entry) ? entry.id : entry),
			});
		}
		const id = entry.id;
		if (seen.has(id)) fail("tool_duplicate", { id });
		seen.add(id);
		if (!isText(entry.title, SHORT) || !optionalText(entry.description, LONG)) {
			fail("tool_title", { id });
		}
		const inputs = checkFields(entry.inputs, `tools.${id}.inputs`);
		const limit = entry.limit;
		if (
			!optional(
				limit,
				(item) =>
					(Number.isInteger(item) &&
						(item as number) >= 1 &&
						(item as number) <= 10000) ||
					(typeof item === "string" &&
						inputs.some((field) => field.key === item)),
			)
		) {
			fail("tool_limit", { id });
		}
		const has = isRecord(entry.has) ? entry.has : {};
		if (!names(entry.actions, 64)) fail("tool_id", { id });
		return {
			id,
			title: entry.title as Text,
			description: entry.description as Text | undefined,
			inputs,
			columns: checkColumns(entry.columns, `tools.${id}.columns`),
			sortBy: checkSort(entry.sortBy, id),
			limit: limit as number | string | undefined,
			has: {
				validate: has.validate === true,
				plan: has.plan === true,
				finalize: has.finalize === true,
				detail: has.detail === true,
				copy: has.copy === true,
			},
			actions: [...(entry.actions as string[])],
		};
	});
}

function checkPanels(value: unknown, toolIds: Set<string>): RawPanelManifest[] {
	const seen = new Set<string>();
	return list(value, 32, "panels_not_array").map((entry) => {
		if (
			!isRecord(entry) ||
			!isString(entry.id, 64) ||
			!ITEM_ID.test(entry.id)
		) {
			return fail("panel_id", {
				id: String(isRecord(entry) ? entry.id : entry),
			});
		}
		const id = entry.id;
		if (seen.has(id)) fail("panel_duplicate", { id });
		seen.add(id);
		const mount = entry.mount as PanelMount;
		if (!MOUNTS.includes(mount))
			fail("panel_mount", { id, mount: String(mount) });
		if (mount === "page" && toolIds.has(id)) fail("tool_duplicate", { id });
		const title =
			entry.title === "" || entry.title === undefined ? undefined : entry.title;
		if (
			mount === "page" ? !isText(title, SHORT) : !optionalText(title, SHORT)
		) {
			fail("panel_title", { id });
		}
		if (!names(entry.handlers, 128)) fail("panel_handlers", { id });
		return {
			id,
			mount,
			title: title as Text | undefined,
			hasState: entry.hasState === true,
			handlers: [...(entry.handlers as string[])],
		};
	});
}

export function checkManifest(value: unknown): RawPluginManifest {
	if (!isRecord(value)) return fail("no_default_export");
	if (value.apiVersion !== 1) {
		fail("api_version", { version: String(value.apiVersion) });
	}
	if (!isString(value.id, 64) || !PLUGIN_ID.test(value.id)) {
		fail("id", { id: String(value.id).slice(0, 64) });
	}
	if (
		!isText(value.name, SHORT) ||
		(typeof value.name === "string" && !value.name.trim())
	) {
		fail("name");
	}
	if (!isString(value.version, 32) || !value.version.trim()) fail("version");
	if (!optional(value.author, (item) => isString(item, SHORT))) fail("author");
	if (!optionalText(value.description, LONG)) fail("description");

	const declared = list(value.permissions, 3, "permissions");
	if (declared.some((entry) => !PERMISSIONS.includes(entry as Permission))) {
		fail("permissions");
	}
	const permissions = PERMISSIONS.filter((entry) => declared.includes(entry));
	const hosts = list(value.networkHosts, 32, "network_hosts");
	if (hosts.some((host) => !isString(host, 255) || !HOST.test(host))) {
		fail("network_hosts");
	}
	if (hosts.length > 0 && !permissions.includes("network")) {
		fail("network_hosts_permission");
	}
	if (value.hasMain === true && !permissions.includes("full-access")) {
		fail("main_permission");
	}
	if (!optional(value.physics, (item) => item === "custom")) {
		fail("physics", { physics: String(value.physics) });
	}
	const slots = list(value.slots, SLOTS.length, "slot_unknown");
	for (const slot of slots) {
		if (!SLOTS.includes(slot as SlotName))
			fail("slot_unknown", { slot: String(slot) });
	}
	const fileTypes = list(value.fileTypes, 20, "file_types");
	if (
		fileTypes.some((type) => typeof type !== "string" || !FILE_TYPE.test(type))
	) {
		fail("file_types");
	}
	const tools = checkTools(value.tools);
	return {
		apiVersion: 1,
		id: value.id as string,
		name: value.name as Text,
		version: (value.version as string).trim(),
		author: value.author as string | undefined,
		description: value.description as Text | undefined,
		permissions,
		networkHosts: permissions.includes("network") ? (hosts as string[]) : [],
		physics: value.physics as "custom" | undefined,
		fileTypes: fileTypes as string[],
		settings: checkFields(value.settings, "settings"),
		calculatorInputs: checkFields(value.calculatorInputs, "calculatorInputs"),
		simulatorInputs: checkFields(value.simulatorInputs, "simulatorInputs"),
		resultColumns: checkColumns(value.resultColumns, "resultColumns"),
		slots: Array.from(new Set(slots as SlotName[])),
		tools,
		panels: checkPanels(value.panels, new Set(tools.map((tool) => tool.id))),
		hasMain: value.hasMain === true,
	};
}
