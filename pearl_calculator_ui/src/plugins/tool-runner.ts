import i18n from "i18next";
import type { InputValues, View } from "@/plugins/pearlcalc-plugin";
import type { PluginWorker } from "./runtime/plugin-worker";
import type { ToolManifest } from "./runtime/protocol";
import { createTopN, type Row } from "./runtime/shared";
import {
	callContext,
	findPlugin,
	findPluginById,
	getPluginState,
	type PluginRecord,
	runKey,
	setPluginState,
	setToolRun,
} from "./store";
import { ensureWorker, pluginGrant, startWorker } from "./workers";

const PUBLISH_INTERVAL_MS = 250;
const STOP_GRACE_MS = 400;
const CALL_TIMEOUT_MS = 120000;

interface ActiveRun {
	aborted: boolean;
	workers: PluginWorker[];
	inflight: Map<PluginWorker, number>;
	planning: PluginWorker | null;
}

const active = new Map<string, ActiveRun>();

export function maxToolWorkers() {
	return Math.max(1, Math.min(16, (navigator.hardwareConcurrency || 4) - 1));
}

function resolveTool(uid: string, toolId: string) {
	const plugin = findPlugin(uid);
	const tool = plugin?.manifest.tools.find((entry) => entry.id === toolId);
	if (!plugin?.active || !tool) throw new Error(`Unknown tool ${toolId}`);
	return { plugin, tool };
}

const MAX_LIMIT = 10000;

export function toolLimit(tool: ToolManifest, input: InputValues) {
	const value =
		typeof tool.limit === "string" ? Number(input[tool.limit]) : tool.limit;
	return typeof value === "number" && Number.isFinite(value) && value >= 1
		? Math.min(MAX_LIMIT, Math.floor(value))
		: 100;
}

function toolContext(
	plugin: PluginRecord,
	tool: ToolManifest,
	input: InputValues,
) {
	return callContext(plugin, {
		input,
		sortBy: tool.sortBy,
		limit: toolLimit(tool, input),
	});
}

export function isToolRunning(pluginId: string, toolId: string) {
	return active.has(runKey(pluginId, toolId));
}

