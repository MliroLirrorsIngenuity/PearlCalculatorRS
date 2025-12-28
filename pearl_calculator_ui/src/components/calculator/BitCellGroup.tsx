import { ArrowLeft, ArrowRight } from "lucide-react";
import { ThemeColor } from "./bit-layout-utils";
import { BitCell } from "./BitCell";

interface BitCellGroupProps {
	values: string[];
	activeIndices: number[];
	theme: ThemeColor;
	arrowPosition: "left" | "right";
	wrap?: boolean;
	elevated?: boolean;
}

export function BitCellGroup({
	values,
	activeIndices,
	theme,
	arrowPosition,
	wrap = false,
	elevated = false,
}: BitCellGroupProps) {
	const arrowClass = theme === "blue" ? "text-blue-400" : "text-red-400";
	const containerClass = wrap
		? "flex flex-wrap justify-center gap-1.5"
		: "flex items-center gap-1.5";

	return (
		<div className={`flex items-center gap-1.5 ${wrap ? "" : "shrink-0"}`}>
			{arrowPosition === "left" ? (
				<ArrowLeft className={`w-4 h-4 shrink-0 ${arrowClass}`} />
			) : (
				<ArrowLeft className="w-4 h-4 shrink-0 invisible" />
			)}
			<div className={containerClass}>
				{values.map((val, index) => (
					<BitCell
						key={index}
						value={val}
						isActive={activeIndices.includes(index)}
						theme={theme}
						elevated={elevated}
					/>
				))}
			</div>
			{arrowPosition === "right" ? (
				<ArrowRight className={`w-4 h-4 shrink-0 ${arrowClass}`} />
			) : (
				<ArrowRight className="w-4 h-4 shrink-0 invisible" />
			)}
		</div>
	);
}

interface HorizontalBitRowProps {
	values: string[];
	activeIndices: number[];
	theme: ThemeColor;
	arrowPosition: "left" | "right";
}

export function HorizontalBitRow({
	values,
	activeIndices,
	theme,
	arrowPosition,
}: HorizontalBitRowProps) {
	const arrowClass = theme === "blue" ? "text-blue-400" : "text-red-400";

	return (
		<div className="flex items-center gap-1.5 shrink-0">
			{arrowPosition === "left" && (
				<ArrowLeft className={`w-4 h-4 shrink-0 ${arrowClass}`} />
			)}
			{values.map((val, index) => (
				<BitCell
					key={index}
					value={val}
					isActive={activeIndices.includes(index)}
					theme={theme}
				/>
			))}
			{arrowPosition === "right" && (
				<ArrowRight className={`w-4 h-4 shrink-0 ${arrowClass}`} />
			)}
		</div>
	);
}
