import { Orbit } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import TraceDataPanel from "@/components/calculator/results/TraceDataPanel";
import { HeightProfileChart } from "@/components/charts/HeightProfileChart";
import { TopDownChart } from "@/components/charts/TopDownChart";
import { peakIndex, toProfile } from "@/components/charts/trajectory";
import { EmptyState } from "@/components/common/EmptyState";
import {
	Metric,
	Segmented,
	sectionLabelClass,
	Unit,
} from "@/components/common/Metric";
import { cn } from "@/lib/utils";
import type { PearlTraceResult } from "@/types/domain";

const RANGES = [100, 1000, 10000];

function TickLabel({ ticks }: { ticks: number }) {
	const { t } = useTranslation();
	return (
		<>
			<span className="@lg:hidden">{ticks}</span>
			<span className="hidden @lg:inline">
				{t("simulator.range_ticks", { count: ticks })}
			</span>
		</>
	);
}

function windowed(trace: PearlTraceResult, ticks: number): PearlTraceResult {
	return {
		...trace,
		pearl_trace: trace.pearl_trace.slice(0, ticks + 1),
		pearl_motion_trace: trace.pearl_motion_trace.slice(0, ticks + 1),
		closest_approach: undefined,
	};
}

export function SimulatorResults({
	trace,
	className,
}: {
	trace: PearlTraceResult | null;
	className?: string;
}) {
	const { t } = useTranslation();
	const [view, setView] = useState<"side" | "top">("side");
	const [ticks, setTicks] = useState(RANGES[0]);

	const visible = useMemo(
		() => (trace ? windowed(trace, ticks) : null),
		[trace, ticks],
	);

	if (!trace || !visible || trace.pearl_trace.length === 0) {
		return (
			<EmptyState
				className={className}
				icon={<Orbit />}
				title={t("simulator.empty_title")}
				hint={t("simulator.empty_hint")}
			/>
		);
	}

	const profile = toProfile(visible);
	const peak = peakIndex(profile);
	const motion = trace.pearl_motion_trace[0] ?? { X: 0, Y: 0, Z: 0 };
	const horizontal = Math.hypot(motion.X, motion.Z);
	return (
		<div
			className={cn("flex min-h-0 flex-col gap-3 overflow-y-auto", className)}
		>
			<div className="grid shrink-0 grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] gap-4 px-1">
				<Metric
					label={t("simulator.horizontal_speed")}
					sub={t("simulator.speed_unit")}
				>
					{horizontal.toFixed(4)}
				</Metric>
				<Metric
					label={t("simulator.vertical_speed")}
					sub={t("simulator.speed_unit")}
				>
					{motion.Y.toFixed(4)}
				</Metric>
				<Metric
					label={t("trace.peak")}
					sub={t("trace.peak_tick", { tick: peak })}
				>
					<Unit>Y</Unit>
					{profile[peak]?.y.toFixed(2)}
				</Metric>
			</div>

			<div className="@container relative h-[clamp(160px,32vh,260px)] shrink-0 rounded-lg border">
				<span
					className={cn(
						sectionLabelClass,
						"absolute top-3.5 left-3.5 hidden @md:inline",
					)}
				>
					{t("trace.flight_title")}
				</span>
				<div className="absolute top-2 right-3 z-10 flex gap-2">
					<Segmented
						value={String(ticks)}
						onChange={(value) => setTicks(Number(value))}
						options={RANGES.map((value) => ({
							value: String(value),
							label: <TickLabel ticks={value} />,
						}))}
					/>
					<Segmented
						value={view}
						onChange={setView}
						options={[
							{ value: "side", label: t("simulator.view_height") },
							{ value: "top", label: t("trace.view_top") },
						]}
					/>
				</div>
				{view === "side" ? (
					<HeightProfileChart trace={visible} variant="full" xUnit="tick" />
				) : (
					<TopDownChart trace={visible} />
				)}
			</div>

			<div className="flex min-h-[160px] flex-1 flex-col">
				<TraceDataPanel data={trace} />
			</div>
		</div>
	);
}
