import { TriangleAlert } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { sectionLabelClass } from "@/components/common/Metric";
import { cn } from "@/lib/utils";
import { type MainMount, useMainMounts } from "@/plugins/main-world";
import { type PanelView, usePanel } from "@/plugins/panels";
import type { PanelMount } from "@/plugins/pearlcalc-plugin";
import { allowsHtmlScripts, connectSource } from "@/plugins/permissions";
import type { PanelManifest } from "@/plugins/runtime/protocol";
import { appendLog, type PluginRecord, usePluginState } from "@/plugins/store";
import { PluginErrorBoundary } from "./PluginErrorBoundary";
import { PluginUI } from "./PluginUI";

const EMPTY_VIEW: PanelView = {};

function useRevision(values: unknown[]) {
	const ref = useRef({ values, revision: 0 });
	const previous = ref.current.values;
	if (
		previous.length !== values.length ||
		values.some((value, index) => value !== previous[index])
	) {
		ref.current = { values, revision: ref.current.revision + 1 };
	}
	return ref.current.revision;
}

export function PanelBody({
	plugin,
	panel,
	view = EMPTY_VIEW,
}: {
	plugin: PluginRecord;
	panel: PanelManifest;
	view?: PanelView;
}) {
	const { t, i18n } = useTranslation();
	const app = usePluginState((state) => state.app);
	const revision = useRevision([
		app,
		i18n.language,
		plugin.active,
		plugin.settings,
		plugin.calculatorInputs,
		plugin.simulatorInputs,
		plugin.data,
	]);
	const { snapshot, dispatch } = usePanel(plugin.uid, panel.id, view, revision);
	const policy = useMemo(
		() => ({
			scripts: allowsHtmlScripts(plugin.manifest, plugin.active),
			connectSrc: connectSource(plugin.manifest, plugin.active),
		}),
		[plugin.manifest, plugin.active],
	);

	return (
		<div className="flex flex-col gap-3">
			{snapshot.error && (
				<div className="flex gap-2 rounded-md border border-red-300/60 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-300">
					<TriangleAlert className="mt-px size-3.5 shrink-0" />
					<span className="min-w-0 break-words whitespace-pre-wrap">
						{snapshot.error}
					</span>
				</div>
			)}
			{snapshot.ready ? (
				<PluginErrorBoundary
					resetKey={snapshot.version}
					label={plugin.manifest.name}
					onError={(message) => appendLog(plugin.uid, "error", message)}
				>
					<PluginUI
						tree={snapshot.tree}
						idPrefix={`panel-${plugin.manifest.id}-${panel.id}`}
						policy={policy}
						onEvent={dispatch}
					/>
				</PluginErrorBoundary>
			) : (
				<span className="text-xs text-muted-foreground">
					{t("plugins.loading")}
				</span>
			)}
		</div>
	);
}

function MainMountView({ entry, view }: { entry: MainMount; view: PanelView }) {
	const ref = useRef<HTMLDivElement>(null);
	useEffect(() => {
		const element = ref.current;
		if (!element) return;
		let cleanup: unknown;
		try {
			cleanup = entry.render(element, view);
		} catch (error) {
			appendLog(entry.uid, "error", String(error));
		}
		return () => {
			try {
				if (typeof cleanup === "function") cleanup();
			} catch (error) {
				appendLog(entry.uid, "error", String(error));
			}
			element.replaceChildren();
		};
	}, [entry, view]);
	return <div ref={ref} />;
}

export function PluginMount({
	point,
	view = EMPTY_VIEW,
	className,
}: {
	point: PanelMount;
	view?: PanelView;
	className?: string;
}) {
	const plugins = usePluginState((state) => state.plugins);
	const mains = useMainMounts(point);
	const panels = plugins
		.filter((plugin) => plugin.active)
		.flatMap((plugin) =>
			plugin.manifest.panels
				.filter((panel) => panel.mount === point)
				.map((panel) => ({ plugin, panel })),
		);
	if (panels.length === 0 && mains.length === 0) return null;

	return (
		<div className={cn("flex flex-col gap-4", className)}>
			{panels.map(({ plugin, panel }) => (
				<section
					key={`${plugin.uid}/${panel.id}`}
					className="flex flex-col gap-3"
				>
					<span className={sectionLabelClass}>
						{panel.title
							? `${plugin.manifest.name} · ${panel.title}`
							: plugin.manifest.name}
					</span>
					<PanelBody plugin={plugin} panel={panel} view={view} />
				</section>
			))}
			{mains.map((entry) => (
				<MainMountView key={entry.id} entry={entry} view={view} />
			))}
		</div>
	);
}
