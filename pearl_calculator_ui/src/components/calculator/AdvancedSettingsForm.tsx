import { useTranslation } from "react-i18next";
import {
	Field,
	FieldGroup,
	FieldLabel,
	FieldLegend,
	FieldSet,
} from "@/components/ui/field";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import type { CalculatorInputs } from "@/types/domain";

interface AdvancedSettingsFormProps {
	inputs: CalculatorInputs;
	onInputChange: (field: keyof CalculatorInputs, value: any) => void;
}

function sliderToTicks(val: number): number {
	if (val <= 50) {
		return val * 2;
	}
	return 100 * 100 ** ((val - 50) / 50);
}

function ticksToSlider(ticks: number): number {
	if (ticks <= 100) {
		return ticks / 2;
	}
	return 50 + 50 * (Math.log(ticks / 100) / Math.log(100));
}

export default function AdvancedSettingsForm({
	inputs,
	onInputChange,
}: AdvancedSettingsFormProps) {
	const { t } = useTranslation();
	return (
		<ScrollArea className="h-full">
			<div className="pl-1 pr-3">
				<FieldSet className="w-full space-y-6">
					<FieldLegend className="text-lg font-semibold">
						{t("calculator.advanced_settings_legend")}
					</FieldLegend>
					<FieldGroup className="space-y-4">
						<Field>
							<FieldLabel>{t("calculator.label_ticks_range")}</FieldLabel>
							<div className="flex items-center gap-4">
								<span className="text-sm text-muted-foreground w-8">0</span>
								<div className="relative flex-1 h-5 flex items-center">
									<div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-foreground/50 z-0 pointer-events-none" />
									<Slider
										value={[
											ticksToSlider(inputs.tickRange[0]),
											ticksToSlider(inputs.tickRange[1]),
										]}
										onValueChange={(v) => {
											const newRange = [
												Math.round(sliderToTicks(v[0])),
												Math.round(sliderToTicks(v[1])),
											];
											onInputChange("tickRange", newRange);
										}}
										min={0}
										max={100}
										step={0.1}
										className="relative z-10"
									/>
								</div>
								<span className="text-sm text-muted-foreground w-8">10000</span>
							</div>
							<p className="mt-1 text-center text-sm text-muted-foreground">
								{Math.round(inputs.tickRange[0])} -{" "}
								{Math.round(inputs.tickRange[1])} {t("calculator.suffix_ticks")}
							</p>
						</Field>
						<Field>
							<FieldLabel>{t("calculator.label_distance_range")}</FieldLabel>
							<div className="flex items-center gap-4">
								<span className="text-sm text-muted-foreground w-8">0</span>
								<Slider
									value={inputs.distanceRange}
									onValueChange={(v) => onInputChange("distanceRange", v)}
									min={0}
									max={50}
									step={0.5}
									className="flex-1"
								/>
								<span className="text-sm text-muted-foreground w-8">50</span>
							</div>
							<p className="mt-1 text-center text-sm text-muted-foreground">
								{inputs.distanceRange[0].toFixed(1)} -{" "}
								{inputs.distanceRange[1].toFixed(1)}{" "}
								{t("calculator.suffix_blocks")}
							</p>
						</Field>
					</FieldGroup>
				</FieldSet>
			</div>
		</ScrollArea>
	);
}
