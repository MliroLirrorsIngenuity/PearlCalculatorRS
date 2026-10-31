import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { PearlTraceResult } from "@/types/domain";
import { landingPoint, niceTicks } from "./trajectory";

const WIDTH = 240;
const HEIGHT = 220;
const CX = 120;
const CY = 110;
const HALF = 95;

interface LandingZoomViewProps {
	trace: PearlTraceResult;
	target: { x: number; z: number };
	className?: string;
}

export function landingOffset(
	trace: PearlTraceResult,
	target: { x: number; z: number },
) {
	const point = landingPoint(trace);
	return { east: point.X - target.x, south: point.Z - target.z };
}

export function LandingZoomView({
	trace,
	target,
	className,
}: LandingZoomViewProps) {
	const { t } = useTranslation();
	const { east, south } = landingOffset(trace, target);
	const deviation = trace.closest_approach?.distance ?? trace.distance;
	const { step } = niceTicks(
		0,
		Math.max(Math.hypot(east, south) * 1.8, 0.0005),
		4,
	);
	const range = step * 4;
	const k = HALF / range;
	const lx = CX + east * k;
	const ly = CY + south * k;

	const grid = Array.from({ length: 9 }, (_, i) => (i - 4) * step * k)
		.map(
			(o) =>
				`M${(CX + o).toFixed(1)},${CY - HALF}V${CY + HALF}M${CX - HALF},${(CY + o).toFixed(1)}H${CX + HALF}`,
		)
		.join("");

	return (
		<svg
			role="img"
			aria-label={t("chart.zoom_aria", { value: deviation.toFixed(4) })}
			viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
			className={cn("h-auto w-full", className)}
		>
			<path d={grid} fill="none" className="stroke-border/60" />
			<path
				d={`M${CX},${CY - HALF}V${CY + HALF}M${CX - HALF},${CY}H${CX + HALF}`}
				className="stroke-border"
			/>
			<line
				x1={CX}
				y1={CY}
				x2={lx}
				y2={ly}
				strokeWidth={1.25}
				strokeDasharray="3 2"
				className="stroke-foreground"
			/>
			<path
				d={`M${CX - 8},${CY}h16M${CX},${CY - 8}v16`}
				strokeWidth={1.5}
				className="stroke-red-600"
			/>
			<rect
				x={lx - 5.5}
				y={ly - 5.5}
				width={11}
				height={11}
				className="fill-foreground"
			/>
			<text
				x={lx + 10}
				y={ly - 8}
				className="fill-foreground text-[11.5px] font-semibold tabular-nums"
			>
				{t("chart.blocks", { value: deviation.toFixed(4) })}
			</text>
			<line
				x1={CX - HALF}
				x2={CX - HALF + step * k}
				y1={HEIGHT - 4}
				y2={HEIGHT - 4}
				strokeWidth={2}
				className="stroke-muted-foreground"
			/>
			<text
				x={CX - HALF + step * k + 6}
				y={HEIGHT - 1}
				className="fill-muted-foreground text-[10.5px] tabular-nums"
			>
				{t("chart.blocks", { value: step })}
			</text>
		</svg>
	);
}
