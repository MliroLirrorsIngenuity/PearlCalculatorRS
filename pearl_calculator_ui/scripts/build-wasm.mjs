import path from "node:path";
import {
	ensureDir,
	getInstalledWasmBindgenVersion,
	getRequiredWasmBindgenVersion,
	hasRustTarget,
	PKG_DIR,
	ROOT_DIR,
	resolveTool,
	run,
	WASM_OUTPUT,
} from "./wasm-utils.mjs";

const target = "wasm32-unknown-unknown";
const requiredVersion = getRequiredWasmBindgenVersion();

if (!hasRustTarget(target)) {
	console.error(`Missing Rust target ${target}.`);
	console.error(
		`Run \`pnpm setup:wasm\` from ${path.relative(process.cwd(), path.join(ROOT_DIR, "pearl_calculator_ui")) || "."} first.`,
	);
	process.exit(1);
}

const installedVersion = getInstalledWasmBindgenVersion();
if (!installedVersion) {
	console.error(`Missing wasm-bindgen-cli v${requiredVersion}.`);
	console.error(`Run \`pnpm setup:wasm\` first.`);
	process.exit(1);
}

if (installedVersion !== requiredVersion) {
	console.error(
		`wasm-bindgen-cli version mismatch: expected v${requiredVersion}, found v${installedVersion}.`,
	);
	console.error("Run `pnpm setup:wasm` to install the matching CLI.");
	process.exit(1);
}

console.log("Building pearl_calculator_wasm...");
run("cargo", [
	"build",
	"-p",
	"pearl_calculator_wasm",
	"--target",
	target,
	"--release",
	"--manifest-path",
	path.join(ROOT_DIR, "Cargo.toml"),
]);

ensureDir(PKG_DIR);

console.log("Generating JS bindings with wasm-bindgen...");
run(resolveTool("wasm-bindgen"), [
	WASM_OUTPUT,
	"--out-dir",
	PKG_DIR,
	"--target",
	"bundler",
]);

console.log(`WASM package generated in ${PKG_DIR}.`);
