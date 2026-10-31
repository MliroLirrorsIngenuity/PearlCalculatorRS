import { useId, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useElementSize } from "@/hooks/use-element-size";
import { cn } from "@/lib/utils";
import type { PearlTraceResult } from "@/types/domain";
import {
	landingIndex,
	niceTicks,
	peakIndex,
	profileUntil,
	spacedMarks,
	svgPath,
	tickMarks,
	toProfile,
	toTickProfile,
} from "./trajectory";

type Variant = "compact" | "full";

const END_LABEL_GAP = 72;
const HIT_LABEL_GAP = 56;
const OVERRUN = 0.12;
const OVERRUN_Y = 0.5;
const PEAK_LABEL_MIN_WIDTH = 420;

const PEAK_OFFSET = {
	start: { x: 8, y: -10 },
	middle: { x: 0, y: -12 },
	end: { x: -8, y: -12 },
};

function peakAnchor(x: number, width: number) {
	if (x > width * 0.8) return "end" as const;
	if (x < width * 0.2) return "start" as const;
	return "middle" as const;
}

const PADDING: Record<Variant, { l: number; r: number; t: number; b: number }> =
	{
		compact: { l: 48, r: 16, t: 34, b: 22 },
		full: { l: 48, r: 22, t: 46, b: 30 },
	};

interface HeightProfileChartProps {
	trace: PearlTraceResult;
	others?: PearlTraceResult[];
	targetY?: number;
	variant?: Variant;
	xUnit?: "distance" | "tick";
	className?: string;
}

