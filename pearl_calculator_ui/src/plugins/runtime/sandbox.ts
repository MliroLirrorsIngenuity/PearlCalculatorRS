import { createPluginApi, createTopN } from "./shared";
import { workerMain } from "./worker-main";

type FrameMessage =
	| { t: "frame-ready" }
	| { t: "worker-error"; wid: number; message: string };

export function frameMain(runtimeSource: string) {
	const runtimeUrl = URL.createObjectURL(
		new Blob([runtimeSource], { type: "text/javascript" }),
	);
	const workers = new Map<number, Worker>();
	const report = (wid: number, message: string) =>
		parent.postMessage({ t: "worker-error", wid, message }, "*");

	addEventListener("message", (event: MessageEvent) => {
		if (event.source !== parent) return;
		const data = event.data;
		if (data?.t === "spawn") {
			try {
				const worker = new Worker(runtimeUrl);
				worker.onerror = (error) =>
					report(data.wid, error.message || "Plugin worker crashed");
				worker.postMessage({ t: "port" }, [event.ports[0]]);
				workers.set(data.wid, worker);
			} catch (error) {
				report(data.wid, String(error));
			}
		} else if (data?.t === "terminate") {
			workers.get(data.wid)?.terminate();
			workers.delete(data.wid);
		}
	});
	parent.postMessage({ t: "frame-ready" }, "*");
}

export function runtimeSource() {
	return `(${workerMain.toString()})(${createTopN.toString()}, ${createPluginApi.toString()});`;
}

const scriptLiteral = (value: string) =>
	JSON.stringify(value)
		.replace(/</g, "\\u003c")
		.split("\u2028")
		.join("\\u2028")
		.split("\u2029")
		.join("\\u2029");

export const NO_NETWORK = "'none'";

export function contentSecurityPolicy(connectSrc: string, extra = "") {
	return [
		"default-src 'none'",
		"script-src 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' blob:",
		"style-src 'unsafe-inline'",
		"worker-src blob:",
		`connect-src ${connectSrc}`,
		extra,
	]
		.filter(Boolean)
		.join("; ");
}

function frameDocument(connectSrc: string) {
	return `<!doctype html><html><head><meta http-equiv="Content-Security-Policy" content="${contentSecurityPolicy(connectSrc)}"></head><body><script>(${frameMain.toString()})(${scriptLiteral(runtimeSource())});</script></body></html>`;
}

const attribute = (value: string) =>
	value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");

function htmlRelay() {
	const inner = document.querySelector("iframe") as HTMLIFrameElement;
	addEventListener("message", (event: MessageEvent) => {
		const data = event.data;
		if (event.source === inner.contentWindow && data?.t === "pc-action") {
			parent.postMessage(data, "*");
		} else if (event.source === parent && data?.t === "pc-action-result") {
			inner.contentWindow?.postMessage(data, "*");
		}
	});
}

export function htmlViewDocument(
	innerDocument: string,
	scripts: boolean,
	connectSrc: string,
): string {
	const policy = [
		"default-src 'none'",
		`script-src 'unsafe-inline'${scripts ? " 'unsafe-eval' 'wasm-unsafe-eval' blob:" : ""}`,
		"style-src 'unsafe-inline'",
		"img-src data: blob:",
		"font-src data:",
		`connect-src ${connectSrc}`,
		"frame-src 'none'",
		"form-action 'none'",
	].join("; ");
	return `<!doctype html><html><head><meta http-equiv="x-dns-prefetch-control" content="off"><meta http-equiv="Content-Security-Policy" content="${policy}"><style>html,body{margin:0;height:100%;overflow:hidden}iframe{display:block;border:0;width:100%;height:100%}</style></head><body><iframe sandbox="${scripts ? "allow-scripts" : ""}" srcdoc="${attribute(innerDocument)}"></iframe><script>(${htmlRelay.toString()})();</script></body></html>`;
}

export interface SpawnedPort {
	port: MessagePort;
	terminate: () => void;
}

class Sandbox {
	private readonly frame: HTMLIFrameElement;
	private readonly ready: Promise<void>;
	private readonly crashHandlers = new Map<number, (message: string) => void>();
	private readonly listener: (event: MessageEvent<FrameMessage>) => void;
	private lastId = 0;

	constructor(connectSrc: string) {
		this.frame = document.createElement("iframe");
		this.frame.setAttribute("sandbox", "allow-scripts");
		this.frame.setAttribute("aria-hidden", "true");
		this.frame.tabIndex = -1;
		this.frame.style.display = "none";
		this.frame.srcdoc = frameDocument(connectSrc);
		let resolveReady: () => void = () => {};
		this.ready = new Promise((resolve) => {
			resolveReady = resolve;
		});
		this.listener = (event) => {
			if (event.source !== this.frame.contentWindow) return;
			if (event.data?.t === "frame-ready") resolveReady();
			if (event.data?.t === "worker-error") {
				this.crashHandlers.get(event.data.wid)?.(event.data.message);
			}
		};
		window.addEventListener("message", this.listener);
		document.body.appendChild(this.frame);
	}

	destroy() {
		for (const handler of this.crashHandlers.values()) {
			handler("Plugin sandbox was removed");
		}
		this.crashHandlers.clear();
		window.removeEventListener("message", this.listener);
		this.frame.remove();
	}

	async spawn(onCrash: (message: string) => void): Promise<SpawnedPort> {
		await this.ready;
		const channel = new MessageChannel();
		const wid = ++this.lastId;
		this.crashHandlers.set(wid, onCrash);
		this.frame.contentWindow?.postMessage({ t: "spawn", wid }, "*", [
			channel.port2,
		]);
		return {
			port: channel.port1,
			terminate: () => {
				this.crashHandlers.delete(wid);
				this.frame.contentWindow?.postMessage({ t: "terminate", wid }, "*");
				channel.port1.close();
			},
		};
	}
}

const sandboxes = new Map<string, { owner: string; sandbox: Sandbox }>();

export function spawnSandboxedWorker(
	owner: string,
	connectSrc: string,
	onCrash: (message: string) => void,
) {
	const key = `${owner}\n${connectSrc}`;
	let entry = sandboxes.get(key);
	if (!entry) {
		entry = { owner, sandbox: new Sandbox(connectSrc) };
		sandboxes.set(key, entry);
	}
	return entry.sandbox.spawn(onCrash);
}

export function destroySandboxes(owner: string) {
	for (const [key, entry] of sandboxes) {
		if (entry.owner !== owner) continue;
		entry.sandbox.destroy();
		sandboxes.delete(key);
	}
}
