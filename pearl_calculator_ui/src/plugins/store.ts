import i18n from "i18next";
import { useSyncExternalStore } from "react";
import type {
	CalculatorFields,
	CannonConfig,
	CannonMode,
	InputValues,
	JsonValue,
	PearlVersion,
	SlotName,
} from "@/plugins/pearlcalc-plugin";
import {
	editedValues,
	normalize,
	type RawValues,
	rawFromValues,
	resolveRaw,
} from "./fields";
import { currentLocale } from "./localize";
import { localizeManifest } from "./manifest";
import type {
	CallContext,
	LogLevel,
	PluginManifest,
	RawPluginManifest,
} from "./runtime/protocol";
import type { Row } from "./runtime/shared";

export interface LogEntry {
	id: number;
	level: LogLevel;
	text: string;
	at: number;
}

export type Consent = "granted" | "pending" | "declined";

export type PluginData = Record<string, JsonValue>;

export interface PluginRecord {
	uid: string;
	rawManifest: RawPluginManifest;
	manifest: PluginManifest;
	source: string;
	sha256: string;
	declaredSha256?: string;
	active: boolean;
	consent: Consent;
	settings: RawValues;
	calculatorInputs: RawValues;
	simulatorInputs: RawValues;
	toolInputs: Record<string, RawValues>;
	data: PluginData;
	logs: LogEntry[];
}

export interface EmbeddedParams {
	settings?: Record<string, unknown>;
	calculatorInputs?: Record<string, unknown>;
	simulatorInputs?: Record<string, unknown>;
	tools?: Record<string, Record<string, unknown>>;
	data?: PluginData;
}

export type ToolRunStatus = "running" | "done" | "stopped" | "error";

export interface ToolRun {
	status: ToolRunStatus;
	rows: Row[];
	progress: number;
	shardsDone: number;
	shardsTotal: number;
	startedAt: number;
	finishedAt?: number;
	error?: string;
	input: InputValues;
}

export interface AppContextData {
	version: PearlVersion;
	mode: CannonMode;
	config: CannonConfig | null;
	calculator: CalculatorFields;
}

export interface ToolDetailState {
	key: string;
	index: number;
}

export interface PluginState {
	plugins: PluginRecord[];
	dormant: EmbeddedPluginEntry[];
	loadPrompt: boolean;
	wizardPlugins: EmbeddedPluginEntry[];
	runs: Record<string, ToolRun>;
	detail: ToolDetailState | null;
	app: AppContextData;
}

export interface EmbeddedPluginEntry {
	id: string;
	version: string;
	apiVersion: number;
	sha256: string;
	paramsJson: string;
	source: string;
}

const MAX_LOGS = 300;
const MAX_LOG_LENGTH = 4000;

let state: PluginState = {
	plugins: [],
	dormant: [],
	loadPrompt: false,
	wizardPlugins: [],
	runs: {},
	detail: null,
	app: {
		version: "Post1212",
		mode: "Standard",
		config: null,
		calculator: {
			pearlX: "",
			pearlZ: "",
			destX: "",
			destZ: "",
			cannonY: "",
			planeInterceptY: false,
			tickRange: [0, 0],
			distanceRange: [0, 0],
		},
	},
};
const listeners = new Set<() => void>();
let logCounter = 0;
let uidCounter = 0;

export function nextPluginUid() {
	return `plugin-${++uidCounter}`;
}

export function getPluginState() {
	return state;
}

export function setPluginState(update: (current: PluginState) => PluginState) {
	state = update(state);
	for (const listener of listeners) listener();
}

export function subscribePluginState(listener: () => void) {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
}

export function usePluginState<T>(selector: (current: PluginState) => T): T {
	return useSyncExternalStore(subscribePluginState, () => selector(state));
}

i18n.on("languageChanged", () => {
	const locale = currentLocale();
	setPluginState((current) => ({
		...current,
		plugins: current.plugins.map((plugin) => ({
			...plugin,
			manifest: localizeManifest(plugin.rawManifest, locale),
		})),
	}));
});