export async function runTool(uid: string, toolId: string, input: InputValues) {
	const { plugin, tool } = resolveTool(uid, toolId);
	const pluginId = plugin.manifest.id;
	const key = runKey(pluginId, toolId);
	if (active.has(key)) return;
	const run: ActiveRun = {
		aborted: false,
		workers: [],
		inflight: new Map(),
		planning: null,
	};
	active.set(key, run);
	const startedAt = Date.now();
	setToolRun(key, {
		status: "running",
		rows: [],
		progress: 0,
		shardsDone: 0,
		shardsTotal: 0,
		startedAt,
		input,
	});

	const ctx = toolContext(plugin, tool, input);
	const topN = createTopN(tool.sortBy, toolLimit(tool, input));
	const partial = new Map<number, number>();
	let done = 0;
	let total = 0;
	let floor: Row | undefined;
	let lastPublish = 0;
	let publishTimer: ReturnType<typeof setTimeout> | undefined;

	const publish = () => {
		lastPublish = Date.now();
		publishTimer = undefined;
		let fraction = done;
		for (const value of partial.values()) fraction += value;
		setToolRun(key, (previous) => ({
			...(previous as NonNullable<typeof previous>),
			rows: topN.rows(),
			progress: total > 0 ? fraction / total : 0,
			shardsDone: done,
			shardsTotal: total,
		}));
	};
	const schedulePublish = () => {
		if (publishTimer) return;
		publishTimer = setTimeout(
			publish,
			Math.max(0, PUBLISH_INTERVAL_MS - (Date.now() - lastPublish)),
		);
	};
	const spreadFloor = () => {
		if (!topN.full()) return;
		const worst = topN.worst();
		if (worst === floor) return;
		floor = worst;
		for (const [worker, id] of run.inflight) worker.floor(id, floor);
	};

	try {
		const main = await ensureWorker(uid);
		run.planning = main;
		if (tool.has.validate) {
			const message = await main.call(
				{ kind: "tool", tool: toolId, fn: "validate" },
				[input],
				ctx,
				{ timeoutMs: CALL_TIMEOUT_MS },
			).promise;
			if (typeof message === "string" && message.trim()) {
				throw new Error(message);
			}
		}
		const shards = tool.has.plan
			? await main.call(
					{ kind: "tool", tool: toolId, fn: "plan" },
					[input],
					ctx,
					{ timeoutMs: CALL_TIMEOUT_MS },
				).promise
			: [input];
		run.planning = null;
		if (!Array.isArray(shards)) {
			throw new Error(i18n.t("plugins.errors.plan_not_array"));
		}
		total = shards.length;
		publish();

		const grant = pluginGrant(plugin);
		const uidOf = () => (findPlugin(uid) ? uid : undefined);
		run.workers = await Promise.all(
			Array.from({ length: Math.min(total, maxToolWorkers()) }, async () => {
				const { worker } = await startWorker(plugin.source, grant, uidOf);
				if (run.aborted) worker.terminate();
				return worker;
			}),
		);

		let next = 0;
		await Promise.all(
			run.workers.map(async (worker) => {
				while (!run.aborted && next < total) {
					const index = next++;
					const { id, promise } = worker.call(
						{ kind: "tool", tool: toolId, fn: "runShard" },
						[shards[index]],
						ctx,
						{
							onRows: (rows) => {
								for (const row of rows) topN.offer(row);
								spreadFloor();
								schedulePublish();
							},
							onProgress: (value) => {
								partial.set(index, value);
								schedulePublish();
							},
						},
					);
					run.inflight.set(worker, id);
					if (floor) worker.floor(id, floor);
					await promise;
					run.inflight.delete(worker);
					partial.delete(index);
					done++;
					schedulePublish();
				}
			}),
		);

		let rows = topN.rows();
		if (tool.has.finalize && !run.aborted) {
			const finalized = await main.call(
				{ kind: "tool", tool: toolId, fn: "finalize" },
				[rows],
				ctx,
				{ timeoutMs: CALL_TIMEOUT_MS },
			).promise;
			if (!Array.isArray(finalized)) {
				throw new Error(i18n.t("plugins.errors.finalize_not_array"));
			}
			rows = finalized as Row[];
		}
		clearTimeout(publishTimer);
		setToolRun(key, (previous) => ({
			...(previous as NonNullable<typeof previous>),
			status: run.aborted ? "stopped" : "done",
			rows,
			progress: run.aborted ? (previous?.progress ?? 0) : 1,
			shardsDone: done,
			shardsTotal: total,
			finishedAt: Date.now(),
		}));
	} catch (error) {
		clearTimeout(publishTimer);
		setToolRun(key, (previous) => ({
			...(previous as NonNullable<typeof previous>),
			status: run.aborted ? "stopped" : "error",
			error: run.aborted
				? undefined
				: error instanceof Error
					? error.message
					: String(error),
			rows: topN.rows(),
			shardsDone: done,
			shardsTotal: total,
			finishedAt: Date.now(),
		}));
	} finally {
		run.aborted = true;
		for (const worker of run.workers) worker.terminate();
		active.delete(key);
		if (!findPluginById(pluginId)) {
			setPluginState((current) => {
				const { [key]: _removed, ...runs } = current.runs;
				return { ...current, runs };
			});
		}
	}
}

export function stopToolsFor(pluginId: string) {
	for (const key of active.keys()) {
		if (key.startsWith(`${pluginId}/`)) {
			stopTool(pluginId, key.slice(pluginId.length + 1));
		}
	}
}

export function stopTool(pluginId: string, toolId: string) {
	const run = active.get(runKey(pluginId, toolId));
	if (!run || run.aborted) return;
	run.aborted = true;
	run.planning?.terminate();
	for (const [worker, id] of run.inflight) worker.abort(id);
	setTimeout(() => {
		for (const worker of run.workers) worker.terminate();
	}, STOP_GRACE_MS);
}

function runInput(pluginId: string, toolId: string) {
	return getPluginState().runs[runKey(pluginId, toolId)]?.input ?? {};
}

async function callTool(
	uid: string,
	toolId: string,
	target:
		| { kind: "tool"; fn: "detail" | "copy" }
		| { kind: "action"; name: string },
	payload: unknown,
) {
	const { plugin, tool } = resolveTool(uid, toolId);
	const worker = await ensureWorker(uid);
	const ctx = toolContext(plugin, tool, runInput(plugin.manifest.id, toolId));
	return worker.call({ ...target, tool: toolId }, [payload], ctx, {
		timeoutMs: CALL_TIMEOUT_MS,
	}).promise;
}

export async function toolDetail(uid: string, toolId: string, row: Row) {
	const views = await callTool(
		uid,
		toolId,
		{ kind: "tool", fn: "detail" },
		row,
	);
	return (Array.isArray(views) ? views : []) as View[];
}

export async function toolCopy(uid: string, toolId: string, row: Row) {
	return String(await callTool(uid, toolId, { kind: "tool", fn: "copy" }, row));
}

export function toolAction(
	uid: string,
	toolId: string,
	name: string,
	payload: unknown,
) {
	return callTool(uid, toolId, { kind: "action", name }, payload);
}
