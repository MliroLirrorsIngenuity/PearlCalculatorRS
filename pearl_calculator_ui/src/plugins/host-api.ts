import i18n from "i18next";
import { toast } from "sonner";
import { z } from "zod";
import { builtinBits } from "@/lib/bits-builtin";
import { extensionOf, pickTextFile, saveTextFile } from "@/lib/config-service";
import { PearlTraceResultSchema, TNTResultSchema } from "@/lib/schemas";
import type {
	CalculatorFields,
	JsonValue,
	NoticeLevel,
	Permission,
} from "@/plugins/pearlcalc-plugin";
import { calculatorService, isTauri } from "@/services";
import { appBridge } from "./app-bridge";
import { boundBits, boundRawTrace, boundSolve, boundTrace } from "./bounds";
import { rejectEmbeddedPlugins } from "./embedded";
import { hasOwn } from "./localize";
import { pluginToolPath } from "./manifest";
import { wellFormed } from "./manifest-check";
import { grants } from "./permissions";
import { runSlot } from "./pipeline";
import type { RequestMeta } from "./runtime/plugin-worker";
import {
	findPlugin,
	getPluginState,
	type PluginRecord,
	setPluginData,
} from "./store";

const MAX_DATA_BYTES = 1 << 20;
const MAX_TEXT_LENGTH = 1 << 20;
const MAX_KEY_LENGTH = 200;
const NOTICE_WINDOW_MS = 10000;
const USER_INTENT_MS = 5000;
const SAVE_EXTENSIONS = [
	"txt",
	"json",
	"csv",
	"tsv",
	"md",
	"log",
	"xml",
	"yaml",
	"yml",
	"toml",
	"snbt",
	"mcfunction",
];
const NOTICES_PER_WINDOW = 3;
const STATIC_PATHS = ["/", "/simulator", "/configuration"];

type Handler = (
	plugin: PluginRecord,
	payload: unknown,
	meta: RequestMeta,
) => Promise<unknown> | unknown;

const record = (payload: unknown): Record<string, unknown> =>
	payload !== null && typeof payload === "object" && !Array.isArray(payload)
		? (payload as Record<string, unknown>)
		: {};

function text(value: unknown, what: string) {
	if (typeof value !== "string") throw new Error(`${what} must be a string`);
	if (value.length > MAX_TEXT_LENGTH) throw new Error(`${what} is too long`);
	return value;
}

function storageKey(payload: unknown) {
	const key = record(payload).key;
	if (typeof key !== "string" || !key || key.length > MAX_KEY_LENGTH) {
		throw new Error(`Storage keys are 1-${MAX_KEY_LENGTH} characters`);
	}
	return key;
}

function requirePermission(plugin: PluginRecord, permission: Permission) {
	if (!grants(plugin.manifest, plugin.active, permission)) {
		throw new Error(`This requires the "${permission}" permission`);
	}
}

function requireUserIntent(plugin: PluginRecord, meta: RequestMeta) {
	if (plugin.manifest.permissions.includes("full-access")) return;
	if (
		meta.intentAt === undefined ||
		Date.now() - meta.intentAt > USER_INTENT_MS
	) {
		throw new Error(
			"Only allowed in a panel handler within 5 seconds of the user's click",
		);
	}
}

function hasLoneSurrogate(value: unknown): boolean {
	if (typeof value === "string") return !wellFormed(value);
	if (Array.isArray(value)) return value.some(hasLoneSurrogate);
	return (
		value !== null &&
		typeof value === "object" &&
		Object.entries(value).some(
			([key, entry]) => !wellFormed(key) || hasLoneSurrogate(entry),
		)
	);
}

function consentOpen() {
	const state = getPluginState();
	return (
		state.loadPrompt ||
		state.plugins.some((plugin) => plugin.consent === "pending")
	);
}

const MAX_ACTIVE_RUNS = 8;
const activeRuns = new Map<string, number>();

async function limitRuns<T>(plugin: PluginRecord, work: () => Promise<T>) {
	const active = activeRuns.get(plugin.uid) ?? 0;
	if (active >= MAX_ACTIVE_RUNS) {
		throw new Error(`At most ${MAX_ACTIVE_RUNS} pc.run calls can be active`);
	}
	activeRuns.set(plugin.uid, active + 1);
	try {
		return await work();
	} finally {
		activeRuns.set(plugin.uid, (activeRuns.get(plugin.uid) ?? 1) - 1);
	}
}

const recentNotices = new Map<string, number[]>();
let globalNotices: number[] = [];

