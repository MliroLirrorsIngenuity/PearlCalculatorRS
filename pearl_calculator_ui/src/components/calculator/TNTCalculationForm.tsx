import { Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
	Field,
	FieldGroup,
	FieldLabel,
	FieldLegend,
	FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useConfigurationState } from "@/context/ConfigurationStateContext";
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
	const { calculationMode } = useConfigurationState();
	const is3D = calculationMode === "Vector3D";

	return (
		<ScrollArea className="h-full">
			<div className="pl-1 pr-3">
				<FieldSet className="w-full space-y-2 pb-4">
					<FieldLegend className="text-lg font-semibold">
						{t("calculator.calculation_legend")}
					</FieldLegend>
					<FieldGroup className="grid grid-cols-2 gap-4">
						<Field>
							<FieldLabel htmlFor="pearl-x">
								{t("calculator.label_pearl_x")}
							</FieldLabel>
							<Input
								id="pearl-x"
								type="number"
								placeholder="0.0"
								value={inputs.pearlX}
								onChange={(e) => onInputChange("pearlX", e.target.value)}
							/>
						</Field>
						<Field>
							<FieldLabel htmlFor="pearl-z">
								{t("calculator.label_pearl_z")}
							</FieldLabel>
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
							<div className="flex items-center gap-2">
								<FieldLabel htmlFor="cannon-y">
									{t("calculator.label_cannon_y")}
								</FieldLabel>
								<TooltipProvider>
									<Tooltip>
										<TooltipTrigger asChild>
											<Button
												variant="ghost"
												size="icon"
												className="h-4 w-4 rounded-full p-0 -translate-y-0.5"
											>
												<Info className="h-3.5 w-3.5 text-muted-foreground" />
												<span className="sr-only">Info</span>
											</Button>
										</TooltipTrigger>
										<TooltipContent>
											<p>{t("calculator.cannon_y_tooltip")}</p>
										</TooltipContent>
									</Tooltip>
								</TooltipProvider>
							</div>
							<Input
								id="cannon-y"
								type="number"
								placeholder="36"
								value={inputs.cannonY}
								onChange={(e) => onInputChange("cannonY", e.target.value)}
							/>
						</Field>
					</FieldGroup>
					<FieldGroup
						className={`grid ${is3D ? "grid-cols-3" : "grid-cols-2"} gap-4`}
					>
						<Field>
							<FieldLabel htmlFor="dest-x">
								{t("calculator.label_dest_x")}
							</FieldLabel>
							<Input
								id="dest-x"
								type="number"
								placeholder="0.0"
								value={inputs.destX}
								onChange={(e) => onInputChange("destX", e.target.value)}
							/>
						</Field>
						{is3D && (
							<Field>
								<FieldLabel htmlFor="dest-y">
									{t("calculator.label_dest_y", "Dest Y")}
								</FieldLabel>
								<Input
									id="dest-y"
									type="number"
									placeholder="0.0"
									value={inputs.destY || ""}
									onChange={(e) => onInputChange("destY", e.target.value)}
								/>
							</Field>
						)}
						<Field>
							<FieldLabel htmlFor="dest-z">
								{t("calculator.label_dest_z")}
							</FieldLabel>
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
