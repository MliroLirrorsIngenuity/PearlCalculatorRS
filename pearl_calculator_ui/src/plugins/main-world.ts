import { useMemo, useSyncExternalStore } from "react";
import type {
	MainContext,
	MainHost,
	PanelMount,
	PanelView,
	PluginDefinition,
} from "@/plugins/pearlcalc-plugin";
import { dispatchHostRequest } from "./host-api";
import { physicsWasm } from "./runtime/plugin-worker";
import { createPluginApi, type PhysicsExports } from "./runtime/shared";
import {
	appendLog,
	callContext,
	findPlugin,
	getPluginState,
	type PluginRecord,
	subscribePluginState,
} from "./store";

type MountRender = (element: HTMLElement, view: PanelView) => unknown;

export interface MainMount {
	id: number;
	uid: string;
	point: PanelMount;
	render: MountRender;
}

const running = new Map<string, { dispose?: () => void }>();
const mountListeners = new Set<() => void>();
let mounts: MainMount[] = [];
let mountCounter = 0;
let physics: Promise<PhysicsExports> | null = null;

const importModule = new Function("url", "return import(url)") as (
	url: string,
) => Promise<{ default?: PluginDefinition }>;

function setMounts(next: MainMount[]) {
	mounts = next;
	for (const listener of mountListeners) listener();
}

function subscribeMounts(listener: () => void) {
	mountListeners.add(listener);
	return () => {
		mountListeners.delete(listener);
	};
}

export function useMainMounts(point: PanelMount) {
	const all = useSyncExternalStore(subscribeMounts, () => mounts);
	return useMemo(
		() => all.filter((entry) => entry.point === point),
		[all, point],
	);
}

function loadPhysics() {
	physics ??= physicsWasm().then(async (bytes) => {
		const module = await WebAssembly.compile(bytes);
		const imports: Record<string, Record<string, () => never>> = {};
		for (const entry of WebAssembly.Module.imports(module)) {
			imports[entry.module] ??= {};
			imports[entry.module][entry.name] = () => {
				throw new Error(`${entry.name} is unavailable to plugins`);
			};
		}
		const instance = await WebAssembly.instantiate(module, imports);
		return instance.exports as unknown as PhysicsExports;
	});
	return physics;
}

const format = (value: unknown) => {
	if (typeof value === "string") return value;
	if (value instanceof Error) return value.stack ?? value.message;
	try {
		return JSON.stringify(value) ?? String(value);
	} catch {
		return String(value);
	}
};

function mainContext(plugin: PluginRecord): MainContext {
	const {
		locale,
		version,
		mode,
		config,
		calculator,
		settings,
		inputs,
		simulatorInputs,
	} = callContext(plugin);
	return {
		locale,
		version,
		mode,
		config,
		calculator,
		settings,
		inputs,
		simulatorInputs,
	};
}

function createHost(uid: string, wasm: PhysicsExports): MainHost {
	const request = (method: string, payload: unknown) =>
		dispatchHostRequest(uid, method, payload, { depth: 0 });
	const current = () => {
		const plugin = findPlugin(uid);
		if (!plugin) throw new Error("Plugin is no longer loaded");
		return plugin;
	};
	return {
		get pc() {
			return createPluginApi(wasm, getPluginState().app.version, request);
		},
		context: () => mainContext(current()),
		onContextChange(listener) {
			let last = "";
			return subscribePluginState(() => {
				const plugin = findPlugin(uid);
				if (!plugin) return;
				const context = mainContext(plugin);
				const key = JSON.stringify(context);
				if (key === last) return;
				last = key;
				listener(context);
			});
		},
		mount(point, render) {
			const entry: MainMount = { id: ++mountCounter, uid, point, render };
			setMounts([...mounts, entry]);
			return () => setMounts(mounts.filter((mount) => mount !== entry));
		},
		log: (...args) => appendLog(uid, "log", args.map(format).join(" ")),
	};
}

export async function startMainWorld(plugin: PluginRecord) {
	if (running.has(plugin.uid)) return;
	const entry: { dispose?: () => void } = {};
	running.set(plugin.uid, entry);
	const url = URL.createObjectURL(
		new Blob([plugin.source], { type: "text/javascript" }),
	);
	try {
		const wasm = await loadPhysics();
		if (running.get(plugin.uid) !== entry || !findPlugin(plugin.uid)?.active) {
			return;
		}
		const module = await importModule(url);
		if (running.get(plugin.uid) !== entry) return;
		const dispose = await module.default?.main?.(createHost(plugin.uid, wasm));
		if (typeof dispose === "function") entry.dispose = dispose as () => void;
		if (running.get(plugin.uid) !== entry) entry.dispose?.();
	} catch (error) {
		appendLog(plugin.uid, "error", format(error));
		throw error;
	} finally {
		URL.revokeObjectURL(url);
	}
}

export function stopMainWorld(uid: string) {
	const entry = running.get(uid);
	if (!entry) return;
	running.delete(uid);
	setMounts(mounts.filter((mount) => mount.uid !== uid));
	try {
		entry.dispose?.();
	} catch (error) {
		appendLog(uid, "error", format(error));
	}
}
