import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { HeightProfileChart } from "@/components/charts/HeightProfileChart";
import { LandingBlockView } from "@/components/charts/LandingBlockView";
import {
	descentAngle,
	hitBlock,
	incomingDirection,
	landingIndex,
	landingPoint,
	peakIndex,
	toProfile,
} from "@/components/charts/trajectory";
import { useConfigurationState } from "@/context/ConfigurationStateContext";
import { useElementSize } from "@/hooks/use-element-size";
import { traceKey, useResultTraces } from "@/hooks/use-result-traces";
import { targetHeight } from "@/lib/calculator-defaults";
import type { CalculatorInputs, TNTResult } from "@/types/domain";

const sectionLabel =
	"absolute top-2.5 left-3 text-xs font-medium tracking-wide text-muted-foreground";

interface TrajectoryPreviewProps {
	inputs: CalculatorInputs;
	active: TNTResult | null;
	others: TNTResult[];
}

const toSelection = (r: TNTResult) => ({
	blue: r.blue,
	red: r.red,
	vertical: r.vertical,
	direction: r.direction,
	tick: r.tick,
});

export function TrajectoryPreview({
	inputs,
	active,
	others,
}: TrajectoryPreviewProps) {
	const { t } = useTranslation();
	const { calculationMode } = useConfigurationState();
	const { ref, width } = useElementSize<HTMLDivElement>();
	const selections = useMemo(
		() => (active ? [active, ...others] : others).map(toSelection),
		[active, others],
	);
	const traces = useResultTraces(inputs, selections);
	const trace = active ? traces[traceKey(toSelection(active))] : undefined;
	const otherTraces = useMemo(
		() =>
			others
				.filter((r) => r !== active)
				.map((r) => traces[traceKey(toSelection(r))])
				.filter((x) => x !== undefined),
		[others, active, traces],
	);
	const profile = trace ? toProfile(trace) : [];
	const landing = trace ? landingIndex(trace) : 0;
	const peak = peakIndex(profile.slice(0, landing + 1));
	const showBlock = width >= 520;

	return (
		<div
			ref={ref}
			className="flex h-40 shrink-0 overflow-hidden rounded-lg border bg-card"
		>
			{!trace ? (
				<div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
					{t("preview.empty")}
				</div>
			) : (
				<>
					{showBlock && (
						<div className="relative w-[150px] shrink-0 border-r border-border/60">
							<span className={sectionLabel}>{t("preview.landing")}</span>
							<LandingBlockView trace={trace} className="mt-6" />
							<span className="absolute bottom-1.5 left-3 text-[11px] text-muted-foreground tabular-nums first-letter:uppercase">
								{t("preview.hit", {
									face: t(
										`trace.face.${hitBlock(landingPoint(trace), incomingDirection(trace)).face}`,
									),
									value: descentAngle(trace).toFixed(1),
								})}
							</span>
						</div>
					)}
					<div className="relative min-w-0 flex-1">
						<span className={sectionLabel}>{t("preview.title")}</span>
						<div className="absolute top-2 right-3.5 flex items-baseline gap-3.5 text-xs text-muted-foreground tabular-nums">
							<span>
								{t("preview.peak")}{" "}
								<b className="text-sm font-semibold text-foreground">
									Y {profile[peak]?.y.toFixed(1)}
								</b>
							</span>
							<span>
								{t("preview.flight")}{" "}
								<b className="text-sm font-semibold text-foreground">
									{landing}
								</b>{" "}
								tick
							</span>
						</div>
						<HeightProfileChart
							trace={trace}
							others={otherTraces}
							targetY={targetHeight(inputs, calculationMode)}
							variant="compact"
						/>
					</div>
				</>
			)}
		</div>
	);
}
