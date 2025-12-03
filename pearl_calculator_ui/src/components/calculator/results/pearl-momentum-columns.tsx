"use client";
import { useTranslation } from "react-i18next";

import type { ColumnDef } from "@tanstack/react-table";

export type PearlMomentumPoint = {
	id: string;
	tick: number;
	vx: number;
	vy: number;
	vz: number;
};

export const pearlMomentumColumns: ColumnDef<PearlMomentumPoint>[] = [
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
		accessorKey: "vx",
		header: () => {
			const { t } = useTranslation();
			return <div className="flex justify-center font-bold">{t("calculator.header_vx")}</div>;
		},
		cell: ({ row }) => {
			const amount = parseFloat(row.getValue("vx"));
			const formatted = amount.toFixed(10);
			return <div className="text-left font-medium">{formatted}</div>;
		},
	},
	{
		accessorKey: "vy",
		header: () => {
			const { t } = useTranslation();
			return <div className="flex justify-center font-bold">{t("calculator.header_vy")}</div>;
		},
		cell: ({ row }) => {
			const amount = parseFloat(row.getValue("vy"));
			const formatted = amount.toFixed(10);
			return <div className="text-left font-medium">{formatted}</div>;
		},
	},
	{
		accessorKey: "vz",
		header: () => {
			const { t } = useTranslation();
			return <div className="flex justify-center font-bold">{t("calculator.header_vz")}</div>;
		},
		cell: ({ row }) => {
			const amount = parseFloat(row.getValue("vz"));
			const formatted = amount.toFixed(10);
			return <div className="text-left font-medium">{formatted}</div>;
		},
	},
];
