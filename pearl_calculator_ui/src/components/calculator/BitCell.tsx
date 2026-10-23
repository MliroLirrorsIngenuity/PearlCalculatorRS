import type { ThemeColor } from "@/lib/bit-layout-utils";

interface BitCellProps {
	value: string;
	isActive: boolean;
	theme: ThemeColor;
	elevated?: boolean;
}

export function BitCell({
	value,
	isActive,
	theme,
	elevated = false,
}: BitCellProps) {
	const activeClass =
		theme === "blue"
			? "bg-blue-600 border-blue-600 shadow-sm shadow-blue-600/30 text-white font-semibold scale-110 z-10 dark:bg-blue-500 dark:border-blue-500"
			: "bg-red-600 border-red-600 shadow-sm shadow-red-600/30 text-white font-semibold scale-110 z-10 dark:bg-red-500 dark:border-red-500";

	const inactiveClass =
		"bg-muted/40 border-border border-dashed text-muted-foreground/60";
	const elevatedClass = elevated ? "-translate-y-0.5" : "";

	return (
		<div
			className={`w-12 h-8 flex items-center justify-center text-xs tabular-nums rounded-md border transition-all duration-300 ${
				isActive ? `${activeClass} ${elevatedClass}` : inactiveClass
			}`}
		>
			{value}
		</div>
	);
}
