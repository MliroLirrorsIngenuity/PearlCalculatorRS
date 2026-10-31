import { TriangleAlert } from "lucide-react";
import {
	type CSSProperties,
	type ReactNode,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { Metric, sectionLabelClass } from "@/components/common/Metric";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
	formatNumber,
	normalize,
	type RawValues,
	rawFromValues,
} from "@/plugins/fields";
import {
	hasOwn,
	localize,
	localizeColumn,
	localizeField,
} from "@/plugins/localize";
import type {
	InputField,
	JsonValue,
	SvgNode,
	Tone,
	UIEvent,
	UINode,
} from "@/plugins/pearlcalc-plugin";
import { PluginFieldForm } from "./PluginFieldForm";
import { type HtmlPolicy, HtmlView, TrajectoryView } from "./PluginViews";

interface RenderContext {
	idPrefix: string;
	policy: HtmlPolicy;
	emit: (event: UIEvent, fromUser?: boolean) => void;
}

const TONE_TEXT: Record<Tone, string> = {
	default: "",
	muted: "text-muted-foreground",
	info: "text-sky-700 dark:text-sky-400",
	success: "text-emerald-700 dark:text-emerald-400",
	warning: "text-amber-700 dark:text-amber-400",
	danger: "text-red-600 dark:text-red-400",
};

const TONE_BOX: Record<Tone, string> = {
	default: "border-border bg-muted/30",
	muted: "border-border bg-muted/30 text-muted-foreground",
	info: "border-sky-300/60 bg-sky-50 text-sky-800 dark:border-sky-400/30 dark:bg-sky-400/10 dark:text-sky-300",
	success:
		"border-emerald-300/60 bg-emerald-50 text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300",
	warning:
		"border-amber-300/60 bg-amber-50 text-amber-800 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-300",
	danger:
		"border-red-300/60 bg-red-50 text-red-700 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-300",
};

const TEXT_SIZE = {
	xs: "text-xs",
	sm: "text-[13px]",
	md: "text-sm",
	lg: "text-lg leading-snug",
	xl: "text-2xl tracking-tight",
} as const;

const WEIGHT = {
	normal: "font-normal",
	medium: "font-medium",
	semibold: "font-semibold",
} as const;

const ALIGN = {
	start: "flex-start",
	center: "center",
	end: "flex-end",
	baseline: "baseline",
	stretch: "stretch",
} as const;

const JUSTIFY = {
	start: "flex-start",
	center: "center",
	end: "flex-end",
	between: "space-between",
} as const;

const PAINT_TOKENS: Record<string, string> = {
	foreground: "var(--foreground)",
	muted: "var(--muted-foreground)",
	primary: "var(--primary)",
	border: "var(--border)",
	blue: "#2563eb",
	red: "#dc2626",
	green: "#16a34a",
	amber: "#d97706",
};

