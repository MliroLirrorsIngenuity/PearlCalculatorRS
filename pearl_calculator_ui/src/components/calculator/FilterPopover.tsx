import { Filter } from "lucide-react";
import { useTranslation } from "react-i18next";
import { sectionLabelClass } from "@/components/common/Metric";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { useConfigurationState } from "@/context/ConfigurationStateContext";
import {
	defaultDistanceRange,
	defaultTickRange,
	hasCustomFilters,
} from "@/lib/calculator-defaults";
import { cn } from "@/lib/utils";
import type { CalculatorInputs } from "@/types/domain";

const MAX_TICKS = 10000;
const MAX_DISTANCE = 50;

function sliderToTicks(value: number) {
	return value <= 50 ? value * 2 : 100 * 100 ** ((value - 50) / 50);
}

function ticksToSlider(ticks: number) {
	return ticks <= 100
		? ticks / 2
		: 50 + 50 * (Math.log(ticks / 100) / Math.log(100));
}

interface FilterPopoverProps {
	inputs: CalculatorInputs;
	onInputChange: (
		field: "tickRange" | "distanceRange",
		value: [number, number],
	) => void;
}

function RangeRow({
	label,
	value,
	children,
}: {
	label: string;
	value: string;
	children: React.ReactNode;
}) {
	return (
		<div className="flex flex-col gap-3">
			<div className="flex items-baseline justify-between">
				<span className="text-sm font-medium">{label}</span>
				<span className="text-sm tabular-nums">{value}</span>
			</div>
			{children}
		</div>
	);
}

export function FilterPopover({ inputs, onInputChange }: FilterPopoverProps) {
	const { t } = useTranslation();
	const { calculationMode } = useConfigurationState();
	const [tickMin, tickMax] = inputs.tickRange;
	const [distanceMin, distanceMax] = inputs.distanceRange;
	const active = hasCustomFilters(inputs, calculationMode);

	const reset = () => {
		onInputChange("tickRange", defaultTickRange(calculationMode));
		onInputChange("distanceRange", defaultDistanceRange(calculationMode));
	};

	return (
		<Popover>
			<PopoverTrigger asChild>
				<button
					type="button"
					aria-label={active ? t("calculator.filter_active") : undefined}
					className={cn(
						"flex h-6 shrink-0 items-center gap-1.5 rounded-md px-2 text-xs tabular-nums transition-colors",
						active
							? "bg-primary text-primary-foreground hover:bg-primary/90"
							: "bg-muted text-foreground/80 hover:bg-accent",
					)}
				>
					<Filter className="size-3" />
					{t("calculator.filter_summary", {
						tickMin,
						tickMax,
						distance: distanceMax,
					})}
				</button>
			</PopoverTrigger>
			<PopoverContent align="end" className="flex w-80 flex-col gap-5">
				<div className="flex items-center justify-between">
					<span className={sectionLabelClass}>
						{t("calculator.filter_title")}
					</span>
					<button
						type="button"
						onClick={reset}
						disabled={!active}
						className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-40"
					>
						{t("calculator.filter_reset")}
					</button>
				</div>
				<RangeRow
					label={t("calculator.label_ticks_range")}
					value={`${Math.round(tickMin)} – ${Math.round(tickMax)}`}
				>
					<Slider
						value={[ticksToSlider(tickMin), ticksToSlider(tickMax)]}
						onValueChange={([lo, hi]) =>
							onInputChange("tickRange", [
								Math.round(sliderToTicks(lo)),
								Math.round(sliderToTicks(hi)),
							])
						}
						min={0}
						max={100}
						step={0.1}
					/>
					<div className="flex justify-between text-xs text-muted-foreground tabular-nums">
						<span>0</span>
						<span>{MAX_TICKS}</span>
					</div>
				</RangeRow>
				<RangeRow
					label={t("calculator.label_distance_range")}
					value={`${distanceMin.toFixed(1)} – ${distanceMax.toFixed(1)}`}
				>
					<Slider
						value={inputs.distanceRange}
						onValueChange={([lo, hi]) =>
							onInputChange("distanceRange", [lo, hi])
						}
						min={0}
						max={MAX_DISTANCE}
						step={0.5}
					/>
					<div className="flex justify-between text-xs text-muted-foreground tabular-nums">
						<span>0</span>
						<span>{MAX_DISTANCE}</span>
					</div>
				</RangeRow>
			</PopoverContent>
		</Popover>
	);
}
