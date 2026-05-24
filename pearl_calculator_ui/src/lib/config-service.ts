import { open, save } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { type ImportedConfiguration, utilsRust } from "@/lib/utils-rust";
import { isTauri } from "@/services";

function stringifyConfig(config: unknown): string {
	return JSON.stringify(
		config,
		(_key, value) => (value instanceof Map ? Object.fromEntries(value) : value),
		2,
	);
}

export function parseConfigurationContent(
	content: string,
	path: string,
): ImportedConfiguration {
	return utilsRust.parse_configuration_content(content, path);
}

export async function loadConfiguration(): Promise<ImportedConfiguration | null> {
	try {
		if (isTauri) {
			const selected = await open({
				multiple: false,
				filters: [{ name: "Configuration", extensions: ["json"] }],
			});

			if (selected && typeof selected === "string") {
				const content = await readTextFile(selected);
				return parseConfigurationContent(content, selected);
			}
		} else {
			return new Promise((resolve, reject) => {
				const input = document.createElement("input");
				input.type = "file";
				input.accept = ".json";
				input.onchange = async (e) => {
					try {
						const file = (e.target as HTMLInputElement).files?.[0];
						if (file) {
							const content = await file.text();
							resolve(parseConfigurationContent(content, file.name));
						} else {
							resolve(null);
						}
					} catch (err) {
						reject(err);
					}
				};
				input.click();
			});
		}
	} catch (error) {
		console.error("Config load failed", error);
		throw error;
	}
	return null;
}

export async function exportConfiguration(
	config: unknown,
): Promise<string | null> {
	try {
		const content = stringifyConfig(config);

		if (isTauri) {
			const path = await save({
				filters: [{ name: "JSON", extensions: ["json"] }],
			});

			if (path) {
				await writeTextFile(path, content);
				return path;
			}
		} else {
			const blob = new Blob([content], { type: "application/json" });
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = "config.json";
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
			return "config.json";
		}
	} catch (error) {
		console.error("Config export failed", error);
		throw error;
	}
	return null;
}
