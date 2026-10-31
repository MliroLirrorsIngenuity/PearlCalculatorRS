import { startMainWorld, stopMainWorld } from "./main-world";
import { localizeManifest } from "./manifest";
import { checkManifest } from "./manifest-check";
import { disposePanels } from "./panels";
import { needsConsent } from "./permissions";
import { PluginLoadError, type PluginWorker } from "./runtime/plugin-worker";
import {
	type EmbeddedParams,
	type EmbeddedPluginEntry,
	findPlugin,
	getPluginState,
	nextPluginUid,
	type PluginRecord,
	paramsPatch,
	parseParams,
	setDormant,
	setPlugins,
	sha256,
	updatePluginRecord,
} from "./store";
import { stopToolsFor } from "./tool-runner";
import {
	probeGrant,
	registerWorker,
	releasePluginSandboxes,
	startWorker,
} from "./workers";

interface Prepared {
	record: PluginRecord;
	worker?: PluginWorker;
}

export interface PluginFailure {
	id: string;
	error: unknown;
}

let generation = 0;

async function prepare(
	source: string,
	params: EmbeddedParams | undefined,
	declaredSha256: string | undefined,
): Promise<Prepared> {
	const digest = await sha256(source);
	const reused = getPluginState().plugins.find(
		(plugin) =>
			plugin.sha256 === digest && plugin.manifest.permissions.length === 0,
	);
	if (reused) {
		const patch = params ? paramsPatch(reused.manifest, params) : null;
		return { record: { ...reused, declaredSha256, ...(patch ?? {}) } };
	}
	const uid = nextPluginUid();
	let probe: Awaited<ReturnType<typeof startWorker>> | undefined;
	let rawManifest: PluginRecord["rawManifest"];
	let manifest: PluginRecord["manifest"];
	try {
		probe = await startWorker(source, probeGrant(uid), () => uid);
		rawManifest = checkManifest(probe.manifest);
		manifest = localizeManifest(rawManifest);
	} catch (error) {
		probe?.worker.terminate();
		releasePluginSandboxes(uid);
		throw error;
	}
	const pending = needsConsent(manifest);
	if (pending) probe.worker.terminate();
	return {
		record: {
			uid,
			rawManifest,
			manifest,
			source,
			sha256: digest,
			declaredSha256,
			active: !pending,
			consent: pending ? "pending" : "granted",
			...paramsPatch(manifest, params ?? {}),
			logs: [],
		},
		worker: pending ? undefined : probe.worker,
	};
}

function install(prepared: Prepared[]) {
	const keep = new Set(prepared.map((entry) => entry.record.uid));
	for (const plugin of getPluginState().plugins) {
		if (keep.has(plugin.uid)) continue;
		stopToolsFor(plugin.manifest.id);
		stopMainWorld(plugin.uid);
		disposePanels(plugin.uid);
		releasePluginSandboxes(plugin.uid);
	}
	for (const entry of prepared) {
		if (entry.worker) registerWorker(entry.record.uid, entry.worker);
	}
	setPlugins(prepared.map((entry) => entry.record));
}

function discard(prepared: Prepared[]) {
	const live = new Set(getPluginState().plugins.map((plugin) => plugin.uid));
	for (const entry of prepared) {
		if (!live.has(entry.record.uid)) releasePluginSandboxes(entry.record.uid);
	}
}

export async function applyConfigPlugins(entries: EmbeddedPluginEntry[]) {
	const current = ++generation;
	const loaded = new Map(
		getPluginState().plugins.map((plugin) => [plugin.sha256, plugin]),
	);
	const kept: Prepared[] = [];
	const dormant: EmbeddedPluginEntry[] = [];
	for (const entry of entries) {
		const existing = loaded.get(await sha256(entry.source));
		if (existing && existing.manifest.permissions.length === 0) {
			kept.push({
				record: {
					...existing,
					declaredSha256: entry.sha256 || undefined,
					...paramsPatch(existing.manifest, parseParams(entry.paramsJson)),
				},
			});
		} else {
			dormant.push(entry);
		}
	}
	if (current !== generation) return;
	install(kept);
	setDormant(dormant, dormant.length > 0);
}

