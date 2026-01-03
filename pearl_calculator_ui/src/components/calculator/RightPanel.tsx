import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { useConfigurationState } from "@/context/ConfigurationStateContext";
import { useDirectionLabel } from "@/hooks/use-direction-label";
import type { TNTResult } from "@/types/domain";
import { type CalculationResult, columns } from "./results/columns";
import { DataTable } from "./results/data-table";

interface RightPanelProps {
	results: TNTResult[];
	tickRange?: number[];
	distanceRange?: number[];
	onTrace?: (
		red: number,
		blue: number,
		direction: string,
		vertical?: number,
	) => void;
}

export default function RightPanel({
	results,
	tickRange = [0, 10000],
	distanceRange = [0, 1000],
	onTrace,
}: RightPanelProps) {
	const { t } = useTranslation();
	const { getCardinalLabel } = useDirectionLabel();
	const filteredResults = useMemo(() => {
		return results.filter(
			(result) =>
				result.tick >= tickRange[0] &&
				result.tick <= tickRange[1] &&
				result.distance >= distanceRange[0] &&
				result.distance <= distanceRange[1],
		);
	}, [results, tickRange, distanceRange]);

	const tableData: CalculationResult[] = useMemo(() => {
		return filteredResults.map((result, index) => ({
			id: index.toString(),
			distance: result.distance,
			ticks: result.tick,
			blue: result.blue,
			red: result.red,
			total: result.total,
			vertical: result.vertical,
			charges: result.charges,
			direction: result.direction,
		}));
	}, [filteredResults]);

	const foundSolutions = filteredResults.length;
	const direction =
		filteredResults.length > 0 ? filteredResults[0].direction : "N/A";

	const { calculationMode } = useConfigurationState();

	const columnSizing = useMemo(() => {
		const sizingMap: Record<string, Record<string, number>> = {
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
		return sizingMap[calculationMode] || sizingMap.Standard;
	}, [calculationMode]);

	const activeColumns = useMemo(() => {
		return columns.filter((col) => {
			if ("accessorKey" in col) {
				if (col.accessorKey === "vertical")
					return calculationMode === "Vector3D";
				if (col.accessorKey === "charges") return false;
			}
			return true;
		});
	}, [calculationMode]);

	return (
		<div className="flex h-full w-full flex-col pt-2 pl-1 pr-4 pb-2 gap-2">
			<Badge
				variant="outline"
				className="w-full justify-between text-sm font-normal h-9 px-3"
			>
				{foundSolutions > 0 ? (
					<>
						<div>
							{t("calculator.found_solutions", { count: foundSolutions })}
						</div>
						<div className="flex items-center gap-2">
							{t("calculator.label_direction")}
							<Badge className="rounded-full px-2 py-0 h-5">
								{getCardinalLabel(direction)}
							</Badge>
						</div>
					</>
				) : (
					t("calculator.no_result")
				)}
			</Badge>
			<div className="flex-1 min-h-0">
				<DataTable
					key={calculationMode}
					columns={activeColumns}
					data={tableData}
					onTrace={onTrace}
					defaultColumnSizing={columnSizing}
				/>
			</div>
		</div>
	);
}
