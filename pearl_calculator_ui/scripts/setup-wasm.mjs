import {
	getInstalledWasmBindgenVersion,
	getRequiredWasmBindgenVersion,
	hasRustTarget,
	localToolPath,
	resolveTool,
	run,
	TOOLS_DIR,
} from "./wasm-utils.mjs";

const target = "wasm32-unknown-unknown";
const requiredVersion = getRequiredWasmBindgenVersion();

if (!hasRustTarget(target)) {
	console.log(`Installing Rust target ${target}...`);
	run("rustup", ["target", "add", target]);
} else {
	console.log(`Rust target ${target} is already installed.`);
}

const installedVersion = getInstalledWasmBindgenVersion();

if (installedVersion !== requiredVersion) {
	if (installedVersion) {
		console.log(
			`Installing wasm-bindgen-cli v${requiredVersion} (current: v${installedVersion}) into ${TOOLS_DIR}...`,
		);
	} else {
		console.log(
			`Installing wasm-bindgen-cli v${requiredVersion} into ${TOOLS_DIR}...`,
		);
	}

	run("cargo", [
		"install",
		"wasm-bindgen-cli",
		"--version",
		requiredVersion,
		"--locked",
		"--root",
		TOOLS_DIR,
		"--force",
	]);

	console.log(`wasm-bindgen-cli is ready at ${localToolPath("wasm-bindgen")}.`);
} else {
	console.log(
		`wasm-bindgen-cli v${requiredVersion} is already available at ${resolveTool("wasm-bindgen")}.`,
	);
}

console.log("WASM toolchain is ready.");
