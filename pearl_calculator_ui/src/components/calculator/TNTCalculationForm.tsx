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
import type { CalculatorInputs } from "@/types/domain";

interface TNTCalculationFormProps {
	inputs: CalculatorInputs;

	onInputChange: (field: keyof CalculatorInputs, value: string) => void;
}

export default function TNTCalculationForm({
	inputs,
	onInputChange,
}: TNTCalculationFormProps) {
	const { t } = useTranslation();
	return (
		<ScrollArea className="h-full">
			<div className="pl-1 pr-3">
				<FieldSet className="w-full space-y-2 pb-4">
					<FieldLegend className="text-lg font-semibold">
						{t("calculator.calculation_legend")}
					</FieldLegend>
					<FieldGroup className="grid grid-cols-2 gap-4">
						<Field>
							<FieldLabel htmlFor="pearl-x">{t("calculator.label_pearl_x")}</FieldLabel>
							<Input
								id="pearl-x"
								type="number"
								placeholder="0.0"
								value={inputs.pearlX}
								onChange={(e) => onInputChange("pearlX", e.target.value)}
							/>
						</Field>
						<Field>
							<FieldLabel htmlFor="pearl-z">{t("calculator.label_pearl_z")}</FieldLabel>
							<Input
								id="pearl-z"
								type="number"
								placeholder="0.0"
								value={inputs.pearlZ}
								onChange={(e) => onInputChange("pearlZ", e.target.value)}
							/>
						</Field>
					</FieldGroup>
					<FieldGroup>
						<Field>
							<FieldLabel htmlFor="cannon-y">{t("calculator.label_cannon_y")}</FieldLabel>
							<Input
								id="cannon-y"
								type="number"
								placeholder="36"
								value={inputs.cannonY}
								onChange={(e) => onInputChange("cannonY", e.target.value)}
							/>
						</Field>
					</FieldGroup>
					<FieldGroup className="grid grid-cols-2 gap-4">
						<Field>
							<FieldLabel htmlFor="dest-x">{t("calculator.label_dest_x")}</FieldLabel>
							<Input
								id="dest-x"
								type="number"
								placeholder="0.0"
								value={inputs.destX}
								onChange={(e) => onInputChange("destX", e.target.value)}
							/>
						</Field>
						<Field>
							<FieldLabel htmlFor="dest-z">{t("calculator.label_dest_z")}</FieldLabel>
							<Input
								id="dest-z"
								type="number"
								placeholder="0.0"
								value={inputs.destZ}
								onChange={(e) => onInputChange("destZ", e.target.value)}
							/>
						</Field>
					</FieldGroup>
				</FieldSet>
			</div>
		</ScrollArea>
	);
}
