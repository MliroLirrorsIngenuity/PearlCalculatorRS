import { ArrowLeft, ArrowRight } from "lucide-react";
import { getThemeClasses, type ThemeColor } from "./bit-layout-utils";

interface BitResultRowProps {
	theme: ThemeColor;
	values: string[];
	activeIndices: number[];
	arrowPosition: "left" | "right";
}

export function BitResultRow({
	theme,
	values,
	activeIndices,
	arrowPosition,
}: BitResultRowProps) {
	const style = getThemeClasses(theme);

	const getActiveClass = (isActive: boolean) => {
		if (!isActive) {
			return "bg-slate-50 border-slate-200 border-dashed text-slate-300 opacity-50";
		}
		return theme === "blue"
			? "bg-blue-500 border-blue-600 shadow-md shadow-blue-200 text-white font-bold scale-110 -translate-y-0.5 z-10"
			: "bg-red-500 border-red-600 shadow-md shadow-red-200 text-white font-bold scale-110 -translate-y-0.5 z-10";
	};

	return (
		<div className="flex justify-center items-center gap-2 px-4">
			{arrowPosition === "left" ? (
				<ArrowLeft className={`w-4 h-4 shrink-0 ${style.arrow}`} />
			) : (
				<ArrowLeft className="w-4 h-4 shrink-0 invisible" />
			)}
			<div className="flex flex-wrap justify-center gap-1.5">
				{values.map((val, index) => {
					const isActive = activeIndices.includes(index);
					return (
						<div
							key={index}
							className={`w-12 h-8 flex items-center justify-center text-xs font-mono rounded-lg border transition-all duration-300 ${getActiveClass(isActive)}`}
						>
							{val}
						</div>
					);
				})}
			</div>
			{arrowPosition === "right" ? (
				<ArrowRight className={`w-4 h-4 shrink-0 ${style.arrow}`} />
			) : (
				<ArrowRight className="w-4 h-4 shrink-0 invisible" />
			)}
		</div>
	);
}
