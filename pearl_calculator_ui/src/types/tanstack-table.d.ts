import "@tanstack/react-table";
declare module "@tanstack/react-table" {
	interface ColumnMeta<_TData extends RowData, _TValue> {
		className?: string;
	}
}