export function findPlugin(uid: string) {
	return state.plugins.find((plugin) => plugin.uid === uid);
}

export function findPluginById(id: string) {
	return state.plugins.find((plugin) => plugin.manifest.id === id);
}

export function updatePluginRecord(
	uid: string,
	patch: (plugin: PluginRecord) => PluginRecord,
) {
	setPluginState((current) => ({
		...current,
		plugins: current.plugins.map((plugin) =>
			plugin.uid === uid ? patch(plugin) : plugin,
		),
	}));
}

export function appendLog(uid: string, level: LogLevel, text: string) {
	updatePluginRecord(uid, (plugin) => ({
		...plugin,
		logs: [
			...plugin.logs.slice(-(MAX_LOGS - 1)),
			{
				id: ++logCounter,
				level,
				text:
					text.length > MAX_LOG_LENGTH
						? `${text.slice(0, MAX_LOG_LENGTH)}…`
						: text,
				at: Date.now(),
			},
		],
	}));
}

export function clearLogs(uid: string) {
	updatePluginRecord(uid, (plugin) => ({ ...plugin, logs: [] }));
}

export function setAppContext(app: AppContextData) {
	setPluginState((current) => ({ ...current, app }));
}

function values(
	fields: PluginManifest["settings"],
	raw: RawValues,
	scope: AppContextData,
) {
	return normalize(fields, resolveRaw(fields, raw, scope)).values;
}

export function callContext(
	plugin: PluginRecord,
	extra: Partial<CallContext> = {},
): CallContext {
	const scope = state.app;
	const { manifest } = plugin;
	return {
		locale: currentLocale(),
		version: scope.version,
		mode: scope.mode,
		config: scope.config,
		calculator: scope.calculator,
		settings: values(manifest.settings, plugin.settings, scope),
		inputs: values(manifest.calculatorInputs, plugin.calculatorInputs, scope),
		simulatorInputs: values(
			manifest.simulatorInputs,
			plugin.simulatorInputs,
			scope,
		),
		...extra,
	};
}

export function slotChain(slot: SlotName) {
	return state.plugins.filter(
		(plugin) => plugin.active && plugin.manifest.slots.includes(slot),
	);
}

export function slotSignature(slot: SlotName) {
	return JSON.stringify(
		slotChain(slot).map((plugin) => [
			plugin.uid,
			plugin.settings,
			plugin.calculatorInputs,
			plugin.simulatorInputs,
		]),
	);
}

export function parseParams(paramsJson: string | undefined): EmbeddedParams {
	if (!paramsJson) return {};
	try {
		const parsed = JSON.parse(paramsJson);
		return parsed && typeof parsed === "object" ? parsed : {};
	} catch {
		return {};
	}
}

const isPlainObject = (value: unknown): value is PluginData =>
	value !== null && typeof value === "object" && !Array.isArray(value);

export function paramsPatch(manifest: PluginManifest, params: EmbeddedParams) {
	return {
		settings: rawFromValues(manifest.settings, params.settings),
		calculatorInputs: rawFromValues(
			manifest.calculatorInputs,
			params.calculatorInputs,
		),
		simulatorInputs: rawFromValues(
			manifest.simulatorInputs,
			params.simulatorInputs,
		),
		toolInputs: Object.fromEntries(
			manifest.tools.map((tool) => [
				tool.id,
				rawFromValues(tool.inputs, params.tools?.[tool.id]),
			]),
		),
		data: isPlainObject(params.data) ? params.data : {},
	};
}

export function setPlugins(plugins: PluginRecord[]) {
	const ids = new Set(plugins.map((plugin) => plugin.manifest.id));
	setPluginState((current) => ({
		...current,
		plugins,
		runs: Object.fromEntries(
			Object.entries(current.runs).filter(([key]) =>
				ids.has(key.slice(0, key.indexOf("/"))),
			),
		),
		detail:
			current.detail &&
			ids.has(current.detail.key.slice(0, current.detail.key.indexOf("/")))
				? current.detail
				: null,
	}));
}

