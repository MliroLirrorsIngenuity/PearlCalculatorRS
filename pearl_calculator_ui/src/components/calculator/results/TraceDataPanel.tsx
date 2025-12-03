import { useTranslation } from "react-i18next";
import { useMemo } from "react";
import { DataTable } from "@/components/calculator/results/data-table";
import {
	type PearlMomentumPoint,
	pearlMomentumColumns,
} from "@/components/calculator/results/pearl-momentum-columns";
import {
	type PearlTracePoint,
	pearlTraceColumns,
} from "@/components/calculator/results/pearl-trace-columns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PearlTraceResult } from "@/types/domain";

interface TraceDataPanelProps {
	data: PearlTraceResult | null;
}

export default function TraceDataPanel({ data }: TraceDataPanelProps) {
	const { t } = useTranslation();
	const tableData: PearlTracePoint[] = useMemo(() => {
		if (!data) return [];

		return data.pearl_trace.map((point, index) => ({
			id: index.toString(),
			tick: index,
			x: point.X,
			y: point.Y,
			z: point.Z,
		}));
	}, [data]);

	const momentumData: PearlMomentumPoint[] = useMemo(() => {
		if (!data || !data.pearl_motion_trace) return [];

		return data.pearl_motion_trace.map((point, index) => ({
			id: index.toString(),
			tick: index,
			vx: point.X,
			vy: point.Y,
			vz: point.Z,
		}));
	}, [data]);

	return (
		<Tabs defaultValue="trajectory" className="flex-1 flex flex-col min-h-0">
			<div className="flex items-center justify-between">
				<TabsList className="grid w-full grid-cols-2 h-9">
					<TabsTrigger value="trajectory">{t("calculator.tab_trajectory")}</TabsTrigger>
					<TabsTrigger value="momentum">{t("calculator.tab_momentum")}</TabsTrigger>
				</TabsList>
			</div>

			<TabsContent
				value="trajectory"
				className="flex-1 overflow-hidden min-h-0 mt-2"
			>
				<DataTable
					columns={pearlTraceColumns}
					data={tableData}
					defaultColumnSizing={{
						tick: 10,
						x: 30,
						y: 30,
						z: 30,
					}}
					minColumnSizes={{
						tick: 10,
						x: 10,
						y: 10,
						z: 10,
					}}
				/>
			</TabsContent>

			<TabsContent
				value="momentum"
				className="flex-1 overflow-hidden min-h-0 mt-2"
			>
				<DataTable
					columns={pearlMomentumColumns}
					data={momentumData}
					defaultColumnSizing={{
						tick: 10,
						vx: 30,
						vy: 30,
						vz: 30,
					}}
					minColumnSizes={{
						tick: 10,
						vx: 10,
						vy: 10,
						vz: 10,
					}}
				/>
			</TabsContent>
		</Tabs>
	);
}
