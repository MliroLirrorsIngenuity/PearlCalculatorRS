import type { ColumnDef, Column as TableColumn } from "@tanstack/react-table";
import {
	ArrowRight,
	ClipboardCopy,
	Copy,
	Play,
	Puzzle,
	Square,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import { DataTable } from "@/components/calculator/results/data-table";
import { EmptyState } from "@/components/common/EmptyState";
import { sectionLabelClass } from "@/components/common/Metric";
import { PluginErrorBoundary } from "@/components/plugins/PluginErrorBoundary";
import { PluginFieldForm } from "@/components/plugins/PluginFieldForm";
import { PanelBody } from "@/components/plugins/PluginMount";
import { PluginViews } from "@/components/plugins/PluginViews";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMobileView } from "@/context/MobileViewContext";
import { useToastNotifications } from "@/hooks/use-toast-notifications";
import { copyText } from "@/plugins/copy";
import {
	editedRaw,
	formatNumber,
	normalize,
	resolveRaw,
} from "@/plugins/fields";
import type { Column } from "@/plugins/localize";
import type { View } from "@/plugins/pearlcalc-plugin";
import { allowsHtmlScripts, connectSource } from "@/plugins/permissions";
import type { PanelManifest, ToolManifest } from "@/plugins/runtime/protocol";
import type { Row } from "@/plugins/runtime/shared";
import {
	type PluginRecord,
	runKey,
	setToolDetail,
	setToolInputsRaw,
	type ToolRun,
	usePluginState,
} from "@/plugins/store";
import {
	maxToolWorkers,
	runTool,
	stopTool,
	toolAction,
	toolCopy,
	toolDetail,
} from "@/plugins/tool-runner";
import { calculatorService } from "@/services";

type TableRow = Row & { __index: number };

export function formatCell(column: Column, value: unknown) {
	if (value === undefined || value === null) return "—";
	if (typeof value === "number") return formatNumber(column, value);
	if (typeof value === "boolean") return value ? "✓" : "✗";
	if (typeof value === "object") return JSON.stringify(value);
	return String(value);
}

function rowText(columns: Column[], row: Row) {
	return columns
		.map((column) => `${column.label}: ${formatCell(column, row[column.key])}`)
		.join("\n");
}

function tableText(columns: Column[], rows: Row[]) {
	return [
		columns.map((column) => column.label).join("\t"),
		...rows.map((row) =>
			columns.map((column) => formatCell(column, row[column.key])).join("\t"),
		),
	].join("\n");
}

function HeaderLabel({
	column,
	label,
}: {
	column: TableColumn<TableRow>;
	label: string;
}) {
	return (
		<button
			type="button"
			onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
			className="w-full truncate text-center font-semibold hover:text-foreground/70"
		>
			{label}
		</button>
	);
}

function buildColumns(columns: Column[]): ColumnDef<TableRow>[] {
	return [
		...columns.map(
			(column): ColumnDef<TableRow> => ({
				id: column.key,
				accessorFn: (row) => row[column.key] as unknown,
				header: ({ column: tableColumn }) => (
					<HeaderLabel column={tableColumn} label={column.label} />
				),
				cell: ({ row }) => (
					<div className="truncate text-center font-medium tabular-nums">
						{formatCell(column, row.original[column.key])}
					</div>
				),
				enableResizing: false,
			}),
		),
		{
			id: "actions",
			header: () => null,
			cell: () => (
				<div className="flex justify-center">
					<ArrowRight
						aria-hidden="true"
						className="size-3.5 text-muted-foreground transition-transform group-hover/row:translate-x-0.5 group-hover/row:text-foreground"
					/>
				</div>
			),
			enableResizing: false,
		},
	];
}

function columnSizing(columns: Column[]) {
	const widths = columns.map((column) => column.width ?? 10);
	const total = widths.reduce((sum, width) => sum + width, 0) + 4;
	return Object.fromEntries([
		...columns.map((column, index) => [
			column.key,
			(widths[index] / total) * 100,
		]),
		["actions", (4 / total) * 100],
	]);
}

