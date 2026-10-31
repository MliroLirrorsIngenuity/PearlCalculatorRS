import {
	ClipboardPaste,
	Globe,
	ShieldAlert,
	TriangleAlert,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import {
	declinePlugin,
	grantPlugin,
	loadDormant,
	skipDormant,
} from "@/plugins/config-plugins";
import { toastEmbeddedFailures, toastPluginError } from "@/plugins/errors";
import type { Permission } from "@/plugins/pearlcalc-plugin";
import { sortedPermissions } from "@/plugins/permissions";
import { type PluginRecord, usePluginState } from "@/plugins/store";

const ICONS: Record<Permission, typeof Globe> = {
	"full-access": ShieldAlert,
	network: Globe,
	"clipboard-read": ClipboardPaste,
};

function PermissionRow({
	plugin,
	permission,
}: {
	plugin: PluginRecord;
	permission: Permission;
}) {
	const { t } = useTranslation();
	const Icon = ICONS[permission];
	const high = permission === "full-access";
	const hosts = plugin.manifest.permissions.includes("full-access")
		? []
		: plugin.manifest.networkHosts;
	return (
		<li
			className={cn(
				"flex gap-3 rounded-lg border px-3 py-2.5",
				high
					? "border-red-300/70 bg-red-50 text-red-800 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-200"
					: "border-amber-300/60 bg-amber-50 text-amber-900 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200",
			)}
		>
			<Icon className="mt-0.5 size-4 shrink-0" />
			<div className="flex min-w-0 flex-col gap-1 text-[13px]">
				<span className="font-semibold">
					{t(`plugins.permission.${permission}.title`)}
				</span>
				<span className="leading-relaxed">
					{t(`plugins.permission.${permission}.body`)}
				</span>
				{permission === "network" && (
					<span className="text-xs break-all opacity-90">
						{hosts.length > 0
							? t("plugins.permission_hosts", { hosts: hosts.join("、") })
							: t("plugins.permission_any_host")}
					</span>
				)}
			</div>
		</li>
	);
}

const ARM_DELAY_MS = 800;

function useArmed() {
	const [armed, setArmed] = useState(false);
	useEffect(() => {
		const timer = setTimeout(() => setArmed(true), ARM_DELAY_MS);
		return () => clearTimeout(timer);
	}, []);
	return armed;
}

function ConsentBody({ plugin }: { plugin: PluginRecord }) {
	const { t } = useTranslation();
	const [acknowledged, setAcknowledged] = useState(false);
	const armed = useArmed();
	const plugins = usePluginState((state) => state.plugins);
	const others = useMemo(
		() =>
			plugins.filter(
				(entry) =>
					entry.uid !== plugin.uid &&
					entry.consent !== "declined" &&
					entry.manifest.permissions.length > 0,
			),
		[plugins, plugin.uid],
	);
	const separator = t("plugins.list_separator");
	const { manifest } = plugin;
	const fullAccess = manifest.permissions.includes("full-access");
	const tampered =
		plugin.declaredSha256 !== undefined &&
		plugin.declaredSha256.toLowerCase() !== plugin.sha256;

	const allow = async () => {
		try {
			await grantPlugin(plugin.uid);
		} catch (error) {
			toastPluginError(t("plugins.toast_load_failed"), error);
		}
	};

	return (
		<AlertDialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
			<AlertDialogHeader>
				<AlertDialogTitle className="break-all">
					{t("plugins.consent_title", { name: manifest.name })}
				</AlertDialogTitle>
				<AlertDialogDescription asChild>
					<div className="flex flex-col gap-3 text-sm">
						<p>{t("plugins.consent_body")}</p>
						<ul className="flex flex-col gap-2">
							{sortedPermissions(manifest.permissions).map((permission) => (
								<PermissionRow
									key={permission}
									plugin={plugin}
									permission={permission}
								/>
							))}
						</ul>
						{others.length > 0 && (
							<p className="flex gap-2 text-xs text-amber-700 dark:text-amber-400">
								<TriangleAlert className="mt-px size-3.5 shrink-0" />
								{t("plugins.consent_combined", {
									plugins: others
										.map(
											(entry) =>
												`${entry.manifest.name}（${sortedPermissions(
													entry.manifest.permissions,
												)
													.map((permission) =>
														t(`plugins.permission.${permission}.title`),
													)
													.join(separator)}）`,
										)
										.join(separator),
								})}
							</p>
						)}
						{tampered && (
							<p className="flex gap-2 text-xs text-amber-700 dark:text-amber-400">
								<TriangleAlert className="mt-px size-3.5 shrink-0" />
								{t("plugins.warn_sha_mismatch")}
							</p>
						)}
						<p className="text-xs text-muted-foreground tabular-nums break-all">
							{[
								`v${manifest.version}`,
								manifest.author,
								manifest.id,
								`SHA-256 ${plugin.sha256.slice(0, 16)}`,
							]
								.filter(Boolean)
								.join(" · ")}
						</p>
						{fullAccess && (
							<label className="flex items-start gap-2 text-[13px] text-foreground">
								<input
									type="checkbox"
									checked={acknowledged}
									onChange={(event) => setAcknowledged(event.target.checked)}
									className="mt-0.5 size-4 shrink-0 rounded border-input accent-red-600"
								/>
								{t("plugins.consent_acknowledge")}
							</label>
						)}
					</div>
				</AlertDialogDescription>
			</AlertDialogHeader>
			<AlertDialogFooter>
				<AlertDialogCancel>{t("plugins.consent_decline")}</AlertDialogCancel>
				<AlertDialogAction
					onClick={allow}
					disabled={!armed || (fullAccess && !acknowledged)}
					className={cn(fullAccess && "bg-red-600 text-white hover:bg-red-700")}
				>
					{t("plugins.consent_allow")}
				</AlertDialogAction>
			</AlertDialogFooter>
		</AlertDialogContent>
	);
}

export function PluginConfirmDialog() {
	const plugin = usePluginState((state) =>
		state.plugins.find((entry) => entry.consent === "pending"),
	);

	return (
		<AlertDialog
			open={plugin !== undefined}
			onOpenChange={(open) => {
				if (!open && plugin?.consent === "pending") declinePlugin(plugin.uid);
			}}
		>
			{plugin && <ConsentBody key={plugin.uid} plugin={plugin} />}
		</AlertDialog>
	);
}

function LoadAction({ onLoad }: { onLoad: () => void }) {
	const { t } = useTranslation();
	const armed = useArmed();
	return (
		<AlertDialogAction onClick={onLoad} disabled={!armed}>
			{t("plugins.load_allow")}
		</AlertDialogAction>
	);
}

export function PluginLoadDialog() {
	const { t } = useTranslation();
	const open = usePluginState((state) => state.loadPrompt);
	const dormant = usePluginState((state) => state.dormant);

	const load = async () => {
		toastEmbeddedFailures(await loadDormant());
	};

	return (
		<AlertDialog
			open={open}
			onOpenChange={(next) => {
				if (!next) skipDormant();
			}}
		>
			<AlertDialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
				<AlertDialogHeader>
					<AlertDialogTitle>
						{t("plugins.load_title", { count: dormant.length })}
					</AlertDialogTitle>
					<AlertDialogDescription asChild>
						<div className="flex flex-col gap-3 text-sm">
							<p>{t("plugins.load_body")}</p>
							<ul className="flex flex-col divide-y rounded-lg border text-[13px] text-foreground">
								{dormant.map((entry) => (
									<li
										key={`${entry.id}:${entry.sha256}`}
										className="flex items-baseline gap-2 px-3 py-2"
									>
										<span className="min-w-0 truncate font-medium">
											{entry.id}
										</span>
										<span className="shrink-0 text-xs text-muted-foreground tabular-nums">
											{[
												entry.version && `v${entry.version}`,
												t("plugins.size_value", {
													kb: (
														new TextEncoder().encode(entry.source).length / 1024
													).toFixed(1),
												}),
											]
												.filter(Boolean)
												.join(" · ")}
										</span>
									</li>
								))}
							</ul>
						</div>
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>{t("plugins.load_decline")}</AlertDialogCancel>
					<LoadAction
						key={dormant.map((entry) => entry.sha256 || entry.id).join("|")}
						onLoad={load}
					/>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