export function setDormant(
	dormant: EmbeddedPluginEntry[],
	loadPrompt: boolean,
) {
	setPluginState((current) => ({ ...current, dormant, loadPrompt }));
}

export function setWizardPlugins(wizardPlugins: EmbeddedPluginEntry[]) {
	setPluginState((current) => ({ ...current, wizardPlugins }));
}

export function setSettingsRaw(uid: string, settings: RawValues) {
	updatePluginRecord(uid, (plugin) => ({ ...plugin, settings }));
}

export function setCalculatorInputsRaw(
	uid: string,
	calculatorInputs: RawValues,
) {
	updatePluginRecord(uid, (plugin) => ({ ...plugin, calculatorInputs }));
}

export function setSimulatorInputsRaw(uid: string, simulatorInputs: RawValues) {
	updatePluginRecord(uid, (plugin) => ({ ...plugin, simulatorInputs }));
}

export function setToolInputsRaw(uid: string, toolId: string, raw: RawValues) {
	updatePluginRecord(uid, (plugin) => ({
		...plugin,
		toolInputs: { ...plugin.toolInputs, [toolId]: raw },
	}));
}

export function setPluginData(uid: string, data: PluginData) {
	updatePluginRecord(uid, (plugin) => ({ ...plugin, data }));
}

export function runKey(pluginId: string, toolId: string) {
	return `${pluginId}/${toolId}`;
}

export function setToolRun(
	key: string,
	run: ToolRun | ((previous?: ToolRun) => ToolRun),
) {
	setPluginState((current) => ({
		...current,
		runs: {
			...current.runs,
			[key]: typeof run === "function" ? run(current.runs[key]) : run,
		},
		detail:
			current.detail?.key === key && typeof run !== "function"
				? null
				: current.detail,
	}));
}

export function setToolDetail(detail: ToolDetailState | null) {
	setPluginState((current) => ({ ...current, detail }));
}

export function importFileTypes() {
	return Array.from(
		new Set(
			slotChain("importConfig").flatMap((plugin) => plugin.manifest.fileTypes),
		),
	);
}

export interface ExportedPlugin {
	Id: string;
	Version: string;
	ApiVersion: number;
	Sha256: string;
	Params: EmbeddedParams;
	Source: string;
}

const embeddedExport = (entry: EmbeddedPluginEntry): ExportedPlugin => ({
	Id: entry.id,
	Version: entry.version,
	ApiVersion: entry.apiVersion,
	Sha256: entry.sha256,
	Params: parseParams(entry.paramsJson),
	Source: entry.source,
});

export function exportedPlugins(): ExportedPlugin[] {
	const loaded = state.plugins.map((plugin) => ({
		Id: plugin.manifest.id,
		Version: plugin.manifest.version,
		ApiVersion: plugin.manifest.apiVersion,
		Sha256: plugin.sha256,
		Params: {
			settings: editedValues(plugin.manifest.settings, plugin.settings),
			calculatorInputs: editedValues(
				plugin.manifest.calculatorInputs,
				plugin.calculatorInputs,
			),
			simulatorInputs: editedValues(
				plugin.manifest.simulatorInputs,
				plugin.simulatorInputs,
			),
			tools: Object.fromEntries(
				plugin.manifest.tools.map((tool) => [
					tool.id,
					editedValues(tool.inputs, plugin.toolInputs[tool.id] ?? {}),
				]),
			),
			data: plugin.data,
		},
		Source: plugin.source,
	}));
	return [...loaded, ...state.dormant.map(embeddedExport)];
}

export function wizardExportPlugins(): ExportedPlugin[] {
	return state.wizardPlugins.map(embeddedExport);
}

export async function sha256(source: string) {
	const digest = await crypto.subtle.digest(
		"SHA-256",
		new TextEncoder().encode(source),
	);
	return Array.from(new Uint8Array(digest), (byte) =>
		byte.toString(16).padStart(2, "0"),
	).join("");
}
