import { ArrowLeft, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ThemeColor = "blue" | "red";

interface ThemeClasses {
	text: string;
	arrow: string;
	container: string;
	input: string;
}

const THEME_CLASSES: Record<ThemeColor, ThemeClasses> = {
	blue: {
		text: "text-blue-600",
		arrow: "text-blue-400",
		container: "bg-blue-50/50 border-blue-100",
		input:
			"border-blue-200 hover:border-blue-300 focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-500/20 placeholder:text-blue-200/50 text-blue-700 font-bold",
	},
	red: {
		text: "text-red-600",
		arrow: "text-red-400",
		container: "bg-red-50/50 border-red-100",
		input:
			"border-red-200 hover:border-red-300 focus-visible:border-red-400 focus-visible:ring-2 focus-visible:ring-red-500/20 placeholder:text-red-200/50 text-red-700 font-bold",
	},
};

interface BitInputRowProps {
	theme: ThemeColor;
	label: string;
	values: string[];
	placeholders: string[];
	arrowPosition: "left" | "right";
	inputRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
	onValueChange: (index: number, value: string) => void;
	onKeyDown: (index: number, e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export function BitInputRow({
	theme,
	label,
	values,
	placeholders,
	arrowPosition,
	inputRefs,
	onValueChange,
	onKeyDown,
}: BitInputRowProps) {
	const style = THEME_CLASSES[theme];

	return (
		<div className={`space-y-1 p-2 rounded-xl border ${style.container}`}>
			<div className="grid grid-cols-[16px_1fr_16px] w-20 items-center mx-auto">
				{arrowPosition === "left" ? (
					<div className="flex justify-center">
						<ArrowLeft className={`w-4 h-4 ${style.arrow}`} />
					</div>
				) : (
					<div />
				)}
				<div className="flex justify-center">
					<Label
						className={`text-xs font-bold uppercase tracking-wider ${style.text}`}
					>
						{label}
					</Label>
				</div>
				{arrowPosition === "right" ? (
					<div className="flex justify-center">
						<ArrowRight className={`w-4 h-4 ${style.arrow}`} />
					</div>
				) : (
					<div />
				)}
			</div>
			<div className="flex flex-wrap justify-center gap-1.5">
				{values.map((val, index) => (
					<Input
						key={index}
						ref={(el) => {
							inputRefs.current[index] = el;
						}}
						value={val}
						onChange={(e) => onValueChange(index, e.target.value)}
						onKeyDown={(e) => onKeyDown(index, e)}
						className={`w-12 h-8 text-center text-xs p-0 font-mono rounded-lg bg-white shadow-sm transition-all duration-200 ${style.input}`}
						placeholder={placeholders[index] || "0"}
					/>
				))}
			</div>
		</div>
	);
}

export function getThemeClasses(color: ThemeColor): ThemeClasses {
	return THEME_CLASSES[color];
}

export type { ThemeColor, ThemeClasses };
