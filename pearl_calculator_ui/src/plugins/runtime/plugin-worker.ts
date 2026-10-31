import wasmUrl from "../../../../pearl_calculator_wasm/pkg/pearl_calculator_wasm_bg.wasm?url";
import type {
	CallContext,
	CallTarget,
	LogLevel,
	ManifestError,
	RawPluginManifest,
	WorkerToMain,
} from "./protocol";
import { NO_NETWORK, type SpawnedPort, spawnSandboxedWorker } from "./sandbox";
import type { Row } from "./shared";

const INIT_TIMEOUT_MS = 15000;
const MESSAGES_PER_SECOND = 5000;
const MAX_ROWS_PER_MESSAGE = 20000;

let wasmBytes: Promise<ArrayBuffer> | null = null;

export function physicsWasm() {
	wasmBytes ??= fetch(wasmUrl).then((response) => {
		if (!response.ok) throw new Error(`Failed to load ${wasmUrl}`);
		return response.arrayBuffer();
	});
	return wasmBytes;
}

export class PluginLoadError extends Error {
	constructor(
		readonly error: ManifestError,
		message: string,
	) {
		super(message);
	}
}

export class PluginRuntimeError extends Error {
	constructor(
		message: string,
		readonly pluginStack?: string,
	) {
		super(message);
	}
}

export interface CallHooks {
	onNext?: (value: unknown) => Promise<unknown>;
	onRows?: (rows: Row[]) => void;
	onProgress?: (value: number) => void;
	timeoutMs?: number;
	depth?: number;
	intentAt?: number;
}

export interface RequestMeta {
	depth: number;
	intentAt?: number;
}

export interface WorkerHost {
	onLog: (level: LogLevel, text: string) => void;
	request: (
		method: string,
		payload: unknown,
		meta: RequestMeta,
	) => Promise<unknown>;
}

export interface SandboxGrant {
	owner: string;
	connectSrc: string;
}

interface PendingCall {
	resolve: (value: unknown) => void;
	reject: (error: Error) => void;
	hooks: CallHooks;
	timer?: ReturnType<typeof setTimeout>;
}

export class PluginWorker {
	private readonly calls = new Map<number, PendingCall>();
	private lastId = 0;
	private initWaiter: {
		resolve: (manifest: RawPluginManifest) => void;
		reject: (error: Error) => void;
	} | null = null;
	dead = false;
	private deathReason = "Plugin worker is not running";

	private constructor(
		private readonly spawned: SpawnedPort,
		private host: WorkerHost,
	) {
		spawned.port.onmessage = (event: MessageEvent<WorkerToMain>) =>
			this.receive(event.data);
	}

	static async start(
		source: string,
		grant: SandboxGrant,
		host: WorkerHost,
	): Promise<{ worker: PluginWorker; manifest: RawPluginManifest }> {
		let worker: PluginWorker | null = null;
		const spawned = await spawnSandboxedWorker(
			grant.owner,
			grant.connectSrc,
			(message) => worker?.crash(message),
		);
		worker = new PluginWorker(spawned, host);
		const manifest = await worker.init(
			source,
			grant.connectSrc !== NO_NETWORK,
			!grant.connectSrc.startsWith("*"),
		);
		return { worker, manifest };
	}

	private async init(source: string, network: boolean, restricted: boolean) {
		const wasm = await physicsWasm();
		return new Promise<RawPluginManifest>((resolve, reject) => {
			if (this.dead) {
				reject(new PluginRuntimeError(this.deathReason));
				return;
			}
			const timer = setTimeout(() => {
				this.terminate();
				reject(new PluginLoadError({ code: "timeout" }, "timeout"));
			}, INIT_TIMEOUT_MS);
			this.initWaiter = {
				resolve: (manifest) => {
					clearTimeout(timer);
					resolve(manifest);
				},
				reject: (error) => {
					clearTimeout(timer);
					reject(error);
				},
			};
			this.spawned.port.postMessage({
				t: "init",
				source,
				wasm: wasm.slice(0),
				network,
				restricted,
			});
		});
	}

