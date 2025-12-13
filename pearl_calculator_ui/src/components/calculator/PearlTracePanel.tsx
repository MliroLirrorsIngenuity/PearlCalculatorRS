import { ArrowRight } from "lucide-react";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import type { DataTableRef } from "@/components/calculator/results/data-table";
import TraceDataPanel from "@/components/calculator/results/TraceDataPanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCalculatorState } from "@/context/CalculatorStateContext";
import { useDirectionLabel } from "@/hooks/use-direction-label";
import type { PearlTraceResult, TraceTNT } from "@/types/domain";

interface PearlTracePanelProps {
	pearlTraceData: PearlTraceResult | null;
	destX: string;
	destZ: string;
	traceDirection: string;
	traceTNT: TraceTNT | null;
}

export default function PearlTracePanel({
	pearlTraceData,
	destX,
	destZ,
	traceDirection,
	traceTNT,
}: PearlTracePanelProps) {
	const { t } = useTranslation();
	const { getCardinalLabel } = useDirectionLabel();
	const closestApproach = pearlTraceData?.closest_approach;
	const traceDataPanelRef = useRef<DataTableRef>(null);
	const { updateBitCalculation } = useCalculatorState();

	const handleJumpToTick = () => {
		if (closestApproach && traceDataPanelRef.current) {
			traceDataPanelRef.current.scrollToRow(closestApproach.tick);
		}
	};

	if (!pearlTraceData) {
		return null;
	}

	return (
		<div className="flex h-full w-full flex-row p-6 gap-4 bg-background">
			<div className="w-[40%] h-full">
				<Card className="h-full flex flex-col">
					<CardHeader className="pb-3">
						<CardTitle className="text-base">
							{t("calculator.trace_summary_title")}
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2 text-sm flex-1 flex flex-col">
						<div className="flex flex-col gap-1">
							<span className="text-muted-foreground">
								{t("calculator.trace_dest_target")}
							</span>
							<div className="grid grid-cols-3 gap-2 font-medium">
								<span>
									{t("calculator.trace_x", { value: destX || "N/A" })}
								</span>
								<span>
									{t("calculator.trace_z", { value: destZ || "N/A" })}
								</span>
								<span>
									<Badge className="rounded-full">
										{getCardinalLabel(traceDirection) || "N/A"}
									</Badge>
								</span>
							</div>
						</div>
						<div className="flex flex-col gap-1">
							<span className="text-muted-foreground">
								{t("calculator.trace_tnt_config")}
							</span>
							<div className="grid grid-cols-3 gap-2 font-medium">
								<span>
									{t("calculator.trace_blue", {
										value: traceTNT?.blue ?? "N/A",
									})}
								</span>
								<span>
									{t("calculator.trace_red", { value: traceTNT?.red ?? "N/A" })}
								</span>
								<span>
									{t("calculator.trace_total", {
										value: traceTNT?.total ?? "N/A",
									})}
								</span>
							</div>
						</div>
						{closestApproach && (
							<>
								<div className="flex flex-col gap-1">
									<span className="text-muted-foreground">
										{t("calculator.trace_closest_approach")}
									</span>
									<div className="grid grid-cols-3 gap-2 font-medium">
										<span>
											{t("calculator.trace_x", {
												value: closestApproach.point.X.toFixed(2),
											})}
										</span>
										<span>
											{t("calculator.trace_y", {
												value: closestApproach.point.Y.toFixed(2),
											})}
										</span>
										<span>
											{t("calculator.trace_z", {
												value: closestApproach.point.Z.toFixed(2),
											})}
										</span>
									</div>
								</div>
								<div className="flex flex-col gap-1">
									<span className="text-muted-foreground">
										{t("calculator.trace_approach_tick")}
									</span>
									<div className="grid grid-cols-3 gap-2 font-medium items-center">
										<span>{closestApproach.tick}</span>
										<span>
											<Button
												variant="outline"
												className="h-auto rounded-full px-2.5 py-0.5 text-xs font-semibold"
												onClick={handleJumpToTick}
											>
												<ArrowRight className="h-3 w-3" />
											</Button>
										</span>
										<span />
									</div>
								</div>
								<div className="flex flex-col gap-1">
									<span className="text-muted-foreground">
										{t("calculator.trace_distance_target")}
									</span>
									<span className="font-medium">
										{closestApproach.distance.toFixed(2)}{" "}
										{t("calculator.suffix_blocks")}
									</span>
								</div>
							</>
						)}
						<div className="pt-4 mt-auto">
							<Button
								variant="outline"
								className="w-full"
								onClick={() => updateBitCalculation({ show: true })}
							>
								{t("calculator.bit_calc_btn")}
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
			<div className="flex-1 h-full overflow-hidden flex flex-col gap-2">
				<TraceDataPanel ref={traceDataPanelRef} data={pearlTraceData} />
			</div>
		</div>
	);
}
