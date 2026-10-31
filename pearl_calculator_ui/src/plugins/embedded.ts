import { utilsRust } from "@/lib/utils-rust";

function hasPluginsKey(value: unknown): boolean {
	if (Array.isArray(value)) return value.some(hasPluginsKey);
	if (value === null || typeof value !== "object") return false;
	return Object.entries(value).some(
		([key, entry]) => key === "Plugins" || hasPluginsKey(entry),
	);
}

export function embedsPlugins(content: string) {
	const text = new TextDecoder().decode(new TextEncoder().encode(content));
	try {
		if (hasPluginsKey(JSON.parse(text))) return true;
	} catch {}
	try {
		return (
			utilsRust.parse_configuration_content(text, "plugin-output.json").plugins
				.length > 0
		);
	} catch {
		return false;
	}
}

export function rejectEmbeddedPlugins(content: string) {
	if (embedsPlugins(content)) {
		throw new Error("Plugins cannot write configs that contain plugins");
	}
}
