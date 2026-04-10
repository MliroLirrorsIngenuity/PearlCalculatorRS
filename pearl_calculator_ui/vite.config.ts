import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";
import { defineConfig } from "vite";
import topLevelAwait from "vite-plugin-top-level-await";
import wasm from "vite-plugin-wasm";

const host = process.env.TAURI_DEV_HOST;
const wasmPkgPath = path.resolve(
	__dirname,
	"../pearl_calculator_wasm/pkg/pearl_calculator_wasm.js",
);

if (!fs.existsSync(wasmPkgPath)) {
	console.error(`
\x1b[31m╔══════════════════════════════════════════════════════════════════════════════╗
║                         WASM MODULE NOT FOUND                                ║
╠══════════════════════════════════════════════════════════════════════════════╣\x1b[0m

  The WASM module has not been built yet.
  Initialize the WASM toolchain first, then build the module.

\x1b[33m  Run the following commands:

    pnpm setup:wasm
    pnpm build:wasm

  The CLI will be installed into the repository-local \`target/tools\`.
  After that, rerun \`cargo tauri dev\`.                          

\x1b[31m╚══════════════════════════════════════════════════════════════════════════════╝\x1b[0m
`);
	process.exit(1);
}

export default defineConfig(async () => ({
	plugins: [react(), tailwindcss(), wasm(), topLevelAwait()],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
			pearl_calculator_wasm: wasmPkgPath,
		},
	},

	clearScreen: false,
	server: {
		port: 1420,
		strictPort: true,
		host: host || false,
		hmr: host
			? {
					protocol: "ws",
					host,
					port: 1421,
				}
			: undefined,
		watch: {
			ignored: ["**/src-tauri/**"],
		},
	},
}));
