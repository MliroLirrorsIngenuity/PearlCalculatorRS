import type {
	PanelContext,
	PanelDefinition,
	PluginDefinition,
	Text,
	ToolDefinition,
} from "@/plugins/pearlcalc-plugin";
import type {
	CallContext,
	CallTarget,
	MainToWorker,
	ManifestError,
	RawPluginManifest,
	WorkerToMain,
} from "./protocol";
import type {
	createPluginApi,
	createTopN,
	PhysicsExports,
	Row,
	TopN,
} from "./shared";

type AnyTool = ToolDefinition<unknown, Row>;
type Callable = (...args: unknown[]) => unknown;

interface CallState {
	aborted: boolean;
	floor: Row | undefined;
	topN: TopN | undefined;
}

export function workerMain(
	makeTopN: typeof createTopN,
	makeApi: typeof createPluginApi,
) {
	const SLOT_NAMES = [
		"solve",
		"trace",
		"simulate",
		"bits",
		"copy",
		"importConfig",
		"exportConfig",
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
	const PERMISSIONS = ["network", "clipboard-read", "full-access"];
	const MOUNTS = [
		"calculator.general",
		"calculator.config",
		"trace",
		"simulator.inputs",
		"simulator.results",
		"page",
	];
	const ID_PATTERN = /^[a-z0-9][a-z0-9._-]{1,63}$/i;
	const TOOL_ID_PATTERN = /^[a-z0-9][a-z0-9._-]{0,63}$/i;
	const HOST_PATTERN =
		/^(https?|wss?):\/\/[a-z0-9-]+(\.[a-z0-9-]+)*(:\d{1,5})?$/i;
	const LEVELS = ["log", "info", "warn", "error", "debug"] as const;

	const scope = self as unknown as {
		onmessage: ((event: MessageEvent) => void) | null;
	};
	const dynamicImport = new Function("url", "return import(url)") as (
		url: string,
	) => Promise<{ default?: unknown }>;
	const pending = new Map<
		number,
		{ resolve: (value: unknown) => void; reject: (error: Error) => void }
	>();
	const calls = new Map<number, CallState>();
	let port: MessagePort | null = null;
	let wasm: PhysicsExports | null = null;
	let plugin: PluginDefinition | null = null;
	let nextRid = 1;

	const post = (message: WorkerToMain) => port?.postMessage(message);

	const format = (value: unknown): string => {
		if (typeof value === "string") return value;
		if (value instanceof Error) return value.stack ?? value.message;
		try {
			return JSON.stringify(value) ?? String(value);
		} catch {
			return String(value);
		}
	};

	const log = (level: (typeof LEVELS)[number], args: unknown[]) =>
		post({ t: "log", level, text: args.map(format).join(" ") });

	for (const level of LEVELS) {
		console[level] = (...args: unknown[]) => log(level, args);
	}

	const request = (id: number, method: string, payload: unknown) =>
		new Promise<unknown>((resolve, reject) => {
			const rid = nextRid++;
			pending.set(rid, { resolve, reject });
			post({ t: "request", rid, id, method, payload });
		});

	const lockNetwork = () => {
		const denied = () => {
			throw new Error('Network access requires the "network" permission');
		};
		for (const name of [
			"fetch",
			"XMLHttpRequest",
			"WebSocket",
			"WebSocketStream",
			"WebTransport",
			"EventSource",
			"FontFace",
			"importScripts",
		]) {
			if (!(name in self)) continue;
			Object.defineProperty(self, name, {
				configurable: false,
				writable: false,
				value: denied,
			});
		}
	};

	const sandboxIntact = async (restricted: boolean) => {
		try {
			(self as unknown as { importScripts(url: string): void }).importScripts(
				"data:text/javascript,",
			);
			return false;
		} catch {}
		if (!restricted) return true;
		return fetch("data:text/plain,").then(
			() => false,
			() => true,
		);
	};

	const lockSpawning = () => {
		for (const name of ["Worker", "SharedWorker"]) {
			if (!(name in self)) continue;
			Object.defineProperty(self, name, {
				configurable: false,
				writable: false,
				value: () => {
					throw new Error("Plugins cannot start their own workers");
				},
			});
		}
	};

	const loadWasm = async (bytes: ArrayBuffer) => {
		const module = await WebAssembly.compile(bytes);
		const imports: Record<string, Record<string, () => never>> = {};
		for (const entry of WebAssembly.Module.imports(module)) {
			imports[entry.module] ??= {};
			imports[entry.module][entry.name] = () => {
				throw new Error(`${entry.name} is unavailable in plugin workers`);
			};
		}
		const instance = await WebAssembly.instantiate(module, imports);
		return instance.exports as unknown as PhysicsExports;
	};

	const fail = (code: string, params?: ManifestError["params"]): never => {
		throw { manifestError: { code, params } };
	};

	const plain = <T>(value: T): T =>
		value === undefined ? value : JSON.parse(JSON.stringify(value));

	const isText = (value: unknown) =>
		typeof value === "string" ||
		(value !== null &&
			typeof value === "object" &&
			!Array.isArray(value) &&
			Object.keys(value).length > 0 &&
			Object.values(value).every((entry) => typeof entry === "string"));

	const optionalText = (value: unknown) => value === undefined || isText(value);

	const textOrUndefined = (value: unknown) =>
		(isText(value) ? plain(value) : undefined) as Text | undefined;

	const checkFields = (fields: unknown, where: string) => {
		if (fields === undefined) return [];
		if (!Array.isArray(fields)) return fail("fields_not_array", { where });
		const seen = new Set<string>();
		for (const field of fields) {
			if (!field || typeof field.key !== "string" || !field.key) {
				fail("field_key", { where });
			}
			if (seen.has(field.key))
				fail("field_duplicate", { where, key: field.key });
			seen.add(field.key);
			if (!isText(field.label) || !optionalText(field.description)) {
				fail("field_label", { where, key: field.key });
			}
			if (!FIELD_TYPES.includes(field.type)) {
				fail("field_type", { where, key: field.key, type: String(field.type) });
			}
			if (
				field.type === "select" &&
				(!Array.isArray(field.options) ||
					field.options.some(
						(option: { value?: unknown; label?: unknown }) =>
							!option ||
							typeof option.value !== "string" ||
							!isText(option.label),
					))
			) {
				fail("field_options", { where, key: field.key });
			}
		}
		return plain(fields);
	};

	const checkColumns = (columns: unknown, where: string) => {
		if (columns === undefined) return [];
		if (!Array.isArray(columns)) return fail("columns_not_array", { where });
		for (const column of columns) {
			if (!column || typeof column.key !== "string" || !isText(column.label)) {
				fail("column", { where });
			}
		}
		return plain(columns);
	};

	const describePanels = (panels: unknown, toolIds: Set<string>) => {
		if (panels === undefined) return [];
		if (!Array.isArray(panels)) return fail("panels_not_array");
		const seen = new Set<string>();
		return (panels as PanelDefinition[]).map((panel) => {
			if (
				!panel ||
				typeof panel.id !== "string" ||
				!TOOL_ID_PATTERN.test(panel.id)
			) {
				fail("panel_id", { id: String(panel?.id) });
			}
			if (seen.has(panel.id)) fail("panel_duplicate", { id: panel.id });
			seen.add(panel.id);
			if (!MOUNTS.includes(panel.mount)) {
				fail("panel_mount", { id: panel.id, mount: String(panel.mount) });
			}
			if (panel.mount === "page" && toolIds.has(panel.id)) {
				fail("tool_duplicate", { id: panel.id });
			}
			if (
				panel.mount === "page"
					? !isText(panel.title)
					: !optionalText(panel.title)
			) {
				fail("panel_title", { id: panel.id });
			}
			if (
				typeof panel.render !== "function" ||
				(panel.state !== undefined && typeof panel.state !== "function")
			) {
				fail("panel_render", { id: panel.id });
			}
			const handlers = panel.on ?? {};
			if (typeof handlers !== "object" || Array.isArray(handlers)) {
				fail("panel_handlers", { id: panel.id });
			}
			return {
				id: panel.id,
				mount: panel.mount,
				title: textOrUndefined(panel.title),
				hasState: typeof panel.state === "function",
				handlers: Object.keys(handlers).filter(
					(name) => typeof handlers[name] === "function",
				),
			};
		});
	};

	const describe = (value: unknown): RawPluginManifest => {
		if (!value || typeof value !== "object") return fail("no_default_export");
		const definition = value as PluginDefinition;
		if (definition.apiVersion !== 1) {
			fail("api_version", { version: String(definition.apiVersion) });
		}
		if (typeof definition.id !== "string" || !ID_PATTERN.test(definition.id)) {
			fail("id", { id: String(definition.id) });
		}
		if (
			!isText(definition.name) ||
			(typeof definition.name === "string" && !definition.name.trim()) ||
			!optionalText(definition.description)
		) {
			fail("name");
		}
		if (typeof definition.version !== "string" || !definition.version.trim()) {
			fail("version");
		}
		const permissions = definition.permissions ?? [];
		if (!Array.isArray(permissions)) fail("permissions");
		for (const permission of permissions) {
			if (!PERMISSIONS.includes(permission)) {
				fail("permission", { permission: String(permission) });
			}
		}
		const networkHosts = definition.networkHosts ?? [];
		if (
			!Array.isArray(networkHosts) ||
			networkHosts.some(
				(host) => typeof host !== "string" || !HOST_PATTERN.test(host),
			)
		) {
			fail("network_hosts");
		}
		if (networkHosts.length > 0 && !permissions.includes("network")) {
			fail("network_hosts_permission");
		}
		if (
			definition.main !== undefined &&
			(typeof definition.main !== "function" ||
				!permissions.includes("full-access"))
		) {
			fail("main_permission");
		}
		if (definition.physics !== undefined && definition.physics !== "custom") {
			fail("physics", { physics: String(definition.physics) });
		}
		const slots = definition.slots ?? {};
		for (const [name, handler] of Object.entries(slots)) {
			if (!SLOT_NAMES.includes(name)) fail("slot_unknown", { slot: name });
			if (typeof handler !== "function") fail("slot_type", { slot: name });
		}
		const tools = definition.tools ?? [];
		if (!Array.isArray(tools)) fail("tools_not_array");
		const toolIds = new Set<string>();
		const toolManifests = tools.map((tool) => {
			if (
				!tool ||
				typeof tool.id !== "string" ||
				!TOOL_ID_PATTERN.test(tool.id)
			) {
				fail("tool_id", { id: String(tool?.id) });
			}
			if (toolIds.has(tool.id)) fail("tool_duplicate", { id: tool.id });
			toolIds.add(tool.id);
			if (!isText(tool.title) || !optionalText(tool.description)) {
				fail("tool_title", { id: tool.id });
			}
			if (typeof tool.runShard !== "function") {
				fail("tool_run_shard", { id: tool.id });
			}
			if (
				tool.limit !== undefined &&
				!(typeof tool.limit === "number"
					? Number.isInteger(tool.limit) && tool.limit > 0
					: typeof tool.limit === "string" &&
						(tool.inputs ?? []).some((field) => field.key === tool.limit))
			) {
				fail("tool_limit", { id: tool.id });
			}
			if (tool.sortBy !== undefined && !Array.isArray(tool.sortBy)) {
				fail("tool_sort", { id: tool.id });
			}
			const where = `tools.${tool.id}`;
			return {
				id: tool.id,
				title: plain(tool.title),
				description: textOrUndefined(tool.description),
				inputs: checkFields(tool.inputs, `${where}.inputs`),
				columns: checkColumns(tool.columns, `${where}.columns`),
				sortBy: plain(tool.sortBy),
				limit: tool.limit,
				has: {
					validate: typeof tool.validate === "function",
					plan: typeof tool.plan === "function",
					finalize: typeof tool.finalize === "function",
					detail: typeof tool.detail === "function",
					copy: typeof tool.copy === "function",
				},
				actions: Object.keys(tool.actions ?? {}).filter(
					(name) => typeof tool.actions?.[name] === "function",
				),
			};
		});
		const fileTypes = definition.fileTypes ?? [];
		if (
			!Array.isArray(fileTypes) ||
			fileTypes.some((type) => typeof type !== "string")
		) {
			fail("file_types");
		}
		return {
			apiVersion: 1,
			id: definition.id,
			name:
				typeof definition.name === "string"
					? definition.name.trim()
					: plain(definition.name),
			version: definition.version.trim(),
			author:
				typeof definition.author === "string" ? definition.author : undefined,
			description: textOrUndefined(definition.description),
			permissions: Array.from(new Set(permissions)),
			networkHosts: networkHosts.map((host) => host.toLowerCase()),
			physics: definition.physics,
			fileTypes: fileTypes.map((type) => type.replace(/^\./, "").toLowerCase()),
			settings: checkFields(definition.settings, "settings"),
			calculatorInputs: checkFields(
				definition.calculatorInputs,
				"calculatorInputs",
			),
			simulatorInputs: checkFields(
				definition.simulatorInputs,
				"simulatorInputs",
			),
			resultColumns: checkColumns(definition.resultColumns, "resultColumns"),
			slots: Object.keys(slots) as RawPluginManifest["slots"],
			tools: toolManifests,
			panels: describePanels(definition.panels, toolIds),
			hasMain: typeof definition.main === "function",
		};
	};

	const hostContext = (id: number, ctx: CallContext) => ({
		pc: makeApi(wasm as PhysicsExports, ctx.version, (method, payload) =>
			request(id, method, payload),
		),
		locale: ctx.locale,
		version: ctx.version,
		mode: ctx.mode,
		config: ctx.config,
		calculator: ctx.calculator,
		settings: ctx.settings,
		inputs: ctx.inputs,
		simulatorInputs: ctx.simulatorInputs,
		input: ctx.input ?? {},
		panel: ctx.panel,
		view: ctx.view ?? {},
		log: (...args: unknown[]) => log("log", args),
	});

	const runShard = async (
		id: number,
		tool: AnyTool,
		shard: unknown,
		ctx: CallContext,
		state: CallState,
	) => {
		const topN = makeTopN(ctx.sortBy, ctx.limit ?? 100);
		topN.setFloor(state.floor);
		state.topN = topN;
		let outgoing: Row[] = [];
		let lastFlush = performance.now();
		let lastProgress = 0;
		let counter = 0;
		const flush = () => {
			if (outgoing.length > 0) {
				post({ t: "rows", id, rows: outgoing });
				outgoing = [];
			}
			lastFlush = performance.now();
		};
		await tool.runShard.call(tool, shard, {
			...hostContext(id, ctx),
			signal: {
				get aborted() {
					return state.aborted;
				},
			},
			accepts: (row: Row) => topN.accepts(row),
			emit: (row: Row) => {
				if (row === null || typeof row !== "object") {
					throw new Error("emit() expects an object");
				}
				const accepted = topN.offer(row);
				if (accepted) outgoing.push(row);
				if (
					(accepted || (++counter & 1023) === 0) &&
					performance.now() - lastFlush > 150
				) {
					flush();
				}
			},
			progress: (fraction: number) => {
				const now = performance.now();
				if (now - lastProgress < 100) return;
				lastProgress = now;
				post({
					t: "progress",
					id,
					value: Math.max(0, Math.min(1, Number(fraction) || 0)),
				});
			},
		});
		flush();
		return null;
	};

	const invoke = async (
		id: number,
		target: CallTarget,
		args: unknown[],
		ctx: CallContext,
		state: CallState,
	) => {
		const definition = plugin as PluginDefinition;
		if (target.kind === "slot") {
			const slots = definition.slots as Record<string, Callable>;
			return slots[target.name].call(
				slots,
				args[0],
				(value: unknown) => request(id, "next", value),
				hostContext(id, ctx),
			);
		}
		if (target.kind === "panel") {
			const panel = definition.panels?.find(
				(entry) => entry.id === target.panel,
			);
			if (!panel) throw new Error(`Unknown panel: ${target.panel}`);
			const context = {
				...hostContext(id, ctx),
				panel: target.panel,
			} as PanelContext;
			if (target.fn === "state") {
				return panel.state ? panel.state.call(panel, context) : null;
			}
			if (target.fn === "render") {
				return panel.render.call(panel, args[0] as never, context);
			}
			const handler = target.name ? panel.on?.[target.name] : undefined;
			if (typeof handler !== "function") {
				throw new Error(`Unknown panel handler: ${target.name}`);
			}
			return handler.call(
				panel.on,
				args[0] as never,
				args[1] as never,
				context,
			);
		}
		const tool = definition.tools?.find((entry) => entry.id === target.tool) as
			| AnyTool
			| undefined;
		if (!tool) throw new Error(`Unknown tool: ${target.tool}`);
		if (target.kind === "action") {
			const action = tool.actions?.[target.name];
			if (typeof action !== "function") {
				throw new Error(`Unknown action: ${target.name}`);
			}
			return action.call(tool.actions, args[0], hostContext(id, ctx));
		}
		if (target.fn === "runShard") {
			return runShard(id, tool, args[0], ctx, state);
		}
		const fn = tool[target.fn] as Callable | undefined;
		if (typeof fn !== "function") {
			throw new Error(`Tool ${tool.id} has no ${target.fn}()`);
		}
		return fn.call(tool, args[0], hostContext(id, ctx));
	};

	const call = async (message: Extract<MainToWorker, { t: "call" }>) => {
		const state: CallState = {
			aborted: false,
			floor: undefined,
			topN: undefined,
		};
		calls.set(message.id, state);
		try {
			const value = await invoke(
				message.id,
				message.target,
				message.args,
				message.ctx,
				state,
			);
			post({ t: "result", id: message.id, value });
		} catch (error) {
			post({
				t: "error",
				id: message.id,
				message: error instanceof Error ? error.message : format(error),
				stack: error instanceof Error ? error.stack : undefined,
			});
		} finally {
			calls.delete(message.id);
		}
	};

	const init = async (message: Extract<MainToWorker, { t: "init" }>) => {
		try {
			if (!(await sandboxIntact(message.restricted))) {
				fail("sandbox_unavailable");
			}
			if (!message.network) lockNetwork();
			lockSpawning();
			wasm = await loadWasm(message.wasm);
			const url = URL.createObjectURL(
				new Blob([message.source], { type: "text/javascript" }),
			);
			try {
				plugin = (await dynamicImport(url)).default as PluginDefinition;
			} finally {
				URL.revokeObjectURL(url);
			}
			post({ t: "ready", manifest: describe(plugin) });
		} catch (error) {
			const manifestError = (error as { manifestError?: ManifestError })
				?.manifestError;
			post({
				t: "init-error",
				error: manifestError ?? { code: "load_failed" },
				message: manifestError ? manifestError.code : format(error),
			});
		}
	};

	const handle = (event: MessageEvent<MainToWorker>) => {
		const message = event.data;
		switch (message.t) {
			case "init":
				void init(message);
				break;
			case "call":
				void call(message);
				break;
			case "abort": {
				const state = calls.get(message.id);
				if (state) state.aborted = true;
				break;
			}
			case "floor": {
				const state = calls.get(message.id);
				if (state) {
					state.floor = message.row;
					state.topN?.setFloor(message.row);
				}
				break;
			}
			case "reply": {
				const entry = pending.get(message.rid);
				if (!entry) break;
				pending.delete(message.rid);
				if (message.ok) entry.resolve(message.value);
				else entry.reject(new Error(message.error));
				break;
			}
		}
	};

	scope.onmessage = (event) => {
		if (event.data?.t !== "port") return;
		port = event.ports[0];
		port.onmessage = handle;
	};
}