function minTableWidth(columns: Column[]) {
	return (
		columns.reduce(
			(sum, column) => sum + Math.max(64, (column.width ?? 10) * 9.5),
			0,
		) + 40
	);
}

function initialSort(tool: ToolManifest) {
	const first = tool.sortBy?.[0];
	if (first === undefined) return null;
	const key = typeof first === "string" ? first : first.key;
	const ascending = typeof first === "string" || first.order !== "desc";
	return ascending && tool.columns.some((column) => column.key === key)
		? key
		: null;
}

function useElapsed(run: ToolRun | undefined) {
	const [now, setNow] = useState(Date.now());
	useEffect(() => {
		if (run?.status !== "running") return;
		const timer = setInterval(() => setNow(Date.now()), 500);
		return () => clearInterval(timer);
	}, [run?.status]);
	if (!run) return 0;
	return ((run.finishedAt ?? now) - run.startedAt) / 1000;
}

function ToolDetail({
	plugin,
	tool,
	row,
}: {
	plugin: PluginRecord;
	tool: ToolManifest;
	row: Row;
}) {
	const { t } = useTranslation();
	const { showSuccess, showError } = useToastNotifications();
	const [views, setViews] = useState<View[] | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		setViews(null);
		setError(null);
		if (!tool.has.detail) {
			setViews([
				{
					type: "kv",
					items: tool.columns.map((column) => ({
						label: column.label,
						value: formatCell(column, row[column.key]),
					})),
				},
			]);
			return;
		}
		toolDetail(plugin.uid, tool.id, row).then(
			(result) => !cancelled && setViews(result),
			(reason: unknown) =>
				!cancelled &&
				setError(reason instanceof Error ? reason.message : String(reason)),
		);
		return () => {
			cancelled = true;
		};
	}, [plugin.uid, tool, row]);

	const copy = async () => {
		try {
			const text = tool.has.copy
				? await toolCopy(plugin.uid, tool.id, row)
				: rowText(tool.columns, row);
			await calculatorService.copyToClipboard(await copyText("row", text, row));
			showSuccess(t("plugins.copied"));
		} catch (reason) {
			showError(t("plugins.copy_failed"), reason);
		}
	};

	return (
		<div className="flex h-full w-full flex-col bg-card">
			<div className="flex shrink-0 items-center gap-3 px-6 pt-4 pb-2">
				<span className={sectionLabelClass}>{t("plugins.detail_title")}</span>
				<div className="flex-1" />
				<Button variant="outline" size="sm" onClick={copy}>
					<Copy />
					{t("plugins.copy_row")}
				</Button>
			</div>
			<ScrollArea className="min-h-0 flex-1">
				<div className="px-6 pt-2 pb-6">
					{error && (
						<p className="rounded-lg border border-destructive/40 p-3 text-sm text-destructive">
							{error}
						</p>
					)}
					{!error && views === null && (
						<p className="text-sm text-muted-foreground">
							{t("plugins.loading")}
						</p>
					)}
					{views && (
						<PluginErrorBoundary label={plugin.manifest.name}>
							<PluginViews
								views={views}
								policy={{
									scripts: allowsHtmlScripts(plugin.manifest, plugin.active),
									connectSrc: connectSource(plugin.manifest, plugin.active),
								}}
								onAction={(name, payload) =>
									toolAction(plugin.uid, tool.id, name, payload)
								}
							/>
						</PluginErrorBoundary>
					)}
				</div>
			</ScrollArea>
		</div>
	);
}

