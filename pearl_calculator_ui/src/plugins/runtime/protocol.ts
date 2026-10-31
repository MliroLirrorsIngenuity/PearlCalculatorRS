import type {
	CalculatorFields,
	CannonConfig,
	CannonMode,
	InputValues,
	Locale,
	PanelContext,
	PanelMount,
	PearlVersion,
	Permission,
	Column as RawColumn,
	InputField as RawInputField,
	SlotName,
	SortKey,
	Text,
} from "@/plugins/pearlcalc-plugin";
import type { Column, InputField } from "../localize";
import type { Row } from "./shared";

interface ToolCapabilities {
	validate: boolean;
	plan: boolean;
	finalize: boolean;
	detail: boolean;
	copy: boolean;
}

export interface RawToolManifest {
	id: string;
	title: Text;
	description?: Text;
	inputs: RawInputField[];
	columns: RawColumn[];
	sortBy?: SortKey[];
	limit?: number | string;
	has: ToolCapabilities;
	actions: string[];
}

export interface RawPanelManifest {
	id: string;
	mount: PanelMount;
	title?: Text;
	hasState: boolean;
	handlers: string[];
}

export interface RawPluginManifest {
	apiVersion: 1;
	id: string;
	name: Text;
	version: string;
	author?: string;
	description?: Text;
	permissions: Permission[];
	networkHosts: string[];
	physics?: "custom";
	fileTypes: string[];
	settings: RawInputField[];
	calculatorInputs: RawInputField[];
	simulatorInputs: RawInputField[];
	resultColumns: RawColumn[];
	slots: SlotName[];
	tools: RawToolManifest[];
	panels: RawPanelManifest[];
	hasMain: boolean;
}

export interface ToolManifest
	extends Omit<
		RawToolManifest,
		"title" | "description" | "inputs" | "columns"
	> {
	title: string;
	description?: string;
	inputs: InputField[];
	columns: Column[];
}

export interface PanelManifest extends Omit<RawPanelManifest, "title"> {
	title?: string;
}

export interface PluginManifest
	extends Omit<
		RawPluginManifest,
		| "name"
		| "description"
		| "settings"
		| "calculatorInputs"
		| "simulatorInputs"
		| "resultColumns"
		| "tools"
		| "panels"
	> {
	name: string;
	description?: string;
	settings: InputField[];
	calculatorInputs: InputField[];
	simulatorInputs: InputField[];
	resultColumns: Column[];
	tools: ToolManifest[];
	panels: PanelManifest[];
}

export interface CallContext {
	locale: Locale;
	version: PearlVersion;
	mode: CannonMode;
	config: CannonConfig | null;
	calculator: CalculatorFields;
	settings: InputValues;
	inputs: InputValues;
	simulatorInputs: InputValues;
	input?: InputValues;
	sortBy?: SortKey[];
	limit?: number;
	panel?: string;
	view?: PanelContext["view"];
}

export type CallTarget =
	| { kind: "slot"; name: SlotName }
	| {
			kind: "tool";
			tool: string;
			fn: "validate" | "plan" | "runShard" | "finalize" | "detail" | "copy";
	  }
	| { kind: "action"; tool: string; name: string }
	| {
			kind: "panel";
			panel: string;
			fn: "state" | "render" | "on";
			name?: string;
	  };

export interface ManifestError {
	code: string;
	params?: Record<string, string | number>;
}

export type MainToWorker =
	| {
			t: "init";
			source: string;
			wasm: ArrayBuffer;
			network: boolean;
			restricted: boolean;
	  }
	| {
			t: "call";
			id: number;
			target: CallTarget;
			args: unknown[];
			ctx: CallContext;
	  }
	| { t: "abort"; id: number }
	| { t: "floor"; id: number; row: Row | undefined }
	| { t: "reply"; rid: number; ok: boolean; value?: unknown; error?: string };

export type WorkerToMain =
	| { t: "ready"; manifest: RawPluginManifest }
	| { t: "init-error"; error: ManifestError; message: string }
	| { t: "result"; id: number; value: unknown }
	| { t: "error"; id: number; message: string; stack?: string }
	| { t: "rows"; id: number; rows: Row[] }
	| { t: "progress"; id: number; value: number }
	| {
			t: "request";
			rid: number;
			id: number;
			method: string;
			payload: unknown;
	  }
	| { t: "log"; level: LogLevel; text: string };

export type LogLevel = "log" | "info" | "warn" | "error" | "debug";
