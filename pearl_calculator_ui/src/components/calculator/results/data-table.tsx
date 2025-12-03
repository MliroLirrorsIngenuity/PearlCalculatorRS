"use client";

import {
	type ColumnDef,
	type ColumnSizingState,
	flexRender,
	getCoreRowModel,
	getSortedRowModel,
	type Row,
	type SortingState,
	useReactTable,
} from "@tanstack/react-table";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

interface DataTableProps<TData, TValue> {
	columns: ColumnDef<TData, TValue>[];
	data: TData[];
	defaultColumnSizing?: Record<string, number>;
	minColumnSizes?: Record<string, number>;
	onTrace?: (red: number, blue: number, direction: string) => void;
}

const DEFAULT_COLUMN_SIZES: Record<string, number> = {
	distance: 30,
	ticks: 15,
	blue: 15,
	red: 15,
	total: 15,
	actions: 10,
};

const MIN_COLUMN_SIZES: Record<string, number> = {
	distance: 15,
	ticks: 5,
	blue: 5,
	red: 5,
	total: 5,
	actions: 10,
};

const DataTableRow = React.memo(
	({ row }: { row: Row<any> }) => {
		return (
			<TableRow
				data-state={row.getIsSelected() && "selected"}
				className="[&>td]:border-r last:border-r-0 odd:bg-muted/50 *:whitespace-nowrap h-[25px]"
				style={{
					contain: "layout style paint",
				}}
			>
				{row.getVisibleCells().map((cell) => (
					<TableCell key={cell.id} className="py-1">
						{flexRender(cell.column.columnDef.cell, cell.getContext())}
					</TableCell>
				))}
			</TableRow>
		);
	},
	(prev, next) => prev.row.original === next.row.original,
);