function allowNotice(uid: string) {
	const now = Date.now();
	const recent = (recentNotices.get(uid) ?? []).filter(
		(at) => now - at < NOTICE_WINDOW_MS,
	);
	globalNotices = globalNotices.filter((at) => now - at < NOTICE_WINDOW_MS);
	if (
		recent.length >= NOTICES_PER_WINDOW ||
		globalNotices.length >= NOTICES_PER_WINDOW * 2
	) {
		return false;
	}
	recentNotices.set(uid, [...recent, now]);
	globalNotices.push(now);
	return true;
}

function navigablePaths() {
	return new Set([
		...STATIC_PATHS,
		...getPluginState()
			.plugins.filter((plugin) => plugin.active)
			.flatMap((plugin) => [
				...plugin.manifest.tools.map((tool) =>
					pluginToolPath(plugin.manifest.id, tool.id),
				),
				...plugin.manifest.panels
					.filter((panel) => panel.mount === "page")
					.map((panel) => pluginToolPath(plugin.manifest.id, panel.id)),
			]),
	]);
}

const numberText = (value: unknown, field: string) => {
	if (typeof value === "number" && Number.isFinite(value)) return String(value);
	if (typeof value === "string") return value;
	throw new Error(`${field} must be a number or string`);
};

const pair = (value: unknown, field: string): [number, number] => {
	if (
		!Array.isArray(value) ||
		value.length !== 2 ||
		!value.every((entry) => typeof entry === "number" && Number.isFinite(entry))
	) {
		throw new Error(`${field} must be [number, number]`);
	}
	return [value[0], value[1]];
};

const TEXT_FIELDS = [
	"pearlX",
	"pearlZ",
	"destX",
	"destY",
	"destZ",
	"cannonY",
] as const;

let fileDialogOpen = false;

async function withFileDialog<T>(
	plugin: PluginRecord,
	meta: RequestMeta,
	work: () => Promise<T>,
) {
	requireUserIntent(plugin, meta);
	if (fileDialogOpen) throw new Error("Another file dialog is already open");
	if (!isTauri && navigator.userActivation?.isActive === false) {
		throw new Error("File dialogs can only open right after a user click");
	}
	fileDialogOpen = true;
	try {
		return await work();
	} finally {
		fileDialogOpen = false;
	}
}

const extensionsOf = (value: unknown) =>
	Array.isArray(value)
		? value
				.filter((entry): entry is string => typeof entry === "string")
				.map((entry) => entry.replace(/^\./, "").toLowerCase())
				.filter((entry) => /^[a-z0-9]{1,16}$/.test(entry))
		: [];

const baseName = (path: string) => path.split(/[\\/]/).pop() ?? path;

