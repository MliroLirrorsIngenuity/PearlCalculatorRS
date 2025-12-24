import { Save, Share } from "lucide-react";
import { useTranslation } from "react-i18next";
import { CompactInput } from "@/components/configuration/CompactInput";
import { Button } from "@/components/ui/button";
import { FieldLegend, FieldSet } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useConfig } from "@/context/ConfigContext";
import { useToastNotifications } from "@/hooks/use-toast-notifications";
import { buildEncodableConfig, encodeConfig } from "@/lib/config-codec";
import { getOppositeDirection } from "@/lib/config-utils";
import { exportConfiguration } from "@/lib/config-service";
import { cn } from "@/lib/utils";
import type { GeneralConfig } from "@/types/domain";

function TNTBlock({
	title,
	data,
	onUpdate,
	yOffset,
}: {
	title: string;
	data: { x: number; y: number; z: number };
	onUpdate: (key: "x" | "y" | "z", val: number) => void;
	yOffset: number;
}) {
	return (
		<div className="space-y-1.5">
			<div className="text-xs font-bold text-foreground/80">{title}</div>
			<div className="grid gap-1.5">
				<CompactInput
					label="X"
					labelClassName="w-3 text-left pr-0"
					value={data.x}
					onChange={(v) => onUpdate("x", parseFloat(v) || 0)}
				/>
				<CompactInput
					label="Y"
					labelClassName="w-3 text-left pr-0"
					value={data.y + yOffset}
					onChange={(v) => onUpdate("y", (parseFloat(v) || 0) - yOffset)}
				/>
				<CompactInput
					label="Z"
					labelClassName="w-3 text-left pr-0"
					value={data.z}
					onChange={(v) => onUpdate("z", parseFloat(v) || 0)}
				/>
			</div>
		</div>
	);
}

interface ConfigurationDataFormProps {
	config: GeneralConfig;
	cannonYDisplay: string;
	onConfigChange: (newConfig: GeneralConfig) => void;
	onCannonYChange: (val: string) => void;
}

