"use client";
import type { Column, ColumnDef } from "@tanstack/react-table";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/plugins/fields";
import type { Column as PluginColumn } from "@/plugins/localize";

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
		<button
			type="button"
			onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
			className="w-full truncate text-center font-semibold hover:text-foreground/70"
		>
			{/* @ts-expect-error - labelKey comes from known translation keys */}
			{t(labelKey, fallback)}
		</button>
	);
}

function SimpleCell({
	value,
	className,
}: {
	value: React.ReactNode;
	className?: string;
}) {
	return (
		<div
			className={cn("truncate text-center font-medium tabular-nums", className)}
		>
			{value}
		</div>
	);
}

type ColumnConfig = {
	accessorKey: keyof CalculationResult;
	labelKey: string;
	fallback?: string;
	cellRenderer?: (value: unknown) => React.ReactNode;
	cellClassName?: string;
};

function createColumn(config: ColumnConfig): ColumnDef<CalculationResult> {
	const { accessorKey, labelKey, fallback, cellRenderer, cellClassName } =
		config;
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
			return <SimpleCell value={displayValue} className={cellClassName} />;
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
		cellClassName: "text-blue-600 dark:text-blue-400",
	}),
	createColumn({
		accessorKey: "red",
		labelKey: "calculator.header_red",
		cellClassName: "text-red-600 dark:text-red-400",
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
		cell: () => (
			<div className="flex justify-center">
				<ArrowRight
					aria-hidden="true"
					className="size-3.5 text-muted-foreground transition-transform group-hover/row:translate-x-0.5 group-hover/row:text-foreground"
				/>
			</div>
		),
		enableResizing: false,
	},
];

export const BUILTIN_RESULT_KEYS = [
	"distance",
	"ticks",
	"blue",
	"red",
	"vertical",
	"total",
];

const BUILTIN_CELL_CLASS: Record<string, string> = {
	blue: "text-blue-600 dark:text-blue-400",
	red: "text-red-600 dark:text-red-400",
};

export function pluginResultColumn(
	column: PluginColumn,
	id = `plugin:${column.key}`,
): ColumnDef<CalculationResult> {
	return {
		id,
		accessorFn: (row) => (row as Record<string, unknown>)[column.key],
		header: ({ column: tableColumn }) => (
			<button
				type="button"
				onClick={() =>
					tableColumn.toggleSorting(tableColumn.getIsSorted() === "asc")
				}
				className="w-full truncate text-center font-semibold hover:text-foreground/70"
			>
				{column.label}
			</button>
		),
		cell: ({ row }) => {
			const value = (row.original as Record<string, unknown>)[column.key];
			return (
				<SimpleCell
					className={BUILTIN_CELL_CLASS[id]}
					value={
						typeof value === "number"
							? formatNumber(column, value)
							: value === undefined || value === null
								? "—"
								: String(value)
					}
				/>
			);
		},
		enableResizing: false,
	};
}

export function withPluginColumns(
	sizing: Record<string, number>,
	pluginColumns: PluginColumn[],
) {
	const extra = pluginColumns.map((column) => column.width ?? 10);
	const total =
		Object.values(sizing).reduce((sum, value) => sum + value, 0) +
		extra.reduce((sum, value) => sum + value, 0);
	return Object.fromEntries([
		...Object.entries(sizing).map(([key, value]) => [
			key,
			(value / total) * 100,
		]),
		...pluginColumns.map((column, index) => [
			`plugin:${column.key}`,
			(extra[index] / total) * 100,
		]),
	]);
}