function ToolView({
	plugin,
	tool,
}: {
	plugin: PluginRecord;
	tool: ToolManifest;
}) {
	const { t } = useTranslation();
	const { isMobile, mobileView, showResults } = useMobileView();
	const { showSuccess, showError } = useToastNotifications();
	const app = usePluginState((state) => state.app);
	const key = runKey(plugin.manifest.id, tool.id);
	const run = usePluginState((state) => state.runs[key]);
	const detail = usePluginState((state) =>
		state.detail?.key === key ? state.detail : null,
	);
	const elapsed = useElapsed(run);
	const raw = useMemo(
		() => resolveRaw(tool.inputs, plugin.toolInputs[tool.id], app),
		[tool.inputs, plugin.toolInputs, tool.id, app],
	);
	const [showErrors, setShowErrors] = useState(false);
	const { values, errors } = normalize(tool.inputs, raw);
	const running = run?.status === "running";

	const rows: TableRow[] = useMemo(
		() => (run?.rows ?? []).map((row, index) => ({ ...row, __index: index })),
		[run?.rows],
	);
	const columns = useMemo(() => buildColumns(tool.columns), [tool.columns]);
	const sizing = useMemo(() => columnSizing(tool.columns), [tool.columns]);
	const detailRow = detail ? run?.rows[detail.index] : undefined;

	const start = async () => {
		if (errors.length > 0) {
			setShowErrors(true);
			showError(
				t("plugins.input_invalid"),
				errors
					.map((error) =>
						t("plugins.field_error", {
							label: error.label,
							reason: t(`plugins.field_reason.${error.reason}`),
						}),
					)
					.join("\n"),
			);
			return;
		}
		setShowErrors(false);
		if (isMobile) showResults();
		await runTool(plugin.uid, tool.id, values);
	};

	const copyTable = async () => {
		try {
			const text = tableText(tool.columns, run?.rows ?? []);
			await calculatorService.copyToClipboard(
				await copyText("row", text, run?.rows ?? []),
			);
			showSuccess(t("plugins.copied"));
		} catch (reason) {
			showError(t("plugins.copy_failed"), reason);
		}
	};

	const inputPanel = (
		<div className="flex h-full flex-col gap-3 px-6 pt-2 pb-2">
			<div className="flex flex-col gap-1">
				<span className="text-base font-semibold tracking-tight">
					{tool.title}
				</span>
				{tool.description && (
					<span className="text-[13px] text-muted-foreground">
						{tool.description}
					</span>
				)}
			</div>
			<ScrollArea className="min-h-0 flex-1">
				<div className="pt-1 pr-3 pb-4 pl-1">
					<PluginFieldForm
						idPrefix={`tool-${plugin.manifest.id}-${tool.id}`}
						fields={tool.inputs}
						values={raw}
						errors={showErrors ? errors : []}
						onChange={(next) =>
							setToolInputsRaw(
								plugin.uid,
								tool.id,
								editedRaw(next, raw, plugin.toolInputs[tool.id]),
							)
						}
					/>
				</div>
			</ScrollArea>
			{running ? (
				<Button
					variant="outline"
					className="w-full"
					onClick={() => stopTool(plugin.manifest.id, tool.id)}
				>
					<Square />
					{t("plugins.stop")}
				</Button>
			) : (
				<Button className="w-full" onClick={start} disabled={!plugin.active}>
					<Play />
					{t("plugins.run")}
				</Button>
			)}
		</div>
	);

	const statusText = run
		? [
				t(`plugins.run_status.${run.status}`, { count: run.rows.length }),
				run.shardsTotal > 0 &&
					t("plugins.shards", { done: run.shardsDone, total: run.shardsTotal }),
				t("plugins.elapsed", { seconds: elapsed.toFixed(1) }),
			]
				.filter(Boolean)
				.join(" · ")
		: t("plugins.workers_hint", { count: maxToolWorkers() });

	const resultsPanel = (
		<div className="flex h-full w-full flex-col gap-2 pt-2 pr-4 pb-2 pl-1">
			<div className="flex h-9 shrink-0 items-center gap-2.5 rounded-lg border pr-1.5 pl-3 text-sm">
				<span className="flex items-baseline gap-1">
					<b className="text-[17px] font-semibold tracking-tight tabular-nums">
						{run?.rows.length ?? 0}
					</b>
					<span className="text-[13px] text-muted-foreground">
						{t("calculator.results_unit")}
					</span>
				</span>
				<span className="h-3.5 w-px bg-border" />
				<span className="min-w-0 truncate text-[13px] text-muted-foreground tabular-nums">
					{statusText}
				</span>
				<div className="flex-1" />
				<Button
					variant="ghost"
					size="sm"
					className="h-7"
					disabled={!run || run.rows.length === 0}
					onClick={copyTable}
				>
					<ClipboardCopy />
					{t("plugins.copy_table")}
				</Button>
			</div>
			{running && (
				<Progress
					value={Math.round((run?.progress ?? 0) * 100)}
					className="h-1"
				/>
			)}
			{run?.status === "error" && run.error && (
				<p className="rounded-lg border border-destructive/40 px-3 py-2 text-[13px] whitespace-pre-wrap text-destructive">
					{run.error}
				</p>
			)}
			{rows.length === 0 ? (
				<EmptyState
					className="min-h-0 flex-1"
					icon={<Puzzle />}
					title={
						running
							? t("plugins.running_title")
							: t("plugins.results_empty_title")
					}
					hint={
						running
							? t("plugins.running_hint")
							: t("plugins.results_empty_hint")
					}
				/>
			) : (
				<div className="min-h-0 flex-1">
					<DataTable
						key={`${key}-${tool.columns.map((column) => column.key).join("|")}`}
						columns={columns}
						data={rows}
						defaultColumnSizing={sizing}
						defaultSortColumn={initialSort(tool)}
						minWidth={minTableWidth(tool.columns)}
						onRowOpen={(row: TableRow) =>
							setToolDetail({ key, index: row.__index })
						}
					/>
				</div>
			)}
		</div>
	);

	return (
		<Card className="relative h-full w-full overflow-hidden">
			<AnimatePresence>
				{detailRow && (
					<motion.div
						key="tool-detail"
						initial={{ opacity: 0, scale: 0.98 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.98 }}
						transition={{ duration: 0.2 }}
						className="absolute inset-0 z-10"
					>
						<ToolDetail plugin={plugin} tool={tool} row={detailRow} />
					</motion.div>
				)}
			</AnimatePresence>
			<CardContent className="relative flex h-full w-full p-0">
				{!isMobile && (
					<>
						<div className="isolate flex h-full w-[min(440px,46.7%)] shrink-0 flex-col">
							{inputPanel}
						</div>
						<div className="h-full min-w-0 flex-1">{resultsPanel}</div>
					</>
				)}
				{isMobile && (
					<div className="absolute inset-0 h-full w-full">
						{mobileView === "input" ? inputPanel : resultsPanel}
					</div>
				)}
			</CardContent>
		</Card>
	);
}

