"use client";
import { useTranslation } from "react-i18next";

import type { ColumnDef } from "@tanstack/react-table";

export type PearlTracePoint = {
	id: string;
	tick: number;
	x: number;
	y: number;
	z: number;
};

export const pearlTraceColumns: ColumnDef<PearlTracePoint>[] = [
	{
		accessorKey: "tick",
		header: () => {
			const { t } = useTranslation();
			return <div className="flex justify-center font-bold">{t("calculator.header_tick")}</div>;
		},
		cell: ({ row }) => {
			return (
				<div className="text-left font-medium">{row.getValue("tick")}</div>
			);
		},
	},
	{
		accessorKey: "x",
		header: () => {
			const { t } = useTranslation();
			return <div className="flex justify-center font-bold">{t("calculator.header_x")}</div>;
		},
		cell: ({ row }) => {
			const amount = parseFloat(row.getValue("x"));
			const formatted = amount.toFixed(10);
			return <div className="text-left font-medium">{formatted}</div>;
		},
	},
	{
		accessorKey: "y",
		header: () => {
			const { t } = useTranslation();
			return <div className="flex justify-center font-bold">{t("calculator.header_y")}</div>;
		},
		cell: ({ row }) => {
			const amount = parseFloat(row.getValue("y"));
			const formatted = amount.toFixed(10);
			return <div className="text-left font-medium">{formatted}</div>;
		},
	},
	{
		accessorKey: "z",
		header: () => {
			const { t } = useTranslation();
			return <div className="flex justify-center font-bold">{t("calculator.header_z")}</div>;
		},
		cell: ({ row }) => {
			const amount = parseFloat(row.getValue("z"));
			const formatted = amount.toFixed(10);
			return <div className="text-left font-medium">{formatted}</div>;
		},
	},
];
