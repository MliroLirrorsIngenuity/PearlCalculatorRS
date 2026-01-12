import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Label } from "@/components/ui/label";
import { useElementSize } from "@/hooks/use-element-size";
import { BitCellGroup, HorizontalBitRow } from "./BitCellGroup";
import { DirectionDisplay } from "./DirectionDisplay";
import {
	type ThemeColor,
	calculateRequiredWidth,
} from "@/lib/bit-layout-utils";

interface BitResultSectionProps {
	sideCount: number;
	sideValues: string[];
	activeIndices: { blue: number[]; red: number[] };
	direction?: [boolean, boolean];
	isSwapped: boolean;
	label?: string;
	variant?: "default" | "multiplier";
	disabled?: boolean;
}

export function BitResultSection({
	sideCount,
	sideValues,
	activeIndices,
	direction,
	isSwapped,
	label,
	variant = "default",
	disabled,
}: BitResultSectionProps) {
	const { t } = useTranslation();
	const { ref: containerRef, width: containerWidth } =
		useElementSize<HTMLDivElement>();

	const getPlaceholder = (index: number) => (index + 1).toString();

	const topTheme: ThemeColor = isSwapped ? "red" : "blue";
	const botTheme: ThemeColor = isSwapped ? "blue" : "red";

	const topResultValues = useMemo(
		() =>
			Array(sideCount)
				.fill(0)
				.map((_, i) => {
					const val = sideValues[i];
					return val && val.trim() !== "" ? val : getPlaceholder(i);
				}),
		[sideCount, sideValues],
	);

	const botResultValues = useMemo(
		() =>
			Array(sideCount)
				.fill(0)
				.map((_, i) => {
					const idx = sideCount - 1 - i;
					const val = sideValues[idx];
					return val && val.trim() !== "" ? val : getPlaceholder(idx);
				}),
		[sideCount, sideValues],
	);

	const topActiveIndices =
		topTheme === "blue" ? activeIndices.blue : activeIndices.red;
	const botActiveIndices = useMemo(
		() =>
			(botTheme === "blue" ? activeIndices.blue : activeIndices.red).map(
				(idx) => sideCount - 1 - idx,
			),
		[botTheme, activeIndices.blue, activeIndices.red, sideCount],
	);

	const useHorizontalLayout =
		containerWidth >= calculateRequiredWidth(sideCount);

	const isMultiplier = variant === "multiplier";
	const labelDividerClass = isMultiplier
		? "h-px flex-1 bg-amber-200"
		: "h-px flex-1 bg-violet-200";
	const labelTextClass = isMultiplier
		? "text-xs font-bold text-amber-600 uppercase tracking-widest"
		: "text-xs font-bold text-violet-500 uppercase tracking-widest";

	return (
		<div ref={containerRef} className="w-full">
			{label && (
				<div className="flex items-center gap-4 py-2 shrink-0">
					<div className={labelDividerClass} />
					<Label className={labelTextClass}>{label}</Label>
					<div className={labelDividerClass} />
				</div>
			)}

			<div
				className={`flex flex-col justify-center items-center w-full gap-4 pt-2 pb-4 transition-opacity duration-200 ${
					disabled ? "opacity-50 pointer-events-none grayscale" : ""
				}`}
			>
				{useHorizontalLayout ? (
					<div className="flex justify-center items-center gap-2 w-full">
						<HorizontalBitRow
							values={topResultValues}
							activeIndices={topActiveIndices}
							theme={topTheme}
							arrowPosition="right"
						/>
						{direction && <DirectionDisplay direction={direction} />}
						<HorizontalBitRow
							values={botResultValues}
							activeIndices={botActiveIndices}
							theme={botTheme}
							arrowPosition="left"
						/>
					</div>
				) : (
					<>
						{direction && (
							<DirectionDisplay
								direction={direction}
								label={t("calculator.direction_label_full")}
							/>
						)}
						<div className="space-y-2 w-full">
							<div className="flex justify-center items-center gap-2 px-4">
								<BitCellGroup
									values={topResultValues}
									activeIndices={topActiveIndices}
									theme={topTheme}
									arrowPosition="right"
									wrap
									elevated
								/>
							</div>
							<div className="flex justify-center items-center gap-2 px-4">
								<BitCellGroup
									values={botResultValues}
									activeIndices={botActiveIndices}
									theme={botTheme}
									arrowPosition="left"
									wrap
									elevated
								/>
							</div>
						</div>
					</>
				)}
			</div>
		</div>
	);
}
