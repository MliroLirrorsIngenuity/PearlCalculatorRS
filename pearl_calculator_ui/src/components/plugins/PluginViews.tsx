import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { HeightProfileChart } from "@/components/charts/HeightProfileChart";
import { TopDownChart } from "@/components/charts/TopDownChart";
import { Segmented, sectionLabelClass } from "@/components/common/Metric";
import { cn } from "@/lib/utils";
import { sanitizeStaticHtml } from "@/plugins/html-sanitize";
import type { View } from "@/plugins/pearlcalc-plugin";
import {
	contentSecurityPolicy,
	htmlViewDocument,
	NO_NETWORK,
} from "@/plugins/runtime/sandbox";
import type { PearlTraceResult } from "@/types/domain";

type ActionHandler = (name: string, payload: unknown) => Promise<unknown>;

export interface HtmlPolicy {
	scripts: boolean;
	connectSrc: string;
}

function toTrace(points: unknown): PearlTraceResult {
	const trace = (Array.isArray(points) ? points : [])
		.filter(
			(point) =>
				point &&
				typeof point === "object" &&
				Number.isFinite(point.x) &&
				Number.isFinite(point.y) &&
				Number.isFinite(point.z),
		)
		.map((point) => ({ X: point.x, Y: point.y, Z: point.z }));
	const last = trace[trace.length - 1] ?? { X: 0, Y: 0, Z: 0 };
	return {
		landing_position: last,
		pearl_trace: trace,
		pearl_motion_trace: [],
		is_successful: false,
		tick: Math.max(0, trace.length - 1),
		final_motion: { X: 0, Y: 0, Z: 0 },
		distance: 0,
		closest_approach: null,
	};
}

export function TrajectoryView({
	view,
	height,
}: {
	view: Extract<View, { type: "trajectory" }>;
	height?: number;
}) {
	const { t } = useTranslation();
	const [mode, setMode] = useState<"side" | "top">(view.view ?? "side");
	const trace = useMemo(() => toTrace(view.points ?? []), [view.points]);
	const horizontal = useMemo(() => {
		const xs = trace.pearl_trace.map((point) => point.X);
		const zs = trace.pearl_trace.map((point) => point.Z);
		return Math.max(
			Math.max(...xs) - Math.min(...xs),
			Math.max(...zs) - Math.min(...zs),
		);
	}, [trace]);
	if (trace.pearl_trace.length === 0) return null;
	return (
		<div
			className="relative h-[clamp(200px,36vh,280px)] rounded-lg border"
			style={height ? { height } : undefined}
		>
			<div className="absolute top-2 right-3 z-10">
				<Segmented
					value={mode}
					onChange={setMode}
					options={[
						{ value: "side", label: t("trace.view_side") },
						{ value: "top", label: t("trace.view_top") },
					]}
				/>
			</div>
			{mode === "side" ? (
				<HeightProfileChart
					trace={trace}
					targetY={view.targetY}
					variant="full"
					xUnit={horizontal < 0.5 ? "tick" : "distance"}
				/>
			) : (
				<TopDownChart trace={trace} target={view.target} />
			)}
		</div>
	);
}

const htmlBridge = `window.pc={action:function(name,payload){return new Promise(function(resolve,reject){var id=Math.random().toString(36).slice(2);function listener(event){if(event.source!==parent||!event.data||event.data.t!=="pc-action-result"||event.data.id!==id)return;removeEventListener("message",listener);event.data.ok?resolve(event.data.value):reject(new Error(event.data.error));}addEventListener("message",listener);parent.postMessage({t:"pc-action",id:id,name:name,payload:payload},"*");});}};`;

