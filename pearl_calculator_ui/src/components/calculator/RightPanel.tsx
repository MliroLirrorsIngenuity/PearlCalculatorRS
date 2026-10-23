import { Crosshair, FilterX } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FilterPopover } from "@/components/calculator/FilterPopover";
import { TrajectoryPreview } from "@/components/calculator/TrajectoryPreview";
import { EmptyState } from "@/components/common/EmptyState";
import { useCalculatorState } from "@/context/CalculatorStateContext";
import { useConfigurationState } from "@/context/ConfigurationStateContext";
import { useDirectionLabel } from "@/hooks/use-direction-label";
import { useElementSize } from "@/hooks/use-element-size";
import type { CalculatorInputs, TNTResult } from "@/types/domain";
import { type CalculationResult, columns } from "./results/columns";
import { DataTable } from "./results/data-table";

const PREVIEW_OTHERS = 12;
const PREVIEW_MIN_PANEL_HEIGHT = 480;
const PREVIEW_DELAY = 80;

interface RightPanelProps {
	results: TNTResult[];
	inputs: CalculatorInputs;
	onTrace?: (
		red: number,
		blue: number,
		direction: string,
		vertical?: number,
	) => void;
}

const COLUMN_SIZING: Record<string, Record<string, number>> = {
	Vector3D: {
		distance: 30,
		ticks: 10,
		blue: 10,
		red: 10,
		vertical: 15,
		total: 15,
		actions: 10,
	},
	Standard: {
		distance: 30,
		ticks: 15,
		blue: 15,
		red: 15,
		total: 15,
		actions: 10,
	},
};

export default function RightPanel({
	results,
	inputs,
	onTrace,
}: RightPanelProps) {
	const { t } = useTranslation();
	const { getCardinalLabel } = useDirectionLabel();
	const { calculationMode } = useConfigurationState();
	const { updateDefaultInput } = useCalculatorState();
	const [tickMin, tickMax] = inputs.tickRange;
	const [distanceMin, distanceMax] = inputs.distanceRange;
	const [hoveredId, setHoveredId] = useState<string | null>(null);
	const [hoverPreviewId, setHoverPreviewId] = useState<string | null>(null);
	const { ref: panelRef, height: panelHeight } =
		useElementSize<HTMLDivElement>();

	const filteredResults = useMemo(
		() =>
			results.filter(
				(r) =>
					r.tick >= tickMin &&
					r.tick <= tickMax &&
					r.distance >= distanceMin &&
					r.distance <= distanceMax,
			),
		[results, tickMin, tickMax, distanceMin, distanceMax],
	);

	const [selectionSource, setSelectionSource] = useState(filteredResults);
	if (selectionSource !== filteredResults) {
		setSelectionSource(filteredResults);
		setHoveredId(null);
		setHoverPreviewId(null);
	}

	const tableData: CalculationResult[] = useMemo(
		() =>
			filteredResults.map((result, index) => ({
				id: index.toString(),
				distance: result.distance,
				ticks: result.tick,
				blue: result.blue,
				red: result.red,
				total: result.total,
				vertical: result.vertical,
				charges: result.charges,
				direction: result.direction,
			})),
		[filteredResults],
	);

	const byAccuracy = useMemo(
		() =>
			filteredResults
				.map((result, index) => ({ result, id: index.toString() }))
				.sort((a, b) => a.result.distance - b.result.distance),
		[filteredResults],
	);

	const activeId = hoveredId ?? byAccuracy[0]?.id;
	useEffect(() => {
		const timer = setTimeout(() => setHoverPreviewId(hoveredId), PREVIEW_DELAY);
		return () => clearTimeout(timer);
	}, [hoveredId]);
	const previewId = hoverPreviewId ?? byAccuracy[0]?.id;
	const active = previewId
		? (filteredResults[Number(previewId)] ?? null)
		: null;

	const handleRowHover = useCallback(
		(row: CalculationResult | null) => setHoveredId(row?.id ?? null),
		[],
	);
	const handleRowOpen = useCallback(
		(row: CalculationResult) =>
			onTrace?.(row.red, row.blue, row.direction, row.vertical),
		[onTrace],
	);
	const others = useMemo(
		() => byAccuracy.slice(0, PREVIEW_OTHERS).map((x) => x.result),
		[byAccuracy],
	);

	const activeColumns = useMemo(
		() =>
			columns.filter((col) => {
				if (!("accessorKey" in col)) return true;
				if (col.accessorKey === "vertical")
					return calculationMode === "Vector3D";
				return col.accessorKey !== "charges";
			}),
		[calculationMode],
	);

	const direction = filteredResults[0]?.direction;

	return (
		<div
			ref={panelRef}
			className="flex h-full w-full flex-col gap-2 pt-2 pr-4 pb-2 pl-1"
		>
			<div className="flex h-9 shrink-0 items-center gap-2.5 rounded-lg border pr-1.5 pl-3 text-sm">
				<span className="flex items-baseline gap-1">
					<b className="text-[17px] font-semibold tracking-tight tabular-nums">
						{filteredResults.length}
					</b>
					<span className="text-[13px] text-muted-foreground">
						{t("calculator.results_unit")}
					</span>
				</span>
				{direction && (
					<>
						<span className="h-3.5 w-px bg-border" />
						<span className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
							{t("calculator.direction_label")}
							<span className="flex h-5 items-center rounded-full bg-primary px-2 text-xs font-medium text-primary-foreground">
								{getCardinalLabel(direction)}
							</span>
						</span>
					</>
				)}
				<div className="flex-1" />
				<FilterPopover inputs={inputs} onInputChange={updateDefaultInput} />
			</div>
			{filteredResults.length === 0 ? (
				results.length === 0 ? (
					<EmptyState
						className="min-h-0 flex-1"
						icon={<Crosshair />}
						title={t("calculator.empty_title")}
						hint={t("calculator.empty_hint")}
					/>
				) : (
					<EmptyState
						className="min-h-0 flex-1"
						icon={<FilterX />}
						title={t("calculator.filtered_title")}
						hint={t("calculator.filtered_hint", { count: results.length })}
					/>
				)
			) : (
				<>
					{panelHeight >= PREVIEW_MIN_PANEL_HEIGHT && (
						<TrajectoryPreview
							inputs={inputs}
							active={active}
							others={others}
						/>
					)}
					<div className="min-h-0 flex-1">
						<DataTable
							key={calculationMode}
							columns={activeColumns}
							data={tableData}
							defaultColumnSizing={
								COLUMN_SIZING[calculationMode] ?? COLUMN_SIZING.Standard
							}
							activeRowId={activeId}
							onRowHover={handleRowHover}
							onRowOpen={handleRowOpen}
						/>
					</div>
				</>
			)}
		</div>
	);
}
