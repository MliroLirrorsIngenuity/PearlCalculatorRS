"use client";
import { useTranslation } from "react-i18next";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export type CalculationResult = {
	id: string;
	distance: number;
	ticks: number;
	blue: number;
	red: number;
	total: number;
	direction: string;
};
export const columns: ColumnDef<CalculationResult>[] = [
	{
		accessorKey: "distance",
		header: ({ column }) => {
			const { t } = useTranslation();
			return (
				<div className="flex justify-center">
					<Button
						variant="ghost"
						onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
						className="font-bold hover:bg-accent"
					>
						{t("calculator.header_distance")}
					</Button>
				</div>
			);
		},
		cell: ({ row }) => {
			const amount = parseFloat(row.getValue("distance"));
			const formatted = amount.toFixed(15);
			return <div className="text-left font-medium">{formatted}</div>;
		},
		enableResizing: false,
	},
	{
		accessorKey: "ticks",
		header: ({ column }) => {
			const { t } = useTranslation();
			return (
				<div className="flex justify-center">
					<Button
						variant="ghost"
						onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
						className="font-bold hover:bg-accent"
					>
						{t("calculator.header_ticks")}
					</Button>
				</div>
			);
		},
		cell: ({ row }) => {
			return (
				<div className="text-left font-medium">{row.getValue("ticks")}</div>
			);
		},
		enableResizing: false,
	},
	{
		accessorKey: "blue",
		header: ({ column }) => {
			const { t } = useTranslation();
			return (
				<div className="flex justify-center">
					<Button
						variant="ghost"
						onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
						className="font-bold hover:bg-accent"
					>
						{t("calculator.header_blue")}
					</Button>
				</div>
			);
		},
		cell: ({ row }) => {
			return (
				<div className="text-left font-medium">{row.getValue("blue")}</div>
			);
		},
		enableResizing: false,
	},
	{
		accessorKey: "red",
		header: ({ column }) => {
			const { t } = useTranslation();
			return (
				<div className="flex justify-center">
					<Button
						variant="ghost"
						onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
						className="font-bold hover:bg-accent"
					>
						{t("calculator.header_red")}
					</Button>
				</div>
			);
		},
		cell: ({ row }) => {
			return <div className="text-left font-medium">{row.getValue("red")}</div>;
		},
		enableResizing: false,
	},
	{
		accessorKey: "total",
		header: ({ column }) => {
			const { t } = useTranslation();
			return (
				<div className="flex justify-center">
					<Button
						variant="ghost"
						onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
						className="font-bold hover:bg-accent"
					>
						{t("calculator.header_total")}
					</Button>
				</div>
			);
		},
		cell: ({ row }) => {
			return (
				<div className="text-left font-medium">{row.getValue("total")}</div>
			);
		},
		enableResizing: false,
	},
	{
		id: "actions",
		header: () => null,
		meta: {
			className: "w-[50px]",
		},
		cell: ({ row, table }) => {
			const { t } = useTranslation();
			const meta = table.options.meta as {
				onTrace: (red: number, blue: number, direction: string) => void;
			};
			const red = row.getValue("red") as number;
			const blue = row.getValue("blue") as number;
			const direction = row.original.direction;

			return (
				<div className="flex justify-center">
					<Button
						variant="ghost"
						size="icon"
						className="h-6 w-6"
						onClick={() => meta?.onTrace(red, blue, direction)}
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
