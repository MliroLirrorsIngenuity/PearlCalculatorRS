import type { Permission } from "@/plugins/pearlcalc-plugin";
import type { PluginManifest } from "./runtime/protocol";
import { NO_NETWORK } from "./runtime/sandbox";

export const PERMISSION_ORDER: Permission[] = [
	"full-access",
	"network",
	"clipboard-read",
];

export function sortedPermissions(permissions: Permission[]) {
	return PERMISSION_ORDER.filter((permission) =>
		permissions.includes(permission),
	);
}

export function needsConsent(manifest: PluginManifest) {
	return manifest.permissions.length > 0;
}

export function grants(
	manifest: PluginManifest,
	active: boolean,
	permission: Permission,
) {
	return (
		active &&
		(manifest.permissions.includes("full-access") ||
			manifest.permissions.includes(permission))
	);
}

export function connectSource(manifest: PluginManifest, active: boolean) {
	if (!grants(manifest, active, "network")) return NO_NETWORK;
	const hosts = manifest.permissions.includes("full-access")
		? []
		: manifest.networkHosts;
	return hosts.length > 0 ? `${hosts.join(" ")} blob:` : "* data: blob:";
}

export function allowsHtmlScripts(manifest: PluginManifest, active: boolean) {
	return active && manifest.permissions.includes("full-access");
}