const handlers: Record<string, Handler> = {
	"calc.tntAmount": (_plugin, payload) =>
		calculatorService.calculateTNTAmount(boundSolve(payload)),
	"calc.pearlTrace": (_plugin, payload) =>
		calculatorService.calculatePearlTrace(boundTrace(payload)),
	"calc.rawTrace": (_plugin, payload) =>
		calculatorService.calculateRawTrace(boundRawTrace(payload)),

	"run.solve": (plugin, payload, { depth }) =>
		limitRuns(plugin, () =>
			runSlot(
				"solve",
				boundSolve(payload),
				(input) => calculatorService.calculateTNTAmount(input),
				(output) => z.array(TNTResultSchema).parse(output),
				depth,
			),
		),
	"run.trace": (plugin, payload, { depth }) =>
		limitRuns(plugin, () =>
			runSlot(
				"trace",
				boundTrace(payload),
				(input) => calculatorService.calculatePearlTrace(input),
				(output) => PearlTraceResultSchema.parse(output),
				depth,
			),
		),
	"run.simulate": (plugin, payload, { depth }) =>
		limitRuns(plugin, () =>
			runSlot(
				"simulate",
				boundRawTrace(payload),
				(input) => calculatorService.calculateRawTrace(input),
				(output) => PearlTraceResultSchema.parse(output),
				depth,
			),
		),
	"run.bits": (plugin, payload, { depth }) =>
		limitRuns(plugin, () =>
			runSlot("bits", boundBits(payload), builtinBits, undefined, depth),
		),

	"storage.get": (plugin, payload) => {
		const key = storageKey(payload);
		return hasOwn(plugin.data, key) ? plugin.data[key] : undefined;
	},
	"storage.keys": (plugin) => Object.keys(plugin.data),
	"storage.set": (plugin, payload) => {
		const key = storageKey(payload);
		const serialized = JSON.stringify(record(payload).value ?? null);
		if (hasLoneSurrogate(record(payload).value)) {
			throw new Error("Storage values must be valid Unicode text");
		}
		if (
			hasOwn(plugin.data, key) &&
			JSON.stringify(plugin.data[key]) === serialized
		) {
			return;
		}
		const value = JSON.parse(serialized) as JsonValue;
		const next = { ...plugin.data, [key]: value };
		if (
			new TextEncoder().encode(JSON.stringify(next)).length > MAX_DATA_BYTES
		) {
			throw new Error("Plugin data is limited to 1 MB");
		}
		setPluginData(plugin.uid, next);
	},
	"storage.remove": (plugin, payload) => {
		const key = storageKey(payload);
		setPluginData(
			plugin.uid,
			Object.fromEntries(
				Object.entries(plugin.data).filter(([entry]) => entry !== key),
			),
		);
	},

	"app.notify": (plugin, payload) => {
		const { message, level } = record(payload);
		const body = text(message, "message").slice(0, 500);
		if (consentOpen() || !allowNotice(plugin.uid)) return;
		const options = { description: body };
		const title = i18n.t("plugins.toast_from", {
			name: plugin.manifest.name,
			id: plugin.manifest.id,
		});
		const kind = level as NoticeLevel | undefined;
		if (kind === "success") toast.success(title, options);
		else if (kind === "warning") toast.warning(title, options);
		else if (kind === "error") toast.error(title, options);
		else toast.info(title, options);
	},
	"app.navigate": (plugin, payload, meta) => {
		requireUserIntent(plugin, meta);
		const path = text(record(payload).path, "path");
		if (!navigablePaths().has(path)) {
			throw new Error(`Cannot navigate to ${path}`);
		}
		appBridge().navigate(path);
	},
	"app.setCalculator": (plugin, payload, meta) => {
		requireUserIntent(plugin, meta);
		const patch = record(payload);
		const bridge = appBridge();
		const updates: [keyof CalculatorFields, unknown][] = [];
		for (const field of TEXT_FIELDS) {
			if (patch[field] !== undefined) {
				updates.push([field, numberText(patch[field], field)]);
			}
		}
		if (patch.planeInterceptY !== undefined) {
			if (typeof patch.planeInterceptY !== "boolean") {
				throw new Error("planeInterceptY must be a boolean");
			}
			updates.push(["planeInterceptY", patch.planeInterceptY]);
		}
		for (const field of ["tickRange", "distanceRange"] as const) {
			if (patch[field] !== undefined) {
				updates.push([field, pair(patch[field], field)]);
			}
		}
		for (const [field, value] of updates) {
			bridge.setCalculatorField(field, value as never);
		}
	},

	"clipboard.write": async (plugin, payload, meta) => {
		requireUserIntent(plugin, meta);
		const content = text(record(payload).text, "text");
		rejectEmbeddedPlugins(content);
		await calculatorService.copyToClipboard(content);
		toast.success(
			i18n.t("plugins.toast_clipboard_written", {
				name: plugin.manifest.name,
			}),
		);
	},
	"clipboard.read": (plugin) => {
		requirePermission(plugin, "clipboard-read");
		return calculatorService.readFromClipboard();
	},

	"files.open": (plugin, payload, meta) =>
		withFileDialog(plugin, meta, async () => {
			const options = record(payload);
			const title =
				typeof options.title === "string" ? options.title.slice(0, 80) : "File";
			const picked = await pickTextFile(
				title,
				extensionsOf(options.extensions),
			);
			return picked
				? { name: baseName(picked.path), text: picked.content }
				: null;
		}),
	"files.save": (plugin, payload, meta) =>
		withFileDialog(plugin, meta, async () => {
			const options = record(payload);
			const content = text(options.text, "text");
			rejectEmbeddedPlugins(content);
			const requested = extensionsOf(options.extensions);
			const extensions = requested.filter((entry) =>
				SAVE_EXTENSIONS.includes(entry),
			);
			if (requested.length > extensions.length) {
				throw new Error(`Plugins can only save ${SAVE_EXTENSIONS.join(", ")}`);
			}
			const fallback = extensions[0] ?? "txt";
			const stem =
				typeof options.name === "string" && options.name.trim()
					? baseName(options.name.trim()).slice(0, 120)
					: "export";
			const name = SAVE_EXTENSIONS.includes(extensionOf(stem))
				? stem
				: `${stem}.${fallback}`;
			return (
				(await saveTextFile(
					content,
					name,
					"File",
					extensions.length > 0 ? extensions : [fallback],
				)) !== null
			);
		}),
};

export async function dispatchHostRequest(
	uid: string,
	method: string,
	payload: unknown,
	meta: RequestMeta,
) {
	const plugin = findPlugin(uid);
	if (!plugin?.active) throw new Error("Plugin is not active");
	if (!hasOwn(handlers, method)) {
		throw new Error(`Unknown host method: ${method}`);
	}
	return handlers[method](plugin, payload, meta);
}