export function HtmlView({
	view,
	policy,
	onAction,
}: {
	view: Extract<View, { type: "html" }>;
	policy: HtmlPolicy;
	onAction?: ActionHandler;
}) {
	const frame = useRef<HTMLIFrameElement>(null);
	const dark = document.documentElement.classList.contains("dark");
	const srcDoc = useMemo(() => {
		const csp = contentSecurityPolicy(
			policy.scripts ? policy.connectSrc : NO_NETWORK,
			"img-src data: blob:; font-src data:; frame-src 'none'; form-action 'none'",
		);
		const body = policy.scripts ? view.html : sanitizeStaticHtml(view.html);
		const inner = `<!doctype html><html><head><meta http-equiv="x-dns-prefetch-control" content="off"><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${csp}"><style>:root{color-scheme:${dark ? "dark" : "light"}}body{margin:12px;font:13px/1.5 system-ui,sans-serif}</style>${policy.scripts ? `<script>${htmlBridge}</script>` : ""}</head><body>${body}</body></html>`;
		return htmlViewDocument(
			inner,
			policy.scripts,
			policy.scripts ? policy.connectSrc : NO_NETWORK,
		);
	}, [view.html, policy.scripts, policy.connectSrc, dark]);

	useEffect(() => {
		const listener = (event: MessageEvent) => {
			const target = frame.current?.contentWindow;
			if (!target || event.source !== target || event.data?.t !== "pc-action") {
				return;
			}
			const { id, name, payload } = event.data;
			const reply = (message: Record<string, unknown>) =>
				target.postMessage({ t: "pc-action-result", id, ...message }, "*");
			if (!onAction) {
				reply({ ok: false, error: "Actions are unavailable here" });
				return;
			}
			onAction(name, payload).then(
				(value) => reply({ ok: true, value }),
				(error: unknown) =>
					reply({
						ok: false,
						error: error instanceof Error ? error.message : String(error),
					}),
			);
		};
		window.addEventListener("message", listener);
		return () => window.removeEventListener("message", listener);
	}, [onAction]);

	return (
		<iframe
			ref={frame}
			title={view.title ?? "plugin view"}
			sandbox="allow-scripts"
			srcDoc={srcDoc}
			className="w-full rounded-lg border bg-background"
			style={{ height: view.height ?? 320 }}
		/>
	);
}

function ViewBody({
	view,
	policy,
	onAction,
}: {
	view: View;
	policy: HtmlPolicy;
	onAction?: ActionHandler;
}) {
	switch (view.type) {
		case "text":
			return (
				<pre className="overflow-x-auto rounded-lg border bg-muted/30 p-3 font-mono text-[13px] whitespace-pre-wrap tabular-nums">
					{String(view.text ?? "")}
				</pre>
			);
		case "kv":
			return (
				<div className="grid grid-cols-[minmax(6rem,auto)_1fr] gap-x-6 gap-y-1.5 rounded-lg border p-3 text-[13px]">
					{(Array.isArray(view.items) ? view.items : [])
						.filter((item) => item && typeof item === "object")
						.map((item) => (
							<div
								key={`${item.label}\u0000${item.value}`}
								className="contents"
							>
								<span className="text-muted-foreground">
									{String(item.label)}
								</span>
								<span className="min-w-0 break-all font-medium tabular-nums">
									{String(item.value)}
								</span>
							</div>
						))}
				</div>
			);
		case "trajectory":
			return <TrajectoryView view={view} />;
		case "html":
			return <HtmlView view={view} policy={policy} onAction={onAction} />;
		default:
			return null;
	}
}

export function PluginViews({
	views,
	policy,
	onAction,
	className,
}: {
	views: View[];
	policy: HtmlPolicy;
	onAction?: ActionHandler;
	className?: string;
}) {
	const keyed = views
		.filter((view) => view && typeof view === "object")
		.map((view, position) => ({
			id: `${position}:${String(view.type)}`,
			view,
		}));
	return (
		<div className={cn("flex flex-col gap-4", className)}>
			{keyed.map(({ id, view }) => (
				<section key={id} className="flex flex-col gap-2">
					{typeof view.title === "string" && view.title && (
						<span className={sectionLabelClass}>{view.title}</span>
					)}
					<ViewBody view={view} policy={policy} onAction={onAction} />
				</section>
			))}
		</div>
	);
}
