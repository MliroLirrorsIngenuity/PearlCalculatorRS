import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import TraceDataPanel, {
	type TraceDataPanelRef,
} from "@/components/calculator/results/TraceDataPanel";
import { HeightProfileChart } from "@/components/charts/HeightProfileChart";
import { LandingBlockView } from "@/components/charts/LandingBlockView";
import { LandingFaceView } from "@/components/charts/LandingFaceView";
import {
	LandingZoomView,
	landingOffset,
} from "@/components/charts/LandingZoomView";
import { TopDownChart } from "@/components/charts/TopDownChart";
import {
	descentAngle,
	hitBlock,
	incomingDirection,
	landingIndex,
	landingPoint,
	peakIndex,
	toProfile,
} from "@/components/charts/trajectory";
import {
	Metric,
	Segmented,
	sectionLabelClass as sectionLabel,
	TntCounts,
	Unit,
} from "@/components/common/Metric";
import { Button } from "@/components/ui/button";
import { useCalculatorState } from "@/context/CalculatorStateContext";
import { useConfigurationState } from "@/context/ConfigurationStateContext";
import { useMobileView } from "@/context/MobileViewContext";
import { useDirectionLabel } from "@/hooks/use-direction-label";
import { targetHeight } from "@/lib/calculator-defaults";
import { cn } from "@/lib/utils";

export default function PearlTracePanel() {
	const { t } = useTranslation();
	const { getCardinalLabel } = useDirectionLabel();
	const { defaultCalculator, updateBitCalculation } = useCalculatorState();
	const { calculationMode } = useConfigurationState();
	const { isMobile } = useMobileView();
	const tableRef = useRef<TraceDataPanelRef>(null);
	const [chartView, setChartView] = useState<"side" | "top">("side");
	const [landingView, setLandingView] = useState<"block" | "face" | "zoom">(
		"block",
	);

	const { data: trace, tnt, direction } = defaultCalculator.trace;
	const inputs = defaultCalculator.inputs;
	if (!trace) return null;

	const target = {
		x: parseFloat(inputs.destX) || 0,
		z: parseFloat(inputs.destZ) || 0,
	};
	const landing = landingIndex(trace);
	const profile = toProfile(trace);
	const peak = peakIndex(profile.slice(0, landing + 1));
	const deviation = trace.closest_approach?.distance ?? trace.distance;
	const { east, south } = landingOffset(trace, target);
	const { block, face } = hitBlock(
		landingPoint(trace),
		incomingDirection(trace),
	);
	const offsetText = t("trace.offset", {
		ewDir:
			east >= 0
				? t("calculator.direction_east")
				: t("calculator.direction_west"),
		ewValue: Math.abs(east).toFixed(4),
		nsDir:
			south >= 0
				? t("calculator.direction_south")
				: t("calculator.direction_north"),
		nsValue: Math.abs(south).toFixed(4),
	});

	return (
		<div
			className={cn(
				"flex h-full w-full gap-4 bg-card p-4",
				isMobile && "flex-col overflow-auto",
			)}
		>
			<div
				className={cn(
					"@container flex min-w-0 flex-1 flex-col gap-4",
					!isMobile && "overflow-y-auto",
				)}
			>
				<div className="relative h-[clamp(200px,42vh,300px)] shrink-0 rounded-lg border">
					<span className={cn(sectionLabel, "absolute top-3.5 left-3.5")}>
						{t("trace.flight_title")}
					</span>
					<div className="absolute top-2 right-3 z-10">
						<Segmented
							value={chartView}
							onChange={setChartView}
							options={[
								{ value: "side", label: t("trace.view_side") },
								{ value: "top", label: t("trace.view_top") },
							]}
						/>
					</div>
					{chartView === "side" ? (
						<HeightProfileChart
							trace={trace}
							targetY={targetHeight(inputs, calculationMode)}
							variant="full"
						/>
					) : (
						<TopDownChart trace={trace} target={target} />
					)}
				</div>

				<div
					className={cn(
						"flex min-h-[240px] flex-1 flex-col gap-5 @2xl:flex-row",
					)}
				>
					<div className="flex min-w-0 flex-1 flex-col gap-4">
						<span className={sectionLabel}>{t("trace.summary_title")}</span>
						<div className="grid grid-cols-1 gap-x-6 gap-y-5 @sm:grid-cols-2">
							<Metric
								label="TNT"
								sub={t("trace.tnt_sub", {
									total: tnt?.total ?? 0,
									direction: getCardinalLabel(direction),
								})}
							>
								<TntCounts
									blue={tnt?.blue}
									red={tnt?.red}
									vertical={
										calculationMode === "Vector3D" ? tnt?.vertical : undefined
									}
								/>
							</Metric>
							<Metric label={t("trace.deviation")} sub={offsetText}>
								{deviation.toFixed(4)}
								<Unit>{t("trace.blocks_unit")}</Unit>
							</Metric>
							<Metric
								label={t("trace.flight")}
								sub={
									<>
										{t("trace.seconds", { value: (landing / 20).toFixed(2) })} ·{" "}
										<button
											type="button"
											className="underline-offset-2 hover:text-foreground hover:underline"
											onClick={() => tableRef.current?.scrollToRow(landing)}
										>
											{t("trace.locate")}
										</button>
									</>
								}
							>
								{landing}
								<Unit>tick</Unit>
							</Metric>
							<Metric
								label={t("trace.peak")}
								sub={t("trace.peak_tick", { tick: peak })}
							>
								<Unit>Y</Unit>
								{profile[peak]?.y.toFixed(1)}
							</Metric>
						</div>
						<div className="flex-1" />
						<Button onClick={() => updateBitCalculation({ show: true })}>
							{t("calculator.bit_calc_btn")}
						</Button>
					</div>

					<div className="hidden w-px bg-border/60 @2xl:block" />

					<div className="flex w-full shrink-0 flex-col gap-2 @2xl:w-60">
						<div className="flex items-center justify-between">
							<span className={sectionLabel}>{t("trace.landing_title")}</span>
							<Segmented
								value={landingView}
								onChange={setLandingView}
								options={[
									{ value: "block", label: t("trace.view_block") },
									{ value: "face", label: t("trace.view_face") },
									{ value: "zoom", label: t("trace.view_zoom") },
								]}
							/>
						</div>
						<div className="flex min-h-0 flex-1 items-center justify-center">
							{landingView === "block" ? (
								<LandingBlockView trace={trace} size="full" />
							) : landingView === "face" ? (
								<LandingFaceView trace={trace} size="full" />
							) : (
								<LandingZoomView trace={trace} target={target} />
							)}
						</div>
						{landingView !== "zoom" ? (
							<div className="flex flex-col gap-0.5 text-xs tabular-nums">
								<span>
									{t("trace.hit_face", {
										face: t(`trace.face.${face}`),
										angle: descentAngle(trace).toFixed(1),
									})}
								</span>
								<span className="text-muted-foreground">
									{t("trace.hit_block", {
										x: block.X,
										y: block.Y,
										z: block.Z,
									})}
								</span>
							</div>
						) : (
							<span className="text-xs text-muted-foreground tabular-nums">
								{offsetText}
							</span>
						)}
					</div>
				</div>
			</div>

			<div
				className={cn(
					"flex w-[min(460px,44%)] shrink-0 flex-col",
					isMobile && "h-[480px] w-full",
				)}
			>
				<TraceDataPanel ref={tableRef} data={trace} />
			</div>
		</div>
	);
}
