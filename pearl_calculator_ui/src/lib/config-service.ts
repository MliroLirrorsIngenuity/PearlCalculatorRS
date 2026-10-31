import { open, save } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import i18n from "i18next";
import {
	BitTemplateConfigSchema,
	GeneralConfigSchema,
	MultiplierConfigSchema,
} from "@/lib/schemas";
import { type ImportedConfiguration, utilsRust } from "@/lib/utils-rust";
import { runSlot } from "@/plugins/pipeline";
import { type ExportedPlugin, importFileTypes } from "@/plugins/store";
import { isTauri } from "@/services";

export const PLUGIN_EXTENSIONS = ["js", "mjs"];

function stringifyConfig(config: unknown): string {
	return JSON.stringify(
		config,
		(_key, value) => (value instanceof Map ? Object.fromEntries(value) : value),
		2,
	);
}

const MAX_SIDES = 64;

const sideCount = (value: unknown) =>
	Number.isInteger(value) &&
	(value as number) >= 0 &&
	(value as number) <= MAX_SIDES;

function checkImported(output: unknown): ImportedConfiguration {
	const imported = JSON.parse(stringifyConfig(output)) as ImportedConfiguration;
	const bits = BitTemplateConfigSchema.safeParse(imported?.bitTemplate);
	const multiplier = MultiplierConfigSchema.safeParse(
		imported?.multiplierTemplate,
	);
	return {
		config: GeneralConfigSchema.parse(imported?.config),
		bitTemplate:
			bits.success && sideCount(bits.data.SideMode) ? bits.data : null,
		multiplierTemplate:
			multiplier.success && sideCount(multiplier.data.MultiplierSideMode)
				? multiplier.data
				: null,
		path: imported.path,
		plugins: [],
	};
}

function withoutPlugins(value: unknown): unknown {
	if (!value || typeof value !== "object" || Array.isArray(value)) return value;
	const { Plugins: _plugins, ...rest } = value as Record<string, unknown>;
	return Array.isArray(rest.CannonSettings)
		? { ...rest, CannonSettings: rest.CannonSettings.map(withoutPlugins) }
		: rest;
}

function checkObject(output: unknown): Record<string, unknown> {
	if (!output || typeof output !== "object" || Array.isArray(output)) {
		throw new Error("exportConfig must return an object");
	}
	return output as Record<string, unknown>;
}

export function configExtensions() {
	return Array.from(new Set(["json", ...importFileTypes()]));
}

export function extensionOf(path: string) {
	return path.split(".").pop()?.toLowerCase() ?? "";
}

function embeddedPlugins(content: string, path: string) {
	try {
		return utilsRust.parse_configuration_content(content, path).plugins ?? [];
	} catch {
		return [];
	}
}

export async function importConfigurationContent(
	content: string,
	path: string,
): Promise<ImportedConfiguration> {
	const extension = extensionOf(path);
	const builtin = async (input: { name: string; content: string }) =>
		utilsRust.parse_configuration_content(input.content, path);
	const input = { name: path.split(/[\\/]/).pop() ?? path, content };
	const imported =
		extension === "json"
			? checkImported(await builtin(input))
			: await runSlot(
					"importConfig",
					input,
					builtin,
					checkImported,
					0,
					(plugin) =>
						plugin.manifest.permissions.length === 0 &&
						plugin.manifest.fileTypes.includes(extension),
				);
	return { ...imported, path, plugins: embeddedPlugins(content, path) };
}

function pickWebFile(accept: string) {
	return new Promise<File | null>((resolve) => {
		const input = document.createElement("input");
		input.type = "file";
		input.accept = accept;
		input.onchange = (event) =>
			resolve((event.target as HTMLInputElement).files?.[0] ?? null);
		input.oncancel = () => resolve(null);
		input.click();
	});
}

export async function pickTextFile(
	name: string,
	extensions: string[],
): Promise<{ content: string; path: string } | null> {
	if (isTauri) {
		const selected = await open({
			multiple: false,
			filters: extensions.length > 0 ? [{ name, extensions }] : [],
		});
		if (!selected || typeof selected !== "string") return null;
		return { content: await readTextFile(selected), path: selected };
	}
	const file = await pickWebFile(
		extensions.map((extension) => `.${extension}`).join(","),
	);
	return file ? { content: await file.text(), path: file.name } : null;
}

export async function loadConfiguration(): Promise<ImportedConfiguration | null> {
	try {
		const picked = await pickTextFile("Configuration", configExtensions());
		return picked
			? await importConfigurationContent(picked.content, picked.path)
			: null;
	} catch (error) {
		console.error("Config load failed", error);
		throw error;
	}
}

export function pickPluginFile() {
	return pickTextFile("Plugin", PLUGIN_EXTENSIONS);
}

export async function exportConfiguration(
	config: unknown,
	plugins: ExportedPlugin[],
	useSlots = true,
): Promise<string | null> {
	try {
		const processed = await runSlot(
			"exportConfig",
			JSON.parse(stringifyConfig(config)) as Record<string, unknown>,
			async (value) => value,
			checkObject,
			0,
			() => useSlots,
		);
		const clean = withoutPlugins(processed) as Record<string, unknown>;
		const content = stringifyConfig(
			plugins.length > 0 ? { ...clean, Plugins: plugins } : clean,
		);
		try {
			utilsRust.parse_configuration_content(content, "config.json");
		} catch (error) {
			throw new Error(
				i18n.t("plugins.export_unreadable", { reason: String(error) }),
			);
		}
		return await saveTextFile(content, "config.json", "JSON", ["json"]);
	} catch (error) {
		console.error("Config export failed", error);
		throw error;
	}
}

export async function saveTextFile(
	content: string,
	fileName: string,
	filterName: string,
	extensions: string[],
): Promise<string | null> {
	if (isTauri) {
		const path = await save({
			defaultPath: fileName,
			filters: [{ name: filterName, extensions }],
		});
		if (!path) return null;
		await writeTextFile(path, content);
		return path;
	}
	const url = URL.createObjectURL(new Blob([content], { type: "text/plain" }));
	const anchor = document.createElement("a");
	anchor.href = url;
	anchor.download = fileName;
	document.body.appendChild(anchor);
	anchor.click();
	document.body.removeChild(anchor);
	URL.revokeObjectURL(url);
	return fileName;
}
