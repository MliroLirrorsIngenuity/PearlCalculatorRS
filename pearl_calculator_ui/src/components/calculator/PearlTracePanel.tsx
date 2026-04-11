import { ArrowRight, ChevronDown, ChevronUp, Info } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { DataTableRef } from "@/components/calculator/results/data-table";
import TraceDataPanel from "@/components/calculator/results/TraceDataPanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCalculatorState } from "@/context/CalculatorStateContext";
import { useConfigurationState } from "@/context/ConfigurationStateContext";
import { useDirectionLabel } from "@/hooks/use-direction-label";
import type { PearlTraceResult, TraceTNT } from "@/types/domain";

interface PearlTracePanelProps {
	pearlTraceData: PearlTraceResult | null;
	destX: string;
	destY?: string;
	destZ: string;
	planeInterceptY?: boolean;
	traceDirection: string;
	traceTNT: TraceTNT | null;
}

export default function PearlTracePanel({
	pearlTraceData,
	destX,
	destY,
	destZ,
	planeInterceptY,
	traceDirection,
	traceTNT,
}: PearlTracePanelProps) {
	const { t } = useTranslation();
	const { getCardinalLabel } = useDirectionLabel();
	const traceDataPanelRef = useRef<DataTableRef>(null);
	const { updateBitCalculation } = useCalculatorState();
	const { calculationMode } = useConfigurationState();
	const [summaryExpanded, setSummaryExpanded] = useState(false);

	const closestApproach =
		calculationMode !== "Vector3D" &&
		planeInterceptY &&
		destY &&
		pearlTraceData
			? (() => {
					const targetX = Number(destX);
					const targetY = Number(destY);
					const targetZ = Number(destZ);
					if ([targetX, targetY, targetZ].some(Number.isNaN)) {
						return pearlTraceData.closest_approach;
					}

					let best = null;
					for (let i = 1; i < pearlTraceData.pearl_trace.length; i++) {
						const prev = pearlTraceData.pearl_trace[i - 1];
						const curr = pearlTraceData.pearl_trace[i];
						const prevDelta = prev.Y - targetY;
						const currDelta = curr.Y - targetY;
						if (prevDelta === 0 || currDelta === 0 || prevDelta * currDelta < 0) {
							const ratio =
								curr.Y === prev.Y ? 0 : (targetY - prev.Y) / (curr.Y - prev.Y);
							const point = {
								X: prev.X + (curr.X - prev.X) * ratio,
								Y: targetY,
								Z: prev.Z + (curr.Z - prev.Z) * ratio,
							};
							const distance = Math.hypot(point.X - targetX, point.Z - targetZ);
							if (!best || distance < best.distance) {
								best = { tick: i, point, distance };
							}
						}
					}
					return best ?? pearlTraceData.closest_approach;
				})()
			: pearlTraceData?.closest_approach;

	const handleJumpToTick = () => {
		if (closestApproach && traceDataPanelRef.current) {
			traceDataPanelRef.current.scrollToRow(closestApproach.tick);
		}
	};

	if (!pearlTraceData) {
		return null;
	}

	const SummaryCard = ({ className }: { className?: string }) => (
		<Card className={className}>
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
						<span>{t("calculator.trace_x", { value: destX || "N/A" })}</span>
						<span>{t("calculator.trace_z", { value: destZ || "N/A" })}</span>
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
				{calculationMode === "Vector3D" && traceTNT?.vertical !== undefined && (
					<div className="flex flex-col gap-1">
						<span className="text-muted-foreground">
							{t("calculator.trace_vertical_tnt")}
						</span>
						<span className="font-medium">{traceTNT.vertical}</span>
					</div>
				)}
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
										onClick={() => {
											setSummaryExpanded(false);
											handleJumpToTick();
										}}
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
	);

	return (
		<div className="h-full w-full bg-background relative">
			<div className="flex h-full w-full flex-col md:flex-row p-4 md:p-6 gap-4">
				<div className="hidden md:block w-[40%] h-full">
					<SummaryCard className="h-full flex flex-col" />
				</div>
				<div className="flex-1 h-full overflow-hidden flex flex-col gap-2">
					<TraceDataPanel ref={traceDataPanelRef} data={pearlTraceData} />
				</div>
			</div>
			<Button
				variant="secondary"
				size="sm"
				className="md:hidden absolute top-2 right-2 z-20 shadow-md"
				onClick={() => setSummaryExpanded(!summaryExpanded)}
			>
				<Info className="h-4 w-4 mr-1" />
				{summaryExpanded ? (
					<ChevronUp className="h-4 w-4" />
				) : (
					<ChevronDown className="h-4 w-4" />
				)}
			</Button>
			<AnimatePresence>
				{summaryExpanded && (
					<motion.div
						initial={{ opacity: 0, y: -20 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -20 }}
						transition={{ duration: 0.2 }}
						className="md:hidden absolute top-14 left-2 right-2 z-10 max-h-[calc(100%-60px)] overflow-auto rounded-lg"
					>
						<SummaryCard className="shadow-xl border" />
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