function PageView({
	plugin,
	panel,
}: {
	plugin: PluginRecord;
	panel: PanelManifest;
}) {
	return (
		<Card className="h-full w-full">
			<CardContent className="flex h-full min-h-0 flex-col gap-3 p-0">
				<div className="flex flex-col gap-1 px-6 pt-4">
					<span className="text-base font-semibold tracking-tight">
						{panel.title}
					</span>
					<span className="text-[13px] text-muted-foreground">
						{plugin.manifest.name}
					</span>
				</div>
				<ScrollArea className="min-h-0 flex-1">
					<div className="px-6 pb-6">
						<PanelBody plugin={plugin} panel={panel} />
					</div>
				</ScrollArea>
			</CardContent>
		</Card>
	);
}

export default function PluginTool() {
	const { t } = useTranslation();
	const { pluginId, toolId } = useParams();
	const plugin = usePluginState((state) =>
		state.plugins.find((entry) => entry.manifest.id === pluginId),
	);
	const tool = plugin?.manifest.tools.find((entry) => entry.id === toolId);
	const page = plugin?.active
		? plugin.manifest.panels.find(
				(entry) => entry.mount === "page" && entry.id === toolId,
			)
		: undefined;

	if (plugin && page) return <PageView plugin={plugin} panel={page} />;

	if (!plugin || !tool) {
		return (
			<Card className="h-full w-full">
				<CardContent className="flex h-full p-4">
					<EmptyState
						className="flex-1"
						icon={<Puzzle />}
						title={t("plugins.tool_missing_title")}
						hint={t("plugins.tool_missing_hint")}
					/>
				</CardContent>
			</Card>
		);
	}

	return <ToolView plugin={plugin} tool={tool} />;
}