const COLOR_PATTERN =
	/^(#[0-9a-f]{3,8}|[a-z]+|(rgb|rgba|hsl|hsla)\([\d\s.,%/+-]+\))$/i;
const NUMBER_LIST = /^[\d\s.,eE+-]*$/;
const PATH_DATA = /^[MmLlHhVvCcSsQqTtAaZz\d\s.,eE+-]*$/;
const TRANSFORM = /^[a-z\d\s.,()+-]*$/i;
const IMAGE_SOURCE =
	/^data:image\/(png|jpeg|gif|webp|svg\+xml);base64,[a-z\d+/=]+$/i;

const tone = (value: unknown): Tone =>
	typeof value === "string" && hasOwn(TONE_TEXT, value)
		? (value as Tone)
		: "default";

const pick = <T extends Record<string, unknown>>(map: T, value: unknown) =>
	typeof value === "string" && hasOwn(map, value)
		? map[value as keyof T]
		: undefined;

function finite(value: unknown): number | undefined;
function finite(value: unknown, fallback: number): number;
function finite(value: unknown, fallback?: number) {
	return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

const clamp = (value: unknown, min: number, max: number, fallback: number) =>
	Math.min(max, Math.max(min, finite(value, fallback)));

const gapStyle = (value: unknown): CSSProperties => ({
	gap: clamp(value, 0, 12, 3) * 4,
});

const label = (value: unknown) =>
	typeof value === "number" ? String(value) : localize(value);

function paint(value: unknown) {
	if (typeof value !== "string") return undefined;
	if (hasOwn(PAINT_TOKENS, value)) return PAINT_TOKENS[value];
	return COLOR_PATTERN.test(value) && !/url/i.test(value) ? value : undefined;
}

function keyed<T extends { type?: unknown }>(items: T[]) {
	return items.map((item, position) => ({
		id: `${position}:${String(item?.type ?? typeof item)}`,
		item,
	}));
}

const MAX_CELLS = 50000;

function isField(value: unknown): value is InputField {
	if (!value || typeof value !== "object") return false;
	const field = value as Record<string, unknown>;
	return (
		typeof field.key === "string" &&
		typeof field.type === "string" &&
		(field.type !== "select" || Array.isArray(field.options))
	);
}

export function finitePoints(value: unknown) {
	return (Array.isArray(value) ? value : []).filter(
		(point): point is { x: number; y: number; z: number } =>
			!!point &&
			typeof point === "object" &&
			["x", "y", "z"].every((axis) =>
				Number.isFinite((point as Record<string, unknown>)[axis]),
			),
	);
}

function asChildren(value: unknown): unknown[] {
	return Array.isArray(value) ? value : [];
}

function cellText(
	column: { digits?: number; format?: "fixed" | "exp" },
	value: unknown,
) {
	if (typeof value === "number") {
		return formatNumber({ key: "", label: "", ...column }, value);
	}
	return value === undefined || value === null ? "—" : String(value);
}

function Children({ nodes, ctx }: { nodes: unknown; ctx: RenderContext }) {
	return keyed(asChildren(nodes) as { type?: unknown }[]).map(
		({ id, item }) => <Node key={id} node={item} ctx={ctx} />,
	);
}

function FieldsNode({
	node,
	ctx,
}: {
	node: Extract<UINode, { type: "fields" }>;
	ctx: RenderContext;
}) {
	const fieldsKey = JSON.stringify(
		Array.isArray(node.fields) ? node.fields : [],
	);
	const fields = useMemo(
		() =>
			(JSON.parse(fieldsKey) as unknown[])
				.filter(isField)
				.map((field) => localizeField(field)),
		[fieldsKey],
	);
	const incoming = JSON.stringify(node.values ?? {});
	const [raw, setRaw] = useState<RawValues>(() =>
		rawFromValues(fields, node.values),
	);
	const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
	useEffect(() => {
		setRaw(rawFromValues(fields, JSON.parse(incoming)));
	}, [fields, incoming]);
	useEffect(() => () => clearTimeout(timer.current), []);
	const result = normalize(fields, raw);
	return (
		<PluginFieldForm
			idPrefix={`${ctx.idPrefix}-${node.on}`}
			fields={fields}
			values={raw}
			errors={result.errors}
			onChange={(next) => {
				setRaw(next);
				clearTimeout(timer.current);
				timer.current = setTimeout(
					() =>
						ctx.emit(
							{
								on: String(node.on),
								value: normalize(fields, next).values,
							},
							false,
						),
					150,
				);
			}}
		/>
	);
}

function TableNode({
	node,
	ctx,
}: {
	node: Extract<UINode, { type: "table" }>;
	ctx: RenderContext;
}) {
	const columns = (Array.isArray(node.columns) ? node.columns : [])
		.filter((column) => column && typeof column.key === "string")
		.map((column) => localizeColumn(column));
	const rows = (Array.isArray(node.rows) ? node.rows : []).slice(
		0,
		Math.floor(MAX_CELLS / Math.max(1, columns.length)),
	);
	const clickable = typeof node.onRowClick === "string";
	return (
		<div
			className="overflow-auto rounded-lg border"
			style={{ maxHeight: clamp(node.maxHeight, 80, 2000, 360) }}
		>
			<table className="w-full text-[13px] tabular-nums">
				<thead className="sticky top-0 bg-card">
					<tr className="border-b">
						{columns.map((column) => (
							<th
								key={column.key}
								className="px-2.5 py-1.5 text-center font-semibold whitespace-nowrap"
							>
								{column.label}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{keyed(rows as { type?: unknown }[]).map(({ id, item }, index) => (
						<tr
							key={id}
							className={cn(
								"border-b last:border-0",
								clickable && "cursor-pointer hover:bg-muted/50",
								node.selected === index && "bg-muted",
							)}
							onClick={
								clickable
									? () =>
											ctx.emit({
												on: String(node.onRowClick),
												value: index,
												payload: item as JsonValue,
											})
									: undefined
							}
						>
							{columns.map((column) => (
								<td
									key={column.key}
									className="px-2.5 py-1 text-center whitespace-nowrap"
								>
									{cellText(
										column,
										(item as Record<string, unknown>)?.[column.key],
									)}
								</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

function SvgShape({ node, ctx }: { node: SvgNode; ctx: RenderContext }) {
	if (!node || typeof node !== "object") return null;
	const style = {
		fill: paint(node.fill) ?? (node.type === "text" ? "currentColor" : "none"),
		stroke: paint(node.stroke),
		strokeWidth: finite(node.strokeWidth),
		strokeDasharray:
			typeof node.strokeDasharray === "string" &&
			NUMBER_LIST.test(node.strokeDasharray)
				? node.strokeDasharray
				: undefined,
		opacity: finite(node.opacity),
		transform:
			typeof node.transform === "string" &&
			TRANSFORM.test(node.transform) &&
			!/url/i.test(node.transform)
				? node.transform
				: undefined,
	};
	const interactive =
		typeof node.on === "string"
			? {
					onClick: () =>
						ctx.emit({ on: String(node.on), payload: node.payload }),
					className: "cursor-pointer",
				}
			: {};
	const num = (value: unknown) => finite(value, 0);
	switch (node.type) {
		case "path":
			return typeof node.d === "string" && PATH_DATA.test(node.d) ? (
				<path d={node.d} {...style} {...interactive} />
			) : null;
		case "line":
			return (
				<line
					x1={num(node.x1)}
					y1={num(node.y1)}
					x2={num(node.x2)}
					y2={num(node.y2)}
					{...style}
					{...interactive}
				/>
			);
		case "rect":
			return (
				<rect
					x={num(node.x)}
					y={num(node.y)}
					width={Math.max(0, num(node.width))}
					height={Math.max(0, num(node.height))}
					rx={finite(node.rx)}
					{...style}
					{...interactive}
				/>
			);
		case "circle":
			return (
				<circle
					cx={num(node.cx)}
					cy={num(node.cy)}
					r={Math.max(0, num(node.r))}
					{...style}
					{...interactive}
				/>
			);
		case "ellipse":
			return (
				<ellipse
					cx={num(node.cx)}
					cy={num(node.cy)}
					rx={Math.max(0, num(node.rx))}
					ry={Math.max(0, num(node.ry))}
					{...style}
					{...interactive}
				/>
			);
		case "polyline":
		case "polygon": {
			const points = (Array.isArray(node.points) ? node.points : [])
				.filter(
					(point) =>
						Array.isArray(point) &&
						Number.isFinite(point[0]) &&
						Number.isFinite(point[1]),
				)
				.map((point) => `${point[0]},${point[1]}`)
				.join(" ");
			return node.type === "polyline" ? (
				<polyline points={points} {...style} {...interactive} />
			) : (
				<polygon points={points} {...style} {...interactive} />
			);
		}
		case "text":
			return (
				<text
					x={num(node.x)}
					y={num(node.y)}
					fontSize={finite(node.fontSize, 12)}
					textAnchor={
						pick({ start: 1, middle: 1, end: 1 }, node.anchor)
							? node.anchor
							: undefined
					}
					{...style}
					{...interactive}
				>
					{label(node.text)}
				</text>
			);
		case "g":
			return (
				<g {...style} {...interactive}>
					{keyed(asChildren(node.children) as SvgNode[]).map(({ id, item }) => (
						<SvgShape key={id} node={item} ctx={ctx} />
					))}
				</g>
			);
		default:
			return null;
	}
}

function Node({ node, ctx }: { node: unknown; ctx: RenderContext }): ReactNode {
	if (node === null || node === undefined || node === false) return null;
	if (typeof node === "string" || typeof node === "number") {
		return <span className="text-[13px]">{String(node)}</span>;
	}
	if (typeof node !== "object") return null;
	const value = node as UINode;
	switch (value.type) {
		case "stack":
			return (
				<div className="flex flex-col" style={gapStyle(value.gap)}>
					<Children nodes={value.children} ctx={ctx} />
				</div>
			);
		case "row":
			return (
				<div
					className={cn("flex", value.wrap && "flex-wrap")}
					style={{
						...gapStyle(value.gap ?? 2),
						alignItems: pick(ALIGN, value.align) ?? "center",
						justifyContent: pick(JUSTIFY, value.justify),
					}}
				>
					<Children nodes={value.children} ctx={ctx} />
				</div>
			);
		case "grid":
			return (
				<div
					className="grid"
					style={{
						...gapStyle(value.gap),
						gridTemplateColumns: `repeat(${clamp(value.columns, 1, 6, 2)}, minmax(0, 1fr))`,
					}}
				>
					<Children nodes={value.children} ctx={ctx} />
				</div>
			);
		case "section":
			return (
				<section className="flex flex-col gap-2">
					{value.title !== undefined && (
						<span className={sectionLabelClass}>{label(value.title)}</span>
					)}
					<Children nodes={value.children} ctx={ctx} />
				</section>
			);
		case "text":
			return (
				<p
					className={cn(
						"min-w-0 break-words whitespace-pre-wrap",
						pick(TEXT_SIZE, value.size) ?? TEXT_SIZE.sm,
						pick(WEIGHT, value.weight),
						TONE_TEXT[tone(value.tone)],
						value.mono && "font-mono",
					)}
					style={{
						textAlign: pick(
							{ left: "left", center: "center", right: "right" } as const,
							value.align,
						),
					}}
				>
					{label(value.text)}
				</p>
			);
		case "badge":
			return (
				<span
					className={cn(
						"inline-flex h-5 w-fit items-center rounded-full border px-2 text-xs font-medium",
						TONE_BOX[tone(value.tone)],
					)}
				>
					{label(value.text)}
				</span>
			);
		case "alert":
			return (
				<div
					className={cn(
						"flex gap-2 rounded-md border px-3 py-2 text-[13px]",
						TONE_BOX[tone(value.tone ?? "info")],
					)}
				>
					<TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
					<div className="flex min-w-0 flex-col gap-0.5">
						{value.title !== undefined && (
							<span className="font-medium">{label(value.title)}</span>
						)}
						<span className="whitespace-pre-wrap">{label(value.text)}</span>
					</div>
				</div>
			);
		case "metric":
			return (
				<div className={TONE_TEXT[tone(value.tone)]}>
					<Metric label={label(value.label)} sub={label(value.sub)}>
						{label(value.value)}
					</Metric>
				</div>
			);
		case "kv":
			return (
				<dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 text-[13px] tabular-nums">
					{keyed(asChildren(value.items) as { type?: unknown }[]).map(
						({ id, item }) => {
							const entry = (item && typeof item === "object" ? item : {}) as {
								label?: unknown;
								value?: unknown;
								tone?: unknown;
							};
							return (
								<div key={id} className="contents">
									<dt className="text-muted-foreground">
										{label(entry.label)}
									</dt>
									<dd
										className={cn(
											"min-w-0 break-all",
											TONE_TEXT[tone(entry.tone)],
										)}
									>
										{label(entry.value)}
									</dd>
								</div>
							);
						},
					)}
				</dl>
			);
		case "table":
			return <TableNode node={value} ctx={ctx} />;
		case "code":
			return (
				<pre
					className="overflow-auto rounded-lg border bg-muted/30 p-3 font-mono text-xs whitespace-pre-wrap"
					style={{ maxHeight: clamp(value.maxHeight, 60, 2000, 320) }}
				>
					{label(value.text)}
				</pre>
			);
		case "progress": {
			const fraction = clamp(value.value, 0, 1, 0);
			return (
				<div className="flex flex-col gap-1">
					{value.label !== undefined && (
						<span className="text-xs text-muted-foreground">
							{label(value.label)}
						</span>
					)}
					<div className="h-1.5 overflow-hidden rounded-full bg-muted">
						<div
							className="h-full rounded-full bg-primary transition-[width]"
							style={{ width: `${fraction * 100}%` }}
						/>
					</div>
				</div>
			);
		}
		case "separator":
			return <div className="h-px w-full bg-border" />;
		case "button":
			return (
				<Button
					type="button"
					size={value.size === "sm" ? "sm" : "default"}
					variant={
						pick(
							{
								default: "default",
								secondary: "secondary",
								outline: "outline",
								ghost: "ghost",
								destructive: "destructive",
							} as const,
							value.variant,
						) ?? "default"
					}
					disabled={value.disabled === true}
					className={cn(value.fill && "w-full")}
					onClick={() =>
						ctx.emit({ on: String(value.on), payload: value.payload })
					}
				>
					{label(value.label)}
				</Button>
			);
		case "fields":
			return <FieldsNode node={value} ctx={ctx} />;
		case "trajectory":
			return (
				<TrajectoryView
					view={{
						type: "trajectory",
						points: finitePoints(value.points),
						targetY: finite(value.targetY),
						target: value.target,
						view: value.view === "top" ? "top" : "side",
					}}
					height={finite(value.height)}
				/>
			);
		case "svg":
			return typeof value.viewBox === "string" &&
				NUMBER_LIST.test(value.viewBox) ? (
				<svg
					viewBox={value.viewBox}
					width="100%"
					height={clamp(value.height, 20, 2000, 200)}
					className="text-foreground"
					role="img"
					aria-label={label(value.title)}
				>
					{keyed(asChildren(value.children) as SvgNode[]).map(
						({ id, item }) => (
							<SvgShape key={id} node={item} ctx={ctx} />
						),
					)}
				</svg>
			) : null;
		case "image":
			return typeof value.src === "string" && IMAGE_SOURCE.test(value.src) ? (
				<img
					src={value.src}
					alt={label(value.alt)}
					className="max-w-full rounded-md"
					style={{ height: finite(value.height) }}
				/>
			) : null;
		case "html":
			return (
				<HtmlView
					view={{
						type: "html",
						html: typeof value.html === "string" ? value.html : "",
						height: clamp(value.height, 40, 4000, 320),
					}}
					policy={ctx.policy}
					onAction={async (name, payload) => {
						ctx.emit(
							{ on: String(name), payload: payload as JsonValue },
							false,
						);
					}}
				/>
			);
		default:
			return null;
	}
}

export function PluginUI({
	tree,
	idPrefix,
	policy,
	onEvent,
}: {
	tree: unknown;
	idPrefix: string;
	policy: HtmlPolicy;
	onEvent: (event: UIEvent, fromUser: boolean) => void;
}) {
	const ctx: RenderContext = {
		idPrefix,
		policy,
		emit: (event, fromUser = true) => onEvent(event, fromUser),
	};
	return (
		<div className="flex flex-col gap-3">
			{Array.isArray(tree) ? (
				<Children nodes={tree} ctx={ctx} />
			) : (
				<Node node={tree} ctx={ctx} />
			)}
		</div>
	);
}
