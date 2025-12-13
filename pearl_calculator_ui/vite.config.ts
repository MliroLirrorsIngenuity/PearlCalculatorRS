import fs from "fs";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const host = process.env.TAURI_DEV_HOST;
const wasmPkgPath = path.resolve(__dirname, "../pearl_calculator_wasm/pkg/pearl_calculator_wasm.js");

if (!fs.existsSync(wasmPkgPath)) {
  console.error(`
\x1b[31m╔══════════════════════════════════════════════════════════════════════════════╗
║                         WASM MODULE NOT FOUND                                ║
╠══════════════════════════════════════════════════════════════════════════════╣\x1b[0m

  The WASM module has not been built yet.
  This is a one-time setup required before development.

\x1b[33m  Run the following commands:

    rustup target add wasm32-unknown-unknown

    VERSION=$(cargo tree -p wasm-bindgen --depth 0 | head -n 1 | \\            
            cut -d' ' -f2 | cut -c 2-)

    cargo install wasm-bindgen-cli --version "$VERSION"

  Then run again to build the WASM module.                          

\x1b[31m╚══════════════════════════════════════════════════════════════════════════════╝\x1b[0m
`);
  process.exit(1);
}

export default defineConfig(async () => ({
  plugins: [react(), tailwindcss(), wasm(), topLevelAwait()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "pearl_calculator_wasm": wasmPkgPath,
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
