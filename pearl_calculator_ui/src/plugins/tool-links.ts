import { useMemo } from "react";
import { pluginToolPath } from "./manifest";
import { usePluginState } from "./store";

export interface ToolLink {
	to: string;
	title: string;
	pluginName: string;
	kind: "tool" | "page";
}

export function useToolLinks(): ToolLink[] {
	const plugins = usePluginState((state) => state.plugins);
	return useMemo(
		() =>
			plugins
				.filter((plugin) => plugin.active)
				.flatMap((plugin) => [
					...plugin.manifest.tools.map((tool) => ({
						to: pluginToolPath(plugin.manifest.id, tool.id),
						title: tool.title,
						pluginName: plugin.manifest.name,
						kind: "tool" as const,
					})),
					...plugin.manifest.panels
						.filter((panel) => panel.mount === "page")
						.map((panel) => ({
							to: pluginToolPath(plugin.manifest.id, panel.id),
							title: panel.title ?? panel.id,
							pluginName: plugin.manifest.name,
							kind: "page" as const,
						})),
				]),
		[plugins],
	);
}
