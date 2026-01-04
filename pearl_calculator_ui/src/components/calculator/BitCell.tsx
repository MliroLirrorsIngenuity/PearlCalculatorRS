import { ThemeColor } from "@/lib/bit-layout-utils";

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
			? "bg-blue-500 border-blue-600 shadow-md shadow-blue-200 text-white font-bold scale-110 z-10"
			: "bg-red-500 border-red-600 shadow-md shadow-red-200 text-white font-bold scale-110 z-10";

	const inactiveClass =
		"bg-slate-50 border-slate-200 border-dashed text-slate-300 opacity-50";
	const elevatedClass = elevated ? "-translate-y-0.5" : "";

	return (
		<div
			className={`w-12 h-8 flex items-center justify-center text-xs font-mono rounded-lg border transition-all duration-300 ${
				isActive ? `${activeClass} ${elevatedClass}` : inactiveClass
			}`}
		>
			{value}
		</div>
	);
}
