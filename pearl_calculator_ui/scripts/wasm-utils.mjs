import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const UI_DIR = path.resolve(__dirname, "..");
export const ROOT_DIR = path.resolve(UI_DIR, "..");
export const TOOLS_DIR = path.join(ROOT_DIR, "target", "tools");
export const PKG_DIR = path.join(ROOT_DIR, "pearl_calculator_wasm", "pkg");
export const WASM_OUTPUT = path.join(
	ROOT_DIR,
	"target",
	"wasm32-unknown-unknown",
	"release",
	"pearl_calculator_wasm.wasm",
);

function binaryName(name) {
	return process.platform === "win32" ? `${name}.exe` : name;
}

export function localToolPath(name) {
	return path.join(TOOLS_DIR, "bin", binaryName(name));
}

export function resolveTool(name) {
	const local = localToolPath(name);
	if (fs.existsSync(local)) {
		return local;
	}

	return binaryName(name);
}

export function run(command, args, options = {}) {
	const result = spawnSync(command, args, {
		cwd: ROOT_DIR,
		stdio: "inherit",
		...options,
	});

	if (result.status !== 0) {
		process.exit(result.status ?? 1);
	}
}

export function capture(command, args, options = {}) {
	return execFileSync(command, args, {
		cwd: ROOT_DIR,
		encoding: "utf8",
		...options,
	}).trim();
}

export function getRequiredWasmBindgenVersion() {
	const output = capture("cargo", [
		"tree",
		"-p",
		"wasm-bindgen",
		"--depth",
		"0",
		"--manifest-path",
		path.join(ROOT_DIR, "Cargo.toml"),
	]);
	const firstLine = output.split(/\r?\n/, 1)[0] ?? "";
	const match = firstLine.match(/\bwasm-bindgen v([^\s]+)/);

	if (!match) {
		throw new Error(
			`Unable to determine wasm-bindgen version from: ${firstLine}`,
		);
	}

	return match[1];
}

export function hasRustTarget(target) {
	const installed = capture("rustup", ["target", "list", "--installed"]);
	return installed.split(/\r?\n/).includes(target);
}

export function ensureDir(dir) {
	fs.mkdirSync(dir, { recursive: true });
}

export function getInstalledWasmBindgenVersion() {
	const wasmBindgen = resolveTool("wasm-bindgen");

	try {
		const output = capture(wasmBindgen, ["--version"]);
		const match = output.match(/\b(\d+\.\d+\.\d+)\b/);
		return match?.[1] ?? "";
	} catch {
		return "";
	}
}