export function HeightProfileChart({
	trace,
	others = [],
	targetY,
	variant = "compact",
	xUnit = "distance",
	className,
}: HeightProfileChartProps) {
	const { t } = useTranslation();
	const { ref, width, height } = useElementSize<HTMLDivElement>();
	const clipId = useId();
	const [probe, setProbe] = useState<number | null>(null);
	const byTick = xUnit === "tick";
	const profileOf = byTick ? toTickProfile : toProfile;
	const main = useMemo(() => profileOf(trace), [profileOf, trace]);
	const rest = useMemo(() => others.map(profileOf), [profileOf, others]);

	const pad = PADDING[variant];
	const landing = landingIndex(trace);
	const peak = peakIndex(main.slice(0, landing + 1));
	const all = [main, ...rest].flat();
	const reach = Math.max(...all.map((p) => p.d), 1);
	const showHit = Boolean(trace.closest_approach);
	const dMax = showHit ? reach * (1 + OVERRUN) : reach;
	const flightYs = all
		.map((p) => p.y)
		.concat(targetY === undefined ? [] : [targetY]);
	const flightLo = Math.min(...flightYs);
	const flightHi = Math.max(...flightYs);
	const yMargin = Math.max(flightHi - flightLo, 1) * OVERRUN_Y;
	const yMin = flightLo - yMargin;
	const yMax = flightHi + yMargin;
	const overrun = useMemo(() => {
		if (!showHit) return [];
		const points = profileUntil(
			trace,
			landing,
			byTick,
			(p) => p.d >= dMax || p.y < yMin || p.y > yMax,
		);
		const last = points[points.length - 1];
		const prev = points[points.length - 2];
		if (!last || !prev || last.d <= dMax) return points;
		const k = (dMax - prev.d) / (last.d - prev.d);
		return [
			...points.slice(0, -1),
			{ d: dMax, y: prev.y + (last.y - prev.y) * k },
		];
	}, [trace, showHit, dMax, landing, byTick, yMin, yMax]);
	const hitD = main[landing]?.d ?? 0;
	const labelAt = showHit ? hitD : dMax;
	const labelGap = showHit ? HIT_LABEL_GAP : END_LABEL_GAP;
	const ys = flightYs.concat(
		overrun.map((p) => Math.min(Math.max(p.y, yMin), yMax)),
	);
	const yAxis = niceTicks(
		Math.min(...ys),
		Math.max(...ys),
		variant === "full" ? 4 : 3,
	);
	const yLo = yAxis.ticks[0];
	const yHi = yAxis.ticks[yAxis.ticks.length - 1];
	const xAxis = niceTicks(0, dMax, variant === "full" ? 6 : 3);

	const X = (d: number) => pad.l + (d / dMax) * (width - pad.l - pad.r);
	const Y = (y: number) =>
		pad.t + ((yHi - y) / (yHi - yLo || 1)) * (height - pad.t - pad.b);
	const line = (points: typeof main) =>
		svgPath(points.map((p) => [X(p.d), Y(p.y)]));
	const xTicks = xAxis.ticks.filter(
		(v) =>
			v <= dMax &&
			Math.abs(X(v) - X(labelAt)) > labelGap &&
			X(dMax) - X(v) > (showHit ? 14 : 0),
	);

	const ready = width > 0 && height > 0 && main.length > 0;
	const isFull = variant === "full";
	const probePoint = probe === null ? null : trace.pearl_trace[probe];

	const handleMove = (event: React.MouseEvent<SVGSVGElement>) => {
		const box = event.currentTarget.getBoundingClientRect();
		const d =
			((event.clientX - box.left - pad.l) / (width - pad.l - pad.r)) * dMax;
		let nearest = 0;
		for (let i = 0; i <= landing; i++) {
			if (Math.abs(main[i].d - d) < Math.abs(main[nearest].d - d)) nearest = i;
		}
		setProbe(nearest);
	};

	return (
		<div ref={ref} className={cn("relative h-full w-full", className)}>
			{ready && (
				<svg
					role="img"
					aria-label={t("chart.profile_aria")}
					width={width}
					height={height}
					className="absolute inset-0"
					onMouseMove={isFull ? handleMove : undefined}
					onMouseLeave={isFull ? () => setProbe(null) : undefined}
				>
					<g className="stroke-border/70 dark:stroke-zinc-800">
						{yAxis.ticks.map((v) => (
							<line
								key={`y${v}`}
								x1={pad.l}
								x2={width - pad.r}
								y1={Y(v)}
								y2={Y(v)}
							/>
						))}
						{xTicks.map((v) => (
							<line
								key={`x${v}`}
								x1={X(v)}
								x2={X(v)}
								y1={pad.t}
								y2={height - pad.b}
							/>
						))}
						<line x1={X(dMax)} x2={X(dMax)} y1={pad.t} y2={height - pad.b} />
					</g>
					<g className="fill-muted-foreground text-[10px] tabular-nums">
						{yAxis.ticks.map((v, i) => (
							<text key={`yl${v}`} x={pad.l - 6} y={Y(v) + 3} textAnchor="end">
								{i === yAxis.ticks.length - 1 ? `Y ${v}` : v}
							</text>
						))}
						{xTicks.map((v) => (
							<text
								key={`xl${v}`}
								x={X(v)}
								y={height - pad.b + 14}
								textAnchor={v === 0 ? "start" : "middle"}
							>
								{v}
							</text>
						))}
						<text
							x={X(labelAt)}
							y={height - pad.b + 14}
							textAnchor={showHit ? "middle" : "end"}
							className={cn(showHit && "fill-foreground font-medium")}
						>
							{t(byTick ? "chart.ticks" : "chart.blocks", {
								value: labelAt.toFixed(0),
							})}
						</text>
					</g>
					{targetY !== undefined && (
						<>
							<line
								x1={pad.l}
								x2={width - pad.r}
								y1={Y(targetY)}
								y2={Y(targetY)}
								strokeDasharray="3 3"
								className="stroke-muted-foreground/50"
							/>
							{isFull && (
								<text
									x={pad.l + 6}
									y={Y(targetY) - 6}
									className="fill-muted-foreground text-[11px]"
								>
									{t("chart.target_y", { value: targetY })}
								</text>
							)}
						</>
					)}
					{showHit && (
						<>
							<clipPath id={clipId}>
								<rect
									x={pad.l}
									y={pad.t}
									width={X(dMax) - pad.l}
									height={height - pad.t - pad.b}
								/>
							</clipPath>
							<line
								x1={X(hitD)}
								x2={X(hitD)}
								y1={pad.t}
								y2={height - pad.b}
								strokeWidth={1.25}
								className="stroke-foreground/60"
							/>
							<path
								d={line(overrun)}
								clipPath={`url(#${clipId})`}
								fill="none"
								strokeWidth={1.5}
								strokeDasharray="4 3"
								className="stroke-muted-foreground"
							/>
						</>
					)}
					{[...new Set(rest.map(line))].map((d) => (
						<path
							key={d}
							d={d}
							fill="none"
							strokeWidth={1}
							className="stroke-border dark:stroke-zinc-600"
						/>
					))}
					<path
						d={line(main.slice(0, landing + 1))}
						fill="none"
						strokeWidth={isFull ? 2.25 : 2}
						strokeLinejoin="round"
						className="stroke-foreground"
					/>
					{isFull &&
						!byTick &&
						spacedMarks(tickMarks(landing), (tick) => [
							X(main[tick].d),
							Y(main[tick].y),
						]).map((tick) => (
							<rect
								key={tick}
								x={X(main[tick].d) - 2}
								y={Y(main[tick].y) - 2}
								width={4}
								height={4}
								className="fill-foreground"
							/>
						))}
					<rect
						x={X(main[peak].d) - 3.5}
						y={Y(main[peak].y) - 3.5}
						width={7}
						height={7}
						strokeWidth={1.5}
						className="fill-background stroke-foreground"
					/>
					{isFull && width >= PEAK_LABEL_MIN_WIDTH && (
						<text
							x={
								X(main[peak].d) +
								PEAK_OFFSET[peakAnchor(X(main[peak].d), width)].x
							}
							y={
								Y(main[peak].y) +
								PEAK_OFFSET[peakAnchor(X(main[peak].d), width)].y
							}
							textAnchor={peakAnchor(X(main[peak].d), width)}
							className="fill-muted-foreground text-[11px] tabular-nums"
						>
							{t("chart.peak", { y: main[peak].y.toFixed(1), tick: peak })}
						</text>
					)}
					<rect
						x={X(main[landing].d) - 4}
						y={Y(main[landing].y) - 4}
						width={8}
						height={8}
						className="fill-foreground"
					/>
					{probe !== null && (
						<>
							<line
								x1={X(main[probe].d)}
								x2={X(main[probe].d)}
								y1={pad.t}
								y2={height - pad.b}
								className="stroke-muted-foreground/40"
							/>
							<rect
								x={X(main[probe].d) - 4}
								y={Y(main[probe].y) - 4}
								width={8}
								height={8}
								strokeWidth={2}
								className="fill-background stroke-foreground"
							/>
						</>
					)}
				</svg>
			)}
			{ready && probe !== null && probePoint && (
				<div
					className="pointer-events-none absolute rounded-md border bg-popover px-2.5 py-1.5 text-xs leading-relaxed shadow-md tabular-nums"
					style={{
						left: Math.min(X(main[probe].d) + 12, width - 170),
						top: Math.min(Y(main[probe].y) + 12, height - 70),
					}}
				>
					<div className="font-medium">Tick {probe}</div>
					<div>
						<span className="text-muted-foreground">X</span>{" "}
						{probePoint.X.toFixed(2)}{" "}
						<span className="text-muted-foreground">Y</span>{" "}
						{probePoint.Y.toFixed(2)}
					</div>
					<div>
						<span className="text-muted-foreground">Z</span>{" "}
						{probePoint.Z.toFixed(2)}
					</div>
				</div>
			)}
		</div>
	);
}
