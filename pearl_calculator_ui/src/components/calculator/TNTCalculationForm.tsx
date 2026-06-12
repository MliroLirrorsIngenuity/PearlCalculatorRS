import { Info } from "lucide-react";
import { useEffect, useState } from "react";
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

function BufferedNumberInput({
	id,
	value,
	placeholder,
	onChange,
}: {
	id?: string;
	value: string;
	placeholder?: string;
	onChange: (val: string) => void;
}) {
	const [localValue, setLocalValue] = useState(value);
	const [isFocused, setIsFocused] = useState(false);

	useEffect(() => {
		if (!isFocused) {
			setLocalValue(value);
		}
	}, [value, isFocused]);

	const handleChange = (newValue: string) => {
		setLocalValue(newValue);
		onChange(newValue);
	};

	return (
		<Input
			id={id}
			type="number"
			placeholder={placeholder}
			value={localValue}
			onChange={(e) => handleChange(e.target.value)}
			onFocus={() => setIsFocused(true)}
			onBlur={() => setIsFocused(false)}
		/>
	);
}

interface TNTCalculationFormProps {
	inputs: CalculatorInputs;

	onInputChange: (
		field: keyof CalculatorInputs,
		value: string | boolean,
	) => void;
}

export default function TNTCalculationForm({
	inputs,
	onInputChange,
}: TNTCalculationFormProps) {
	const { t } = useTranslation();
	const { calculationMode } = useConfigurationState();
	const showPlaneInterceptToggle = calculationMode !== "Vector3D";
	const showDestY =
		calculationMode === "Vector3D" ? true : inputs.planeInterceptY;

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
							<BufferedNumberInput
									id="pearl-x"
								placeholder="0.0"
								value={inputs.pearlX}
								onChange={(v) => onInputChange("pearlX", v)}
							/>
						</Field>
						<Field>
							<FieldLabel htmlFor="pearl-z">
								{t("calculator.label_pearl_z")}
							</FieldLabel>
							<BufferedNumberInput
									id="pearl-z"
								placeholder="0.0"
								value={inputs.pearlZ}
								onChange={(v) => onInputChange("pearlZ", v)}
							/>
						</Field>
					</FieldGroup>
					<FieldGroup>
						<Field>
							<div className="flex items-center justify-between gap-3">
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
								{showPlaneInterceptToggle && (
									<label
										htmlFor="plane-intercept-y"
										className="flex items-center gap-2 text-sm font-normal text-muted-foreground"
									>
										<input
											id="plane-intercept-y"
											type="checkbox"
											checked={inputs.planeInterceptY}
											onChange={(e) =>
												onInputChange("planeInterceptY", e.target.checked)
											}
											className="h-4 w-4 rounded border-input accent-foreground"
										/>
										<span>{t("calculator.plane_intercept_toggle")}</span>
									</label>
								)}
							</div>
							<BufferedNumberInput
									id="cannon-y"
								placeholder="36"
								value={inputs.cannonY}
								onChange={(v) => onInputChange("cannonY", v)}
							/>
						</Field>
					</FieldGroup>
					<FieldGroup
						className={`grid ${showDestY ? "grid-cols-3" : "grid-cols-2"} gap-4`}
					>
						<Field>
							<FieldLabel htmlFor="dest-x">
								{t("calculator.label_dest_x")}
							</FieldLabel>
							<BufferedNumberInput
									id="dest-x"
								placeholder="0.0"
								value={inputs.destX}
								onChange={(v) => onInputChange("destX", v)}
							/>
						</Field>
						{showDestY && (
							<Field>
								<FieldLabel htmlFor="dest-y">
									{t("calculator.label_dest_y", "Dest Y")}
								</FieldLabel>
								<BufferedNumberInput
											id="dest-y"
									placeholder="0.0"
									value={inputs.destY || ""}
									onChange={(v) => onInputChange("destY", v)}
								/>
							</Field>
						)}
						<Field>
							<FieldLabel htmlFor="dest-z">
								{t("calculator.label_dest_z")}
							</FieldLabel>
							<BufferedNumberInput
									id="dest-z"
								placeholder="0.0"
								value={inputs.destZ}
								onChange={(v) => onInputChange("destZ", v)}
							/>
						</Field>
					</FieldGroup>
				</FieldSet>
			</div>
		</ScrollArea>
	);
}