	call(
		target: CallTarget,
		args: unknown[],
		ctx: CallContext,
		hooks: CallHooks = {},
	) {
		const id = ++this.lastId;
		const promise = new Promise<unknown>((resolve, reject) => {
			if (this.dead) {
				reject(new PluginRuntimeError("Plugin worker is not running"));
				return;
			}
			const entry: PendingCall = { resolve, reject, hooks };
			if (hooks.timeoutMs) {
				entry.timer = setTimeout(() => {
					this.crash(`Timed out after ${hooks.timeoutMs} ms`);
				}, hooks.timeoutMs);
			}
			this.calls.set(id, entry);
			this.spawned.port.postMessage({ t: "call", id, target, args, ctx });
		});
		return { id, promise };
	}

	rebind(host: WorkerHost) {
		this.host = host;
	}

	abort(id: number) {
		if (!this.dead) this.spawned.port.postMessage({ t: "abort", id });
	}

	floor(id: number, row: Row | undefined) {
		if (!this.dead) this.spawned.port.postMessage({ t: "floor", id, row });
	}

	terminate() {
		if (this.dead) return;
		this.dead = true;
		this.spawned.terminate();
		this.rejectAll(new PluginRuntimeError("Plugin worker was stopped"));
	}

	private crash(message: string) {
		if (this.dead) return;
		this.host.onLog("error", message);
		this.deathReason = message;
		this.dead = true;
		this.spawned.terminate();
		const error = new PluginRuntimeError(message);
		this.initWaiter?.reject(error);
		this.rejectAll(error);
	}

	private rejectAll(error: Error) {
		for (const entry of this.calls.values()) {
			clearTimeout(entry.timer);
			entry.reject(error);
		}
		this.calls.clear();
	}

	private settle(id: number, settle: (entry: PendingCall) => void) {
		const entry = this.calls.get(id);
		if (!entry) return;
		clearTimeout(entry.timer);
		this.calls.delete(id);
		settle(entry);
	}

	private reply(rid: number, work: Promise<unknown>) {
		work.then(
			(value) =>
				!this.dead &&
				this.spawned.port.postMessage({ t: "reply", rid, ok: true, value }),
			(error: unknown) =>
				!this.dead &&
				this.spawned.port.postMessage({
					t: "reply",
					rid,
					ok: false,
					error: error instanceof Error ? error.message : String(error),
				}),
		);
	}

	private windowStart = 0;
	private windowCount = 0;

	private flooding() {
		const now = performance.now();
		if (now - this.windowStart > 1000) {
			this.windowStart = now;
			this.windowCount = 0;
		}
		return ++this.windowCount > MESSAGES_PER_SECOND;
	}

	private receive(message: WorkerToMain) {
		if (this.dead) return;
		if (this.flooding()) {
			this.crash("Plugin sent too many messages and was stopped");
			return;
		}
		switch (message.t) {
			case "ready":
				this.initWaiter?.resolve(message.manifest);
				this.initWaiter = null;
				break;
			case "init-error":
				this.initWaiter?.reject(
					new PluginLoadError(message.error, message.message),
				);
				this.initWaiter = null;
				this.terminate();
				break;
			case "result":
				this.settle(message.id, (entry) => entry.resolve(message.value));
				break;
			case "error":
				this.settle(message.id, (entry) =>
					entry.reject(new PluginRuntimeError(message.message, message.stack)),
				);
				break;
			case "rows":
				if (
					!Array.isArray(message.rows) ||
					message.rows.length > MAX_ROWS_PER_MESSAGE
				) {
					this.crash("Plugin sent an invalid batch of rows");
					return;
				}
				this.calls.get(message.id)?.hooks.onRows?.(message.rows);
				break;
			case "progress":
				this.calls.get(message.id)?.hooks.onProgress?.(message.value);
				break;
			case "request": {
				const hooks = this.calls.get(message.id)?.hooks;
				this.reply(
					message.rid,
					!hooks
						? Promise.reject(
								new Error("Host calls are only allowed during an active call"),
							)
						: message.method === "next"
							? hooks?.onNext
								? hooks.onNext(message.payload)
								: Promise.reject(new Error("next() is only available in slots"))
							: this.host.request(message.method, message.payload, {
									depth: hooks?.depth ?? 0,
									intentAt: hooks?.intentAt,
								}),
				);
				break;
			}
			case "log":
				this.host.onLog(message.level, String(message.text));
				break;
		}
	}
}
