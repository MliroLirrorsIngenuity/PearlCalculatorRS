import { dispatchHostRequest } from "./host-api";
import { connectSource } from "./permissions";
import {
	PluginWorker,
	type SandboxGrant,
	type WorkerHost,
} from "./runtime/plugin-worker";
import { destroySandboxes, NO_NETWORK } from "./runtime/sandbox";
import { appendLog, findPlugin, type PluginRecord } from "./store";

const workers = new Map<string, PluginWorker>();

export function registerWorker(uid: string, worker: PluginWorker) {
	workers.get(uid)?.terminate();
	workers.set(uid, worker);
}

export function terminateWorker(uid: string) {
	workers.get(uid)?.terminate();
	workers.delete(uid);
}

export function releasePluginSandboxes(uid: string) {
	terminateWorker(uid);
	destroySandboxes(uid);
}

const LOGS_PER_SECOND = 50;
const logWindows = new Map<string, { start: number; count: number }>();

function allowLog(uid: string) {
	const now = performance.now();
	const window = logWindows.get(uid);
	if (!window || now - window.start > 1000) {
		logWindows.set(uid, { start: now, count: 1 });
		return true;
	}
	window.count++;
	if (window.count === LOGS_PER_SECOND + 1) {
		appendLog(uid, "warn", "Too many log messages; some were dropped");
	}
	return window.count <= LOGS_PER_SECOND;
}

export function workerHost(uidOf: () => string | undefined): WorkerHost {
	return {
		onLog: (level, text) => {
			const uid = uidOf();
			if (uid && allowLog(uid)) appendLog(uid, level, text);
		},
		request: async (method, payload, meta) => {
			const uid = uidOf();
			if (!uid) throw new Error("Plugin is no longer loaded");
			return dispatchHostRequest(uid, method, payload, meta);
		},
	};
}

export function probeGrant(uid: string): SandboxGrant {
	return { owner: uid, connectSrc: NO_NETWORK };
}

export function pluginGrant(plugin: PluginRecord): SandboxGrant {
	return {
		owner: plugin.uid,
		connectSrc: connectSource(plugin.manifest, plugin.active),
	};
}

export function startWorker(
	source: string,
	grant: SandboxGrant,
	uidOf: () => string | undefined,
) {
	return PluginWorker.start(source, grant, workerHost(uidOf));
}

export async function ensureWorker(uid: string) {
	const existing = workers.get(uid);
	if (existing && !existing.dead) return existing;
	const plugin = findPlugin(uid);
	if (!plugin?.active) throw new Error(`Plugin ${uid} is not active`);
	const { worker } = await startWorker(
		plugin.source,
		pluginGrant(plugin),
		() => uid,
	);
	const latest = workers.get(uid);
	if (latest && !latest.dead) {
		worker.terminate();
		return latest;
	}
	workers.set(uid, worker);
	return worker;
}
