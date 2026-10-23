import { useTranslation } from "react-i18next";
import { useElementSize } from "@/hooks/use-element-size";
import { cn } from "@/lib/utils";
import type { PearlTraceResult } from "@/types/domain";
import {
	landingIndex,
	niceTicks,
	spacedMarks,
	svgPath,
	tickMarks,
} from "./trajectory";

const PAD = { l: 56, r: 22, t: 46, b: 30 };

interface TopDownChartProps {
	trace: PearlTraceResult;
	target?: { x: number; z: number };
	className?: string;
}

const X_LABEL_SPACING = 72;
const Z_LABEL_SPACING = 40;

export function TopDownChart({ trace, target, className }: TopDownChartProps) {
	const { t } = useTranslation();
	const { ref, width, height } = useElementSize<HTMLDivElement>();
	const end = landingIndex(trace);
	const points = trace.pearl_trace.slice(0, end + 1);
	const xs = points.map((p) => p.X).concat(target ? [target.x] : []);
	const zs = points.map((p) => p.Z).concat(target ? [target.z] : []);
	const minX = Math.min(...xs);
	const maxX = Math.max(...xs);
	const minZ = Math.min(...zs);
	const maxZ = Math.max(...zs);
	const innerW = width - PAD.l - PAD.r;
	const innerH = height - PAD.t - PAD.b;
	const scale = Math.min(
		innerW / (maxX - minX || 1),
		innerH / (maxZ - minZ || 1),
	);
	const ox = PAD.l + (innerW - (maxX - minX) * scale) / 2;
	const oz = PAD.t + (innerH - (maxZ - minZ) * scale) / 2;
	const X = (x: number) => ox + (x - minX) * scale;
	const Z = (z: number) => oz + (z - minZ) * scale;
	const xCount = Math.max(
		1,
		Math.floor(((maxX - minX) * scale) / X_LABEL_SPACING),
	);
	const zCount = Math.max(
		1,
		Math.floor(((maxZ - minZ) * scale) / Z_LABEL_SPACING),
	);
	const xTicks = niceTicks(minX, maxX, xCount).ticks.filter(
		(v) => v >= minX && v <= maxX,
	);
	const zTicks = niceTicks(minZ, maxZ, zCount).ticks.filter(
		(v) => v >= minZ && v <= maxZ,
	);
	const ready = width > 0 && height > 0 && points.length > 0;
	const last = points[points.length - 1];

	return (
		<div ref={ref} className={cn("relative h-full w-full", className)}>
			{ready && (
				<svg
					role="img"
					aria-label={t("chart.top_aria")}
					width={width}
					height={height}
					className="absolute inset-0"
				>
					<g className="stroke-border/70 dark:stroke-zinc-800">
						{xTicks.map((v) => (
							<line
								key={`x${v}`}
								x1={X(v)}
								x2={X(v)}
								y1={PAD.t}
								y2={height - PAD.b}
							/>
						))}
						{zTicks.map((v) => (
							<line
								key={`z${v}`}
								x1={PAD.l}
								x2={width - PAD.r}
								y1={Z(v)}
								y2={Z(v)}
							/>
						))}
					</g>
					<g className="fill-muted-foreground text-[10px] tabular-nums">
						{xTicks.map((v) => (
							<text
								key={`xl${v}`}
								x={X(v)}
								y={height - PAD.b + 14}
								textAnchor="middle"
							>
								X {v}
							</text>
						))}
						{zTicks.map((v) => (
							<text key={`zl${v}`} x={PAD.l - 6} y={Z(v) + 3} textAnchor="end">
								Z {v}
							</text>
						))}
					</g>
					<path
						d={svgPath(points.map((p) => [X(p.X), Z(p.Z)]))}
						fill="none"
						strokeWidth={2}
						className="stroke-foreground"
					/>
					{spacedMarks(tickMarks(end), (tick) => [
						X(points[tick].X),
						Z(points[tick].Z),
					]).map((tick) => (
						<rect
							key={tick}
							x={X(points[tick].X) - 2}
							y={Z(points[tick].Z) - 2}
							width={4}
							height={4}
							className="fill-foreground"
						/>
					))}
					<rect
						x={X(points[0].X) - 3.5}
						y={Z(points[0].Z) - 3.5}
						width={7}
						height={7}
						strokeWidth={1.5}
						className="fill-background stroke-foreground"
					/>
					{target && (
						<path
							d={`M${X(target.x) - 8},${Z(target.z)}h16M${X(target.x)},${Z(target.z) - 8}v16`}
							strokeWidth={1.5}
							className="stroke-red-600"
						/>
					)}
					<rect
						x={X(last.X) - 4}
						y={Z(last.Z) - 4}
						width={8}
						height={8}
						className="fill-foreground"
					/>
				</svg>
			)}
		</div>
	);
}