export function clearConfigPlugins() {
	return applyConfigPlugins([]);
}

export async function loadDormant(entries = getPluginState().dormant) {
	const current = generation;
	const remaining = getPluginState().dormant.filter(
		(entry) => !entries.includes(entry),
	);
	setDormant(remaining, false);
	const prepared: Prepared[] = [];
	const failures: PluginFailure[] = [];
	for (const entry of entries) {
		try {
			const result = await prepare(
				entry.source,
				parseParams(entry.paramsJson),
				entry.sha256 || undefined,
			);
			if (result.record.manifest.id !== entry.id) {
				discard([result]);
				throw new PluginLoadError(
					{
						code: "id_mismatch",
						params: { declared: entry.id, actual: result.record.manifest.id },
					},
					entry.id,
				);
			}
			prepared.push(result);
		} catch (error) {
			failures.push({ id: entry.id, error });
		}
	}
	if (current !== generation) {
		discard(prepared);
		return [];
	}
	const plugins = getPluginState().plugins;
	const ids = new Set(plugins.map((plugin) => plugin.manifest.id));
	const fresh: Prepared[] = [];
	for (const entry of prepared) {
		if (plugins.some((plugin) => plugin.uid === entry.record.uid)) continue;
		const id = entry.record.manifest.id;
		if (ids.has(id)) {
			failures.push({
				id,
				error: new PluginLoadError(
					{ code: "id_duplicate", params: { id } },
					id,
				),
			});
			discard([entry]);
			continue;
		}
		ids.add(id);
		fresh.push(entry);
	}
	install([...plugins.map((record) => ({ record })), ...fresh]);
	return failures;
}

export function skipDormant() {
	setDormant(getPluginState().dormant, false);
}

export function removeDormant(entry: EmbeddedPluginEntry) {
	setDormant(
		getPluginState().dormant.filter((item) => item !== entry),
		false,
	);
}

export async function attachPlugin(source: string) {
	const prepared = await prepare(source, undefined, undefined);
	const plugins = getPluginState().plugins;
	const index = plugins.findIndex(
		(plugin) => plugin.manifest.id === prepared.record.manifest.id,
	);
	const replaced = plugins[index];
	if (replaced && replaced.uid !== prepared.record.uid) {
		prepared.record = {
			...prepared.record,
			settings: replaced.settings,
			calculatorInputs: replaced.calculatorInputs,
			simulatorInputs: replaced.simulatorInputs,
			toolInputs: replaced.toolInputs,
			data: replaced.data,
			logs: replaced.logs,
		};
	}
	const next: Prepared[] = plugins.map((record) => ({ record }));
	if (index >= 0) next[index] = prepared;
	else next.push(prepared);
	install(next);
	return prepared.record;
}

export function detachPlugin(uid: string) {
	install(
		getPluginState()
			.plugins.filter((plugin) => plugin.uid !== uid)
			.map((record) => ({ record })),
	);
}

export async function grantPlugin(uid: string) {
	const plugin = findPlugin(uid);
	if (!plugin || plugin.active) return;
	releasePluginSandboxes(uid);
	updatePluginRecord(uid, (record) => ({
		...record,
		active: true,
		consent: "granted",
	}));
	const granted = findPlugin(uid);
	if (
		granted?.manifest.hasMain &&
		granted.manifest.permissions.includes("full-access")
	) {
		await startMainWorld(granted);
	}
}

export function declinePlugin(uid: string) {
	updatePluginRecord(uid, (record) =>
		record.active ? record : { ...record, consent: "declined" },
	);
}

export function requestConsent(uid: string) {
	updatePluginRecord(uid, (record) =>
		record.active ? record : { ...record, consent: "pending" },
	);
}

export function applyWizardPlugins() {
	return applyConfigPlugins(getPluginState().wizardPlugins);
}
