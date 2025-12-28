import { ArrowLeft, ArrowRight } from "lucide-react";
import { ThemeColor } from "./bit-layout-utils";

interface CarriageReturnGuideProps {
	theme: ThemeColor;
	isRightToLeft: boolean;
	staggerOffset: number;
}

export function CarriageReturnGuide({
	theme,
	isRightToLeft,
	staggerOffset,
}: CarriageReturnGuideProps) {
	return (
		<div
			className={`h-4 w-full border-dotted mb-1 flex ${
				isRightToLeft
					? "border-t-2 border-l-2 rounded-tl-xl flex-row-reverse items-start"
					: "border-b-2 border-r-2 rounded-br-xl flex-row items-end"
			} ${theme === "blue" ? "border-blue-200" : "border-red-200"}`}
			style={{
				marginTop: isRightToLeft ? 8 : -8,
				marginBottom: isRightToLeft ? -8 : 8,
				paddingLeft: !isRightToLeft ? staggerOffset : 0,
				paddingRight: isRightToLeft ? staggerOffset : 0,
			}}
		>
			<div className={`${isRightToLeft ? "mt-[-7px] mr-2" : "mb-[-7px] ml-2"}`}>
				{isRightToLeft ? (
					<ArrowLeft
						className={`w-3 h-3 ${
							theme === "blue" ? "text-blue-300" : "text-red-300"
						}`}
					/>
				) : (
					<ArrowRight
						className={`w-3 h-3 ${
							theme === "blue" ? "text-blue-300" : "text-red-300"
						}`}
					/>
				)}
			</div>
		</div>
	);
}
