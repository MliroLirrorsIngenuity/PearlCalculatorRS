import { useEffect, useMemo, useSyncExternalStore } from "react";
import type { PanelContext, UIEvent } from "@/plugins/pearlcalc-plugin";
import { appendLog, callContext, findPlugin } from "./store";
import { ensureWorker } from "./workers";

const PANEL_TIMEOUT_MS = 30000;
const RENDER_DELAY_MS = 80;
const MAX_STATE_BYTES = 1 << 20;
const MAX_NODES = 50000;
const MAX_CHARACTERS = 2_000_000;
const MAX_DEPTH = 48;

export type PanelView = PanelContext["view"];

export interface PanelSnapshot {
	tree: unknown;
	error: string | null;
	ready: boolean;
	version: number;
}

function checkState(state: unknown) {
	const serialized = JSON.stringify(state ?? null);
	if (new TextEncoder().encode(serialized).length > MAX_STATE_BYTES) {
		throw new Error("Panel state is limited to 1 MB");
	}
	return JSON.parse(serialized) as unknown;
}

function checkTree(tree: unknown) {
	let count = 0;
	let characters = 0;
	const visit = (value: unknown, depth: number) => {
		if (++count > MAX_NODES) throw new Error("Panel UI has too many values");
		if (typeof value === "string") characters += value.length;
		if (characters > MAX_CHARACTERS) throw new Error("Panel UI is too large");
		if (value === null || typeof value !== "object") return;
		if (depth > MAX_DEPTH) throw new Error("Panel UI is nested too deeply");
		for (const [key, child] of Object.entries(value)) {
			characters += key.length;
			visit(child, depth + 1);
		}
	};
	visit(tree, 0);
	return tree;
}

class PanelController {
	private state: unknown = null;
	private initialized = false;
	private snapshot: PanelSnapshot = {
		tree: null,
		error: null,
		ready: false,
		version: 0,
	};
	private readonly listeners = new Set<() => void>();
	private chain: Promise<void> = Promise.resolve();
	private renderTimer: ReturnType<typeof setTimeout> | undefined;
	private view: PanelView = {};
	private disposed = false;

	constructor(
		readonly uid: string,
		readonly panelId: string,
	) {}

	subscribe = (listener: () => void) => {
		this.listeners.add(listener);
		return () => {
			this.listeners.delete(listener);
		};
	};

	getSnapshot = () => this.snapshot;

	private publish(patch: Partial<PanelSnapshot>) {
		this.snapshot = { ...this.snapshot, ...patch };
		for (const listener of this.listeners) listener();
	}

	private async call(
		fn: "state" | "render" | "on",
		args: unknown[],
		name?: string,
		intentAt?: number,
	) {
		const plugin = findPlugin(this.uid);
		if (!plugin?.active) throw new Error("Plugin is not active");
		const worker = await ensureWorker(this.uid);
		return worker.call(
			{ kind: "panel", panel: this.panelId, fn, name },
			args,
			callContext(plugin, { panel: this.panelId, view: this.view }),
			{ timeoutMs: PANEL_TIMEOUT_MS, intentAt },
		).promise;
	}

	private enqueue(work: () => Promise<void>) {
		this.chain = this.chain.then(async () => {
			if (this.disposed) return;
			try {
				await work();
				if (this.snapshot.error) this.publish({ error: null });
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				appendLog(this.uid, "error", `[${this.panelId}] ${message}`);
				this.publish({ error: message, ready: true });
			}
		});
	}

	private async ensureState() {
		if (this.initialized) return;
		this.state = checkState(await this.call("state", []));
		this.initialized = true;
	}

	private async renderNow() {
		await this.ensureState();
		const tree = checkTree(await this.call("render", [this.state]));
		if (!this.disposed) {
			this.publish({ tree, ready: true, version: this.snapshot.version + 1 });
		}
	}

	requestRender(view: PanelView) {
		this.view = view;
		clearTimeout(this.renderTimer);
		this.renderTimer = setTimeout(
			() => this.enqueue(() => this.renderNow()),
			RENDER_DELAY_MS,
		);
	}

	dispatch(event: UIEvent, fromUser: boolean) {
		const intentAt = fromUser ? Date.now() : undefined;
		this.enqueue(async () => {
			await this.ensureState();
			const next = await this.call(
				"on",
				[this.state, event],
				event.on,
				intentAt,
			);
			if (next !== undefined) this.state = checkState(next);
			await this.renderNow();
		});
	}

	dispose() {
		this.disposed = true;
		clearTimeout(this.renderTimer);
		this.listeners.clear();
	}
}

const controllers = new Map<string, PanelController>();

export function panelController(uid: string, panelId: string) {
	const key = `${uid}/${panelId}`;
	let controller = controllers.get(key);
	if (!controller) {
		controller = new PanelController(uid, panelId);
		controllers.set(key, controller);
	}
	return controller;
}

export function disposePanels(uid: string) {
	for (const [key, controller] of controllers) {
		if (controller.uid !== uid) continue;
		controller.dispose();
		controllers.delete(key);
	}
}

export function usePanel(
	uid: string,
	panelId: string,
	view: PanelView,
	revision: unknown,
) {
	const controller = useMemo(
		() => panelController(uid, panelId),
		[uid, panelId],
	);
	const snapshot = useSyncExternalStore(
		controller.subscribe,
		controller.getSnapshot,
	);
	useEffect(() => {
		if (revision !== undefined) controller.requestRender(view);
	}, [controller, view, revision]);
	return {
		snapshot,
		dispatch: (event: UIEvent, fromUser: boolean) =>
			controller.dispatch(event, fromUser),
	};
}