export default function ConfigurationDataForm({
	config,
	cannonYDisplay,
	onConfigChange,
	onCannonYChange,
}: ConfigurationDataFormProps) {
	const { t } = useTranslation();
	const { bitTemplateConfig } = useConfig();
	const { showSuccess, showError } = useToastNotifications();
	const baseY = Math.floor(config.pearl_y_position);
	const yOffset = (parseFloat(cannonYDisplay) || baseY) - baseY;
	const alignedLabelClass = "w-8 text-right pr-1 text-[10px] uppercase";

	const handleCopyCode = async () => {
		try {
			const encodable = buildEncodableConfig(config, bitTemplateConfig);
			const encoded = encodeConfig(encodable);
			const { calculatorService } = await import("@/services");
			await calculatorService.copyToClipboard(encoded);
			showSuccess(t("configuration_page.toast_code_copied"));
		} catch (error) {
			console.error(error);
			showError(t("error.configuration_page.copy_code_failed"));
		}
	};

	const handleExportConfig = async () => {
		try {
			const encodable = buildEncodableConfig(config, bitTemplateConfig);
			await exportConfiguration(encodable);
			showSuccess(t("configuration_page.toast_exported"));
		} catch (error) {
			console.error(error);
			showError(t("error.configuration_page.export_failed"));
		}
	};

	const handleRedTntPositionChange = (
		value: "SouthEast" | "NorthWest" | "SouthWest" | "NorthEast",
	) => {
		onConfigChange({
			...config,
			default_red_tnt_position: value,
			default_blue_tnt_position: getOppositeDirection(value),
		});
	};

	const handleBlueTntPositionChange = (
		value: "SouthEast" | "NorthWest" | "SouthWest" | "NorthEast",
	) => {
		onConfigChange({
			...config,
			default_blue_tnt_position: value,
			default_red_tnt_position: getOppositeDirection(value),
		});
	};

	return (
		<ScrollArea className="h-full">
			<div className="pl-1 pr-3">
				<FieldSet className="w-full space-y-3 pb-4">
					<FieldLegend className="text-lg font-semibold flex items-center justify-between w-full">
						<div className="flex items-center gap-2">
							{t("calculator.configuration_legend")}
							{yOffset !== 0 && (
								<span className="text-xs font-normal text-muted-foreground">
									{t("calculator.y_offset", {
										offset: (yOffset > 0 ? "+" : "") + yOffset,
									})}
								</span>
							)}
						</div>
						<div className="flex items-center gap-1">
							<TooltipProvider delayDuration={0}>
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											variant="ghost"
											size="icon"
											className="h-6 w-6"
											onClick={handleExportConfig}
										>
											<Save className="h-4 w-4" />
										</Button>
									</TooltipTrigger>
									<TooltipContent>
										<p>{t("configuration_page.export_btn")}</p>
									</TooltipContent>
								</Tooltip>

								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											variant="ghost"
											size="icon"
											className="h-6 w-6"
											onClick={handleCopyCode}
										>
											<Share className="h-4 w-4" />
										</Button>
									</TooltipTrigger>
									<TooltipContent>
										<p>{t("calculator.copy_code_tooltip")}</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						</div>
					</FieldLegend>

					<div className="grid grid-cols-2 gap-x-2 gap-y-3">
						<TNTBlock
							title={t("calculator.direction_nw")}
							data={config.north_west_tnt}
							yOffset={yOffset}
							onUpdate={(k, v) =>
								onConfigChange({
									...config,
									north_west_tnt: { ...config.north_west_tnt, [k]: v },
								})
							}
						/>
						<TNTBlock
							title={t("calculator.direction_ne")}
							data={config.north_east_tnt}
							yOffset={yOffset}
							onUpdate={(k, v) =>
								onConfigChange({
									...config,
									north_east_tnt: { ...config.north_east_tnt, [k]: v },
								})
							}
						/>
						<TNTBlock
							title={t("calculator.direction_sw")}
							data={config.south_west_tnt}
							yOffset={yOffset}
							onUpdate={(k, v) =>
								onConfigChange({
									...config,
									south_west_tnt: { ...config.south_west_tnt, [k]: v },
								})
							}
						/>
						<TNTBlock
							title={t("calculator.direction_se")}
							data={config.south_east_tnt}
							yOffset={yOffset}
							onUpdate={(k, v) =>
								onConfigChange({
									...config,
									south_east_tnt: { ...config.south_east_tnt, [k]: v },
								})
							}
						/>

						<div className="col-span-2 space-y-1.5">
							<div className="text-xs font-bold text-foreground/80">
								{t("calculator.max_tnt")}
							</div>
							<div className="grid grid-cols-2 gap-x-2">
								<CompactInput
									label="MAX"
									labelClassName={alignedLabelClass}
									value={config.max_tnt}
									onChange={(v) =>
										onConfigChange({ ...config, max_tnt: parseFloat(v) || 0 })
									}
								/>
							</div>
						</div>

						<div className="col-span-2 space-y-1.5">
							<div className="text-xs font-bold text-foreground/80">
								{t("calculator.pearl_properties")}
							</div>
							<div className="grid grid-cols-2 gap-x-2">
								<CompactInput
									label="M"
									labelClassName={alignedLabelClass}
									value={config.pearl_y_motion}
									onChange={(v) =>
										onConfigChange({
											...config,
											pearl_y_motion: parseFloat(v) || 0,
										})
									}
								/>
								<CompactInput
									label="Y"
									labelClassName={alignedLabelClass}
									value={config.pearl_y_position + yOffset}
									onChange={(v) => {
										const val = parseFloat(v) || 0;
										const newPearlY = val - yOffset;
										const oldBaseY = Math.floor(config.pearl_y_position);
										const newBaseY = Math.floor(newPearlY);
										const diff = newBaseY - oldBaseY;

										if (diff !== 0) {
											const currentCannonY =
												parseFloat(cannonYDisplay) || oldBaseY;
											onCannonYChange((currentCannonY + diff).toString());
										}

										onConfigChange({ ...config, pearl_y_position: newPearlY });
									}}
								/>
							</div>
						</div>

						<div className="col-span-2 space-y-1.5">
							<div className="text-xs font-bold text-foreground/80">
								{t("calculator.default_positions")}
							</div>
							<div className="grid grid-cols-2 gap-x-2">
								<div className="flex items-center gap-1.5">
									<Label
										className={cn(
											"font-mono text-muted-foreground shrink-0 pt-0.5",
											alignedLabelClass,
										)}
									>
										{t("calculator.color_blue")}
									</Label>
									<Select
										value={config.default_blue_tnt_position}
										onValueChange={handleBlueTntPositionChange}
									>
										<SelectTrigger className="h-7 text-xs font-mono shadow-none focus:ring-1 w-full flex-1">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="SouthEast">
												{t("calculator.direction_se_short")}
											</SelectItem>
											<SelectItem value="NorthWest">
												{t("calculator.direction_nw_short")}
											</SelectItem>
											<SelectItem value="SouthWest">
												{t("calculator.direction_sw_short")}
											</SelectItem>
											<SelectItem value="NorthEast">
												{t("calculator.direction_ne_short")}
											</SelectItem>
										</SelectContent>
									</Select>
								</div>

								<div className="flex items-center gap-1.5">
									<Label
										className={cn(
											"font-mono text-muted-foreground shrink-0 pt-0.5",
											alignedLabelClass,
										)}
									>
										{t("calculator.color_red")}
									</Label>
									<Select
										value={config.default_red_tnt_position}
										onValueChange={handleRedTntPositionChange}
									>
										<SelectTrigger className="h-7 text-xs font-mono shadow-none focus:ring-1 w-full flex-1">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="SouthEast">
												{t("calculator.direction_se_short")}
											</SelectItem>
											<SelectItem value="NorthWest">
												{t("calculator.direction_nw_short")}
											</SelectItem>
											<SelectItem value="SouthWest">
												{t("calculator.direction_sw_short")}
											</SelectItem>
											<SelectItem value="NorthEast">
												{t("calculator.direction_ne_short")}
											</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>
						</div>
					</div>
				</FieldSet>
			</div>
		</ScrollArea>
	);
}
