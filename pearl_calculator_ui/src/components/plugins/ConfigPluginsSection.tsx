import {
	BookOpen,
	ChevronRight,
	FileCode2,
	Plus,
	ShieldCheck,
	TriangleAlert,
	X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { sectionLabelClass } from "@/components/common/Metric";
import { Button } from "@/components/ui/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useToastNotifications } from "@/hooks/use-toast-notifications";
import { pickPluginFile, saveTextFile } from "@/lib/config-service";
import { cn } from "@/lib/utils";
import {
	attachPlugin,
	detachPlugin,
	loadDormant,
	removeDormant,
	requestConsent,
} from "@/plugins/config-plugins";
import { toastEmbeddedFailures, toastPluginError } from "@/plugins/errors";
import { editedRaw, normalize, resolveRaw } from "@/plugins/fields";
import { missingPhysicsSlots, PLUGIN_DOCS_URL } from "@/plugins/manifest";
import typesSource from "@/plugins/pearlcalc-plugin.d.ts?raw";
import { sortedPermissions } from "@/plugins/permissions";
import {
	clearLogs,
	type EmbeddedPluginEntry,
	type PluginRecord,
	setPluginData,
	setSettingsRaw,
	usePluginState,
} from "@/plugins/store";
import { PluginFieldForm } from "./PluginFieldForm";

const linkClass =
	"flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground";

const LOG_COLORS: Record<string, string> = {
	error: "text-red-600 dark:text-red-400",
	warn: "text-amber-600 dark:text-amber-400",
};

function Notice({ children }: { children: React.ReactNode }) {
	return (
		<div className="flex gap-2 rounded-md border border-amber-300/60 bg-amber-50 px-2.5 py-2 text-xs text-amber-800 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-300">
			<TriangleAlert className="mt-px size-3.5 shrink-0" />
			<div className="flex min-w-0 flex-1 flex-col items-start gap-2">
				{children}
			</div>
		</div>
	);
}

function PluginBody({ plugin }: { plugin: PluginRecord }) {
	const { t } = useTranslation();
	const app = usePluginState((state) => state.app);
	const plugins = usePluginState((state) => state.plugins);
	const { manifest } = plugin;
	const settingsRaw = useMemo(
		() => resolveRaw(manifest.settings, plugin.settings, app),
		[manifest.settings, plugin.settings, app],
	);
	const separator = t("plugins.list_separator");
	const missing = missingPhysicsSlots(manifest);
	const tampered =
		plugin.declaredSha256 !== undefined &&
		plugin.declaredSha256.toLowerCase() !== plugin.sha256;

	const slotLabel = (slot: (typeof manifest.slots)[number]) => {
		const chain = plugins.filter(
			(entry) => entry.active && entry.manifest.slots.includes(slot),
		);
		const index = chain.findIndex((entry) => entry.uid === plugin.uid);
		const name = t(`plugins.slot.${slot}`);
		return chain.length > 1 && index >= 0
			? `${name}（${t("plugins.chain_position", { index: index + 1, total: chain.length })}）`
			: name;
	};

	const permissions = sortedPermissions(manifest.permissions);
	const dataKeys = Object.keys(plugin.data);
	const permissionNames = permissions
		.map((permission) => t(`plugins.permission.${permission}.title`))
		.join(separator);

	return (
		<div className="flex flex-col gap-3 pr-3 pb-3 pl-8">
			{manifest.description && (
				<p className="text-[13px] leading-relaxed text-muted-foreground">
					{manifest.description}
				</p>
			)}

			{!plugin.active && (
				<Notice>
					{t("plugins.inactive_permissions", { permissions: permissionNames })}
					<Button
						size="sm"
						variant="outline"
						className="h-7 text-xs"
						onClick={() => requestConsent(plugin.uid)}
					>
						<ShieldCheck />
						{t("plugins.review_permissions")}
					</Button>
				</Notice>
			)}
			{tampered && <Notice>{t("plugins.warn_sha_mismatch")}</Notice>}
			{missing.length > 0 && (
				<Notice>
					{t("plugins.warn_physics", {
						slots: missing
							.map((slot) => t(`plugins.slot.${slot}`))
							.join(separator),
					})}
				</Notice>
			)}

			<dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 text-xs tabular-nums [&>dt]:text-muted-foreground">
				{manifest.author && (
					<>
						<dt>{t("plugins.field_author")}</dt>
						<dd>{manifest.author}</dd>
					</>
				)}
				{manifest.slots.length > 0 && (
					<>
						<dt>{t("plugins.section_slots")}</dt>
						<dd>{manifest.slots.map(slotLabel).join(separator)}</dd>
					</>
				)}
				<dt>{t("plugins.field_permissions")}</dt>
				<dd>
					{permissions.length > 0
						? permissions
								.map((permission) =>
									permission === "network" && manifest.networkHosts.length > 0
										? `${t("plugins.permission.network.title")}（${manifest.networkHosts.join(", ")}）`
										: t(`plugins.permission.${permission}.title`),
								)
								.join(separator)
						: t("plugins.permission_none")}
				</dd>
				<dt>ID</dt>
				<dd className="truncate">{manifest.id}</dd>
				<dt>{t("plugins.field_size")}</dt>
				<dd>
					{t("plugins.size_value", {
						kb: (new TextEncoder().encode(plugin.source).length / 1024).toFixed(
							1,
						),
					})}
				</dd>
				<dt>SHA-256</dt>
				<dd className="truncate" title={plugin.sha256}>
					{plugin.sha256}
				</dd>
				{dataKeys.length > 0 && (
					<>
						<dt>{t("plugins.field_data")}</dt>
						<dd className="flex items-baseline gap-2">
							<span className="truncate" title={dataKeys.join(", ")}>
								{t("plugins.data_value", {
									count: dataKeys.length,
									kb: (
										new TextEncoder().encode(JSON.stringify(plugin.data))
											.length / 1024
									).toFixed(1),
								})}
							</span>
							<button
								type="button"
								className={linkClass}
								onClick={() => setPluginData(plugin.uid, {})}
							>
								{t("plugins.data_clear")}
							</button>
						</dd>
					</>
				)}
			</dl>

			{manifest.settings.length > 0 && (
				<div className="flex flex-col gap-2">
					<span className={sectionLabelClass}>
						{t("plugins.section_settings")}
					</span>
					<PluginFieldForm
						idPrefix={`settings-${manifest.id}`}
						fields={manifest.settings}
						values={settingsRaw}
						errors={normalize(manifest.settings, settingsRaw).errors}
						onChange={(values) =>
							setSettingsRaw(
								plugin.uid,
								editedRaw(values, settingsRaw, plugin.settings),
							)
						}
					/>
				</div>
			)}

			{plugin.logs.length > 0 && (
				<div className="flex flex-col gap-1">
					<div className="flex items-center justify-between">
						<span className={sectionLabelClass}>
							{t("plugins.section_logs")}
						</span>
						<button
							type="button"
							className={linkClass}
							onClick={() => clearLogs(plugin.uid)}
						>
							{t("plugins.logs_clear")}
						</button>
					</div>
					<div className="max-h-40 overflow-auto rounded-md bg-muted/50 px-2.5 py-2 font-mono text-[11px] leading-relaxed">
						{plugin.logs.map((entry) => (
							<div
								key={entry.id}
								className={cn(
									"whitespace-pre-wrap break-all",
									LOG_COLORS[entry.level],
								)}
							>
								<span className="text-muted-foreground">
									{new Date(entry.at).toLocaleTimeString()}{" "}
								</span>
								{entry.text}
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}

function PluginRow({ plugin }: { plugin: PluginRecord }) {
	const { t } = useTranslation();
	const [open, setOpen] = useState(false);
	const rowRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (open) rowRef.current?.scrollIntoView({ block: "nearest" });
	}, [open]);

	return (
		<Collapsible ref={rowRef} open={open} onOpenChange={setOpen}>
			<div className="flex items-center gap-1 pr-1.5">
				<CollapsibleTrigger className="flex min-w-0 flex-1 items-center gap-2 py-1.5 pl-2.5 text-left">
					<ChevronRight
						className={cn(
							"size-3.5 shrink-0 text-muted-foreground transition-transform",
							open && "rotate-90",
						)}
					/>
					<span className="flex min-w-0 flex-1 items-baseline gap-2">
						<span className="truncate text-[13px] font-medium">
							{plugin.manifest.name}
						</span>
						<span
							className={cn(
								"shrink-0 text-xs text-muted-foreground tabular-nums",
								!plugin.active && "text-amber-700 dark:text-amber-400",
							)}
						>
							{plugin.active
								? `v${plugin.manifest.version}`
								: t("plugins.inactive_short")}
						</span>
					</span>
				</CollapsibleTrigger>
				<Button
					variant="ghost"
					size="icon"
					className="size-6"
					aria-label={t("plugins.detach", { name: plugin.manifest.name })}
					onClick={() => detachPlugin(plugin.uid)}
				>
					<X className="size-3.5" />
				</Button>
			</div>
			<CollapsibleContent>
				<PluginBody plugin={plugin} />
			</CollapsibleContent>
		</Collapsible>
	);
}

function DormantRow({ entry }: { entry: EmbeddedPluginEntry }) {
	const { t } = useTranslation();
	const load = async () => {
		toastEmbeddedFailures(await loadDormant([entry]));
	};
	return (
		<div className="flex items-center gap-2 py-1.5 pr-1.5 pl-8">
			<span className="flex min-w-0 flex-1 items-baseline gap-2">
				<span className="truncate text-[13px] font-medium">{entry.id}</span>
				<span className="shrink-0 text-xs text-amber-700 dark:text-amber-400">
					{t("plugins.dormant_short")}
				</span>
			</span>
			<button type="button" className={linkClass} onClick={load}>
				{t("plugins.load_one")}
			</button>
			<Button
				variant="ghost"
				size="icon"
				className="size-6"
				aria-label={t("plugins.detach", { name: entry.id })}
				onClick={() => removeDormant(entry)}
			>
				<X className="size-3.5" />
			</Button>
		</div>
	);
}

export function ConfigPluginsSection() {
	const { t } = useTranslation();
	const { showSuccess, showError } = useToastNotifications();
	const plugins = usePluginState((state) => state.plugins);
	const dormant = usePluginState((state) => state.dormant);

	const attach = async () => {
		try {
			const picked = await pickPluginFile();
			if (!picked) return;
			const record = await attachPlugin(picked.content);
			showSuccess(t("plugins.toast_attached", { name: record.manifest.name }));
		} catch (error) {
			toastPluginError(t("plugins.toast_load_failed"), error);
		}
	};

	const downloadTypes = async () => {
		try {
			await saveTextFile(typesSource, "pearlcalc-plugin.d.ts", "ts", ["ts"]);
		} catch (error) {
			showError(t("plugins.toast_save_failed"), error);
		}
	};

	return (
		<section className="flex flex-col gap-2">
			<div className="flex items-center justify-between gap-2">
				<span className={sectionLabelClass}>{t("plugins.config_section")}</span>
				<button type="button" className={linkClass} onClick={attach}>
					<Plus className="size-3.5" />
					{t("plugins.attach")}
				</button>
			</div>
			{plugins.length + dormant.length > 0 && (
				<div className="flex flex-col divide-y rounded-lg border">
					{plugins.map((plugin) => (
						<PluginRow key={plugin.uid} plugin={plugin} />
					))}
					{dormant.map((entry) => (
						<DormantRow key={`${entry.id}:${entry.sha256}`} entry={entry} />
					))}
				</div>
			)}
			<p className="text-xs text-muted-foreground">
				{t("plugins.config_section_hint")}
			</p>
			<div className="flex flex-wrap gap-x-4 gap-y-1">
				<button type="button" className={linkClass} onClick={downloadTypes}>
					<FileCode2 className="size-3.5" />
					{t("plugins.download_types")}
				</button>
				<a
					href={PLUGIN_DOCS_URL}
					target="_blank"
					rel="noreferrer"
					className={linkClass}
				>
					<BookOpen className="size-3.5" />
					{t("plugins.author_docs")}
				</a>
			</div>
		</section>
	);
}
