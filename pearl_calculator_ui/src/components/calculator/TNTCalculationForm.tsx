import { ClipboardPaste, Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AxisInput } from "@/components/common/AxisInput";
import { BufferedNumberInput } from "@/components/common/BufferedNumberInput";
import { PluginCalculatorInputs } from "@/components/plugins/PluginCalculatorInputs";
import { PluginMount } from "@/components/plugins/PluginMount";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useConfigurationState } from "@/context/ConfigurationStateContext";
import { useToastNotifications } from "@/hooks/use-toast-notifications";
import { parseCoordinates } from "@/lib/f3c";
import { cn } from "@/lib/utils";
import { calculatorService } from "@/services";
import type { CalculatorInputs } from "@/types/domain";

const labelClass = "text-sm font-medium leading-none";

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
	const { showSuccess, showError } = useToastNotifications();
	const showDestY = calculationMode === "Vector3D" || inputs.planeInterceptY;

	const pasteCoordinates = async () => {
		const text = await calculatorService.readFromClipboard().catch(() => "");
		const coordinates = parseCoordinates(text);
		if (!coordinates) {
			showError(t("calculator.paste_f3c_failed"));
			return;
		}
		onInputChange("destX", String(coordinates.x));
		onInputChange("destY", String(coordinates.y));
		onInputChange("destZ", String(coordinates.z));
		showSuccess(t("calculator.paste_f3c_done"));
	};

	return (
		<ScrollArea className="h-full">
			<div className="flex flex-col gap-3.5 pt-1 pr-3 pb-4 pl-1">
				<div className="grid grid-cols-2 gap-4">
					<div className="flex flex-col gap-2">
						<label htmlFor="pearl-x" className={labelClass}>
							{t("calculator.label_pearl_x")}
						</label>
						<BufferedNumberInput
							id="pearl-x"
							placeholder="0.0"
							className="tabular-nums"
							value={inputs.pearlX}
							onValueChange={(v) => onInputChange("pearlX", v)}
						/>
					</div>
					<div className="flex flex-col gap-2">
						<label htmlFor="pearl-z" className={labelClass}>
							{t("calculator.label_pearl_z")}
						</label>
						<BufferedNumberInput
							id="pearl-z"
							placeholder="0.0"
							className="tabular-nums"
							value={inputs.pearlZ}
							onValueChange={(v) => onInputChange("pearlZ", v)}
						/>
					</div>
				</div>
				<div className="flex flex-col gap-2">
					<div className="flex items-center justify-between gap-3">
						<div className="flex items-center gap-1.5">
							<label htmlFor="cannon-y" className={labelClass}>
								{t("calculator.label_cannon_y")}
							</label>
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<button
											type="button"
											aria-label={t("calculator.cannon_y_tooltip")}
											className="text-muted-foreground hover:text-foreground"
										>
											<Info className="size-3.5" />
										</button>
									</TooltipTrigger>
									<TooltipContent>
										<p>{t("calculator.cannon_y_tooltip")}</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						</div>
						<label
							htmlFor="plane-intercept-y"
							className="flex items-center gap-2 text-sm text-muted-foreground"
						>
							<input
								id="plane-intercept-y"
								type="checkbox"
								checked={inputs.planeInterceptY}
								onChange={(e) =>
									onInputChange("planeInterceptY", e.target.checked)
								}
								className="size-4 rounded border-input accent-foreground"
							/>
							{t("calculator.plane_intercept_toggle")}
						</label>
					</div>
					<BufferedNumberInput
						id="cannon-y"
						placeholder="36"
						className="tabular-nums"
						value={inputs.cannonY}
						onValueChange={(v) => onInputChange("cannonY", v)}
					/>
				</div>
				<div className="flex flex-col gap-2">
					<div className="flex items-center justify-between">
						<span className={labelClass}>
							{t("calculator.target_coordinates")}
						</span>
						<Button
							type="button"
							variant="outline"
							size="sm"
							className="h-[26px] gap-1.5 px-2 text-xs"
							onClick={pasteCoordinates}
						>
							<ClipboardPaste className="size-3.5" />
							{t("calculator.paste_f3c")}
						</Button>
					</div>
					<div
						className={cn(
							"grid gap-4",
							showDestY ? "grid-cols-3" : "grid-cols-2",
						)}
					>
						<AxisInput
							axis="X"
							id="dest-x"
							value={inputs.destX}
							onValueChange={(v) => onInputChange("destX", v)}
						/>
						{showDestY && (
							<AxisInput
								axis="Y"
								id="dest-y"
								value={inputs.destY}
								onValueChange={(v) => onInputChange("destY", v)}
							/>
						)}
						<AxisInput
							axis="Z"
							id="dest-z"
							value={inputs.destZ}
							onValueChange={(v) => onInputChange("destZ", v)}
						/>
					</div>
				</div>
				<PluginCalculatorInputs />
				<PluginMount
					point="calculator.general"
					className="border-t border-border/60 pt-3.5"
				/>
			</div>
		</ScrollArea>
	);
}
