"use client";
import type { Column, ColumnDef } from "@tanstack/react-table";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

export type CalculationResult = {
	id: string;
	distance: number;
	ticks: number;
	blue: number;
	red: number;
	total: number;
	direction: string;
	vertical?: number;
	warmup?: number;
	charges?: number;
};

function SortableHeader<T>({
	column,
	labelKey,
	fallback,
}: {
	column: Column<T>;
	labelKey: string;
	fallback?: string;
}) {
	const { t } = useTranslation();
	return (
		<div className="flex justify-center">
			<Button
				variant="ghost"
				onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				className="font-bold hover:bg-accent"
			>
				{/* @ts-expect-error - labelKey comes from known translation keys */}
				{t(labelKey, fallback)}
			</Button>
		</div>
	);
}

function SimpleCell({ value }: { value: React.ReactNode }) {
	return <div className="text-left font-medium">{value}</div>;
}

type ColumnConfig = {
	accessorKey: keyof CalculationResult;
	labelKey: string;
	fallback?: string;
	cellRenderer?: (value: unknown) => React.ReactNode;
};

function createColumn(config: ColumnConfig): ColumnDef<CalculationResult> {
	const { accessorKey, labelKey, fallback, cellRenderer } = config;
	return {
		accessorKey,
		header: ({ column }) => (
			<SortableHeader column={column} labelKey={labelKey} fallback={fallback} />
		),
		cell: ({ row }) => {
			const value = row.getValue(accessorKey);
			const displayValue = cellRenderer
				? cellRenderer(value)
				: (value as React.ReactNode);
			return <SimpleCell value={displayValue} />;
		},
		enableResizing: false,
	};
}

export const columns: ColumnDef<CalculationResult>[] = [
	createColumn({
		accessorKey: "distance",
		labelKey: "calculator.header_distance",
		cellRenderer: (v) => (parseFloat(v as string) || 0).toFixed(15),
	}),
	createColumn({
		accessorKey: "ticks",
		labelKey: "calculator.header_ticks",
	}),
	createColumn({
		accessorKey: "blue",
		labelKey: "calculator.header_blue",
	}),
	createColumn({
		accessorKey: "red",
		labelKey: "calculator.header_red",
	}),
	createColumn({
		accessorKey: "vertical",
		labelKey: "calculator.header_vertical",
		fallback: "Vertical",
		cellRenderer: (v) => (v as number | undefined) ?? 0,
	}),
	createColumn({
		accessorKey: "charges",
		labelKey: "calculator.header_charges",
		fallback: "Charges",
		cellRenderer: (v) => (v as number | undefined) ?? 0,
	}),
	createColumn({
		accessorKey: "total",
		labelKey: "calculator.header_total",
	}),
	{
		id: "actions",
		header: () => null,
		meta: {
			className: "w-[50px]",
		},
		cell: ({ row, table }) => {
			const { t } = useTranslation();
			const meta = table.options.meta as {
				onTrace: (
					red: number,
					blue: number,
					direction: string,
					vertical?: number,
				) => void;
			};
			const red = row.getValue("red") as number;
			const blue = row.getValue("blue") as number;
			const direction = row.original.direction;
			const vertical = row.original.vertical;

			return (
				<div className="flex justify-center">
					<Button
						variant="ghost"
						size="icon"
						className="h-6 w-6"
						onClick={() => meta?.onTrace(red, blue, direction, vertical)}
					>
						<ArrowRight className="h-3.5 w-3.5" />
						<span className="sr-only">{t("calculator.sr_view_trace")}</span>
					</Button>
				</div>
			);
		},
		enableResizing: false,
	},
];