export function DataTable<TData, TValue>({
	columns,
	data,
	defaultColumnSizing = DEFAULT_COLUMN_SIZES,
	minColumnSizes = MIN_COLUMN_SIZES,
	onTrace,
}: DataTableProps<TData, TValue>) {
	const { t } = useTranslation();
	const [sorting, setSorting] = React.useState<SortingState>([
		{
			id: "distance",
			desc: false,
		},
	]);
	const [columnSizing, setColumnSizing] =
		React.useState<ColumnSizingState>(defaultColumnSizing);
	const tableRef = React.useRef<HTMLTableElement>(null);
	const viewportRef = React.useRef<HTMLDivElement>(null);
	const [scrollTop, setScrollTop] = React.useState(0);
	const [viewportHeight, setViewportHeight] = React.useState(600);
	const scrollRequestRef = React.useRef<number | null>(null);

	const ROW_HEIGHT = 25;
	const BUFFER_ROWS = 5;

	React.useEffect(() => {
		if (viewportRef.current) {
			viewportRef.current.scrollTop = 0;
			setScrollTop(0);
		}
	}, []);

	React.useLayoutEffect(() => {
		if (viewportRef.current) {
			setViewportHeight(viewportRef.current.clientHeight);

			const observer = new ResizeObserver((entries) => {
				for (const entry of entries) {
					setViewportHeight(entry.contentRect.height);
				}
			});
			observer.observe(viewportRef.current);
			return () => observer.disconnect();
		}
	}, []);

	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		onSortingChange: setSorting,
		getSortedRowModel: getSortedRowModel(),
		columnResizeMode: "onChange",
		enableColumnResizing: true,
		onColumnSizingChange: setColumnSizing,
		state: {
			sorting,
			columnSizing,
		},
		meta: {
			onTrace,
		},
	});

	const rows = table.getRowModel().rows;
	const totalRows = rows.length;

	let startIndex = Math.floor(scrollTop / ROW_HEIGHT) - BUFFER_ROWS;
	startIndex = Math.max(0, startIndex);

	const visibleRowCount =
		Math.ceil(viewportHeight / ROW_HEIGHT) + 2 * BUFFER_ROWS;

	let endIndex = startIndex + visibleRowCount;
	endIndex = Math.min(totalRows, endIndex);

	const paddingTop = startIndex * ROW_HEIGHT;
	const paddingBottom = Math.max(0, (totalRows - endIndex) * ROW_HEIGHT);

	const visibleRows = React.useMemo(() => {
		return rows.slice(startIndex, endIndex);
	}, [rows, startIndex, endIndex]);

	const handleScroll = React.useCallback(
		(event: React.UIEvent<HTMLDivElement>) => {
			const currentScrollTop = event.currentTarget.scrollTop;

			if (scrollRequestRef.current !== null) {
				cancelAnimationFrame(scrollRequestRef.current);
			}

			scrollRequestRef.current = requestAnimationFrame(() => {
				setScrollTop(currentScrollTop);
				scrollRequestRef.current = null;
			});
		},
		[],
	);

	const handleResize = React.useCallback(
		(columnId: string, nextColumnId: string | undefined) => {
			return (e: React.MouseEvent | React.TouchEvent) => {
				const startX = "touches" in e ? e.touches[0].clientX : e.clientX;
				const startSizes = { ...columnSizing };
				const tableWidth = tableRef.current?.offsetWidth || 1000;

				const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
					const currentX =
						"touches" in moveEvent
							? moveEvent.touches[0].clientX
							: moveEvent.clientX;
					const delta = currentX - startX;
					const deltaPercent = (delta / tableWidth) * 100;

					if (!nextColumnId) return;

					const currentStartSize =
						startSizes[columnId] || defaultColumnSizing[columnId];
					const nextStartSize =
						startSizes[nextColumnId] || defaultColumnSizing[nextColumnId];

					let newCurrentSize = currentStartSize + deltaPercent;
					let newNextSize = nextStartSize - deltaPercent;

					if (newCurrentSize < (minColumnSizes[columnId] || 8)) {
						newCurrentSize = minColumnSizes[columnId] || 8;
						newNextSize = nextStartSize + (currentStartSize - newCurrentSize);
					}

					if (newNextSize < (minColumnSizes[nextColumnId] || 8)) {
						newNextSize = minColumnSizes[nextColumnId] || 8;
						newCurrentSize = currentStartSize + (nextStartSize - newNextSize);
					}

					setColumnSizing((prev) => ({
						...prev,
						[columnId]: newCurrentSize,
						[nextColumnId]: newNextSize,
					}));
				};

				const handleUp = () => {
					document.removeEventListener("mousemove", handleMove);
					document.removeEventListener("mouseup", handleUp);
					document.removeEventListener("touchmove", handleMove);
					document.removeEventListener("touchend", handleUp);
				};

				document.addEventListener("mousemove", handleMove);
				document.addEventListener("mouseup", handleUp);
				document.addEventListener("touchmove", handleMove);
				document.addEventListener("touchend", handleUp);
			};
		},
		[columnSizing, defaultColumnSizing, minColumnSizes],
	);

	return (
		<ScrollArea
			className="w-full h-full border rounded-md"
			viewportRef={viewportRef}
			onScroll={handleScroll}
		>
			<table
				ref={tableRef}
				className="w-full caption-bottom text-sm text-left table-fixed"
				style={{
					contentVisibility: "auto",
				}}
			>
				<colgroup>
					{table.getAllLeafColumns().map((column) => {
						const size =
							columnSizing[column.id] || defaultColumnSizing[column.id];
						return <col key={column.id} style={{ width: `${size}%` }} />;
					})}
				</colgroup>
				<TableHeader>
					{table.getHeaderGroups().map((headerGroup) => (
						<TableRow
							key={headerGroup.id}
							className="[&>th]:border-r last:border-r-0 *:whitespace-nowrap sticky top-0 bg-background z-10 shadow-sm after:content-[''] after:inset-x-0 after:h-px after:bg-border after:absolute after:bottom-0"
						>
							{headerGroup.headers.map((header, index) => {
								const nextHeader = headerGroup.headers[index + 1];
								const isLastColumn = index === headerGroup.headers.length - 1;

								return (
									<TableHead
										key={header.id}
										className="relative group/head select-none"
									>
										{header.isPlaceholder
											? null
											: flexRender(
												header.column.columnDef.header,
												header.getContext(),
											)}
										{!isLastColumn && (
											<div
												onMouseDown={handleResize(
													header.column.id,
													nextHeader?.column.id,
												)}
												onTouchStart={handleResize(
													header.column.id,
													nextHeader?.column.id,
												)}
												onDoubleClick={() => {
													setColumnSizing((prev) => ({
														...prev,
														[header.column.id]:
															defaultColumnSizing[header.column.id],
													}));
												}}
												className="absolute top-0 right-0 h-full w-4 cursor-col-resize touch-none -mr-2 z-20 flex justify-center before:absolute before:w-px before:inset-y-0 before:bg-border before:translate-x-px hover:before:bg-foreground/60 transition-all"
											/>
										)}
									</TableHead>
								);
							})}
						</TableRow>
					))}
				</TableHeader>
				<TableBody className="overflow-hidden">
					{paddingTop > 0 && (
						<tr>
							<td
								style={{ height: `${paddingTop}px` }}
								colSpan={columns.length}
							/>
						</tr>
					)}
					{visibleRows.length ? (
						visibleRows.map((row) => <DataTableRow key={row.id} row={row} />)
					) : (
						<TableRow>
							<TableCell colSpan={columns.length} className="h-24 text-center">
								{t("calculator.no_results_table")}
							</TableCell>
						</TableRow>
					)}
					{paddingBottom > 0 && (
						<tr>
							<td
								style={{ height: `${paddingBottom}px` }}
								colSpan={columns.length}
							/>
						</tr>
					)}
				</TableBody>
			</table>
		</ScrollArea>
	);
}

export default React.memo(DataTable, (prevProps, nextProps) => {
	return (
		prevProps.data === nextProps.data && prevProps.columns === nextProps.columns
	);
});
