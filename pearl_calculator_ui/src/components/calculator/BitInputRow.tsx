import React from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useElementSize } from "@/hooks/use-element-size";
import { CarriageReturnGuide } from "./CarriageReturnGuide";
import {
	THEME_CLASSES,
	ThemeColor,
	calculateRowChunks,
} from "@/lib/bit-layout-utils";

interface BitInputRowProps {
	theme: ThemeColor;
	label: string;
	values: string[];
	placeholders: string[];
	arrowPosition: "left" | "right";
	inputRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
	onValueChange: (index: number, value: string) => void;
	onKeyDown: (index: number, e: React.KeyboardEvent<HTMLInputElement>) => void;
	onPaste?: (index: number, e: React.ClipboardEvent) => void;
}

export { type ThemeColor };

export function BitInputRow({
	theme,
	label,
	values,
	placeholders,
	arrowPosition,
	inputRefs,
	onValueChange,
	onKeyDown,
	onPaste,
}: BitInputRowProps) {
	const style = THEME_CLASSES[theme];
	const isRightToLeft = arrowPosition === "left";

	const { ref: containerRef, width: containerWidth } =
		useElementSize<HTMLDivElement>();

	const { chunks, indexChunks } = React.useMemo(() => {
		return calculateRowChunks(values, containerWidth, isRightToLeft);
	}, [values, containerWidth, isRightToLeft]);

	const isSingleRow = chunks.length === 1;

	return (
		<div
			ref={containerRef}
			className={`p-4 rounded-xl border ${style.container} space-y-2 mx-auto`}
		>
			<div className="grid grid-cols-[16px_1fr_16px] w-40 items-center mx-auto mb-2">
				<div className="flex justify-center">
					{isRightToLeft && <ArrowLeft className={`w-4 h-4 ${style.arrow}`} />}
				</div>
				<div className="flex justify-center">
					<Label
						className={`text-xs font-bold uppercase tracking-wider ${style.text}`}
					>
						{label}
					</Label>
				</div>
				<div className="flex justify-center">
					{!isRightToLeft && (
						<ArrowRight className={`w-4 h-4 ${style.arrow}`} />
					)}
				</div>
			</div>

			<div className="space-y-0 relative px-4">
				{chunks.map((chunk, chunkIndex) => {
					const staggerIndex = isRightToLeft
						? chunks.length - 1 - chunkIndex
						: chunkIndex;
					const staggerOffset = isSingleRow ? 0 : staggerIndex * 32;

					return (
						<div key={chunkIndex} className="relative">
							{chunkIndex > 0 && !isSingleRow && (
								<CarriageReturnGuide
									theme={theme}
									isRightToLeft={isRightToLeft}
									staggerOffset={staggerOffset}
								/>
							)}

							<div
								style={{
									paddingLeft: !isRightToLeft ? staggerOffset : 0,
									paddingRight: isRightToLeft ? staggerOffset : 0,
								}}
							>
								<div
									className={`flex gap-1.5 flex-wrap ${
										isSingleRow ? "justify-center" : "justify-start"
									} ${isRightToLeft ? "flex-row-reverse" : ""}`}
								>
									{chunk.map((val, i) => {
										const originalIndex = indexChunks[chunkIndex][i];

										return (
											<Input
												key={originalIndex}
												ref={(el) => {
													inputRefs.current[originalIndex] = el;
												}}
												value={val}
												onChange={(e) =>
													onValueChange(originalIndex, e.target.value)
												}
												onKeyDown={(e) => onKeyDown(originalIndex, e)}
												onPaste={(e) => onPaste?.(originalIndex, e)}
												className={`w-12 h-8 text-center text-xs p-0 font-mono rounded-lg bg-white shadow-sm transition-all duration-200 ${style.input}`}
												placeholder={placeholders[originalIndex] || "0"}
											/>
										);
									})}
								</div>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
