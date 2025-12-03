import { useTranslation } from "react-i18next";
import {
	Field,
	FieldGroup,
	FieldLabel,
	FieldLegend,
	FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import type { CalculatorInputs } from "@/types/domain";

interface AdvancedSettingsFormProps {
	inputs: CalculatorInputs;
	onInputChange: (field: keyof CalculatorInputs, value: any) => void;
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
					<FieldGroup className="grid grid-cols-2 gap-4">
						<Field>
							<FieldLabel htmlFor="offset-x">{t("calculator.label_offset_x")}</FieldLabel>
							<Input
								id="offset-x"
								type="number"
								step="any"
								value={inputs.offsetX}
								onChange={(e) => onInputChange("offsetX", e.target.value)}
							/>
						</Field>
						<Field>
							<FieldLabel htmlFor="offset-z">{t("calculator.label_offset_z")}</FieldLabel>
							<Input
								id="offset-z"
								type="number"
								step="any"
								value={inputs.offsetZ}
								onChange={(e) => onInputChange("offsetZ", e.target.value)}
							/>
						</Field>
					</FieldGroup>
					<FieldGroup className="space-y-4">
						<Field>
							<FieldLabel>{t("calculator.label_ticks_range")}</FieldLabel>
							<div className="flex items-center gap-4">
								<span className="text-sm text-muted-foreground w-8">0</span>
								<Slider
									value={inputs.tickRange}
									onValueChange={(v) => onInputChange("tickRange", v)}
									min={0}
									max={100}
									step={1}
									className="flex-1"
								/>
								<span className="text-sm text-muted-foreground w-8">100</span>
							</div>
							<p className="mt-1 text-center text-sm text-muted-foreground">
								{inputs.tickRange[0]} - {inputs.tickRange[1]} {t("calculator.suffix_ticks")}
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
								{inputs.distanceRange[1].toFixed(1)} {t("calculator.suffix_blocks")}
							</p>
						</Field>
					</FieldGroup>
				</FieldSet>
			</div>
		</ScrollArea>
	);
}
