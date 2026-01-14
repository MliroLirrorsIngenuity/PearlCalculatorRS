import { useTranslation } from "react-i18next";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useConfigurationState } from "@/context/ConfigurationStateContext";
import { cn } from "@/lib/utils";

interface BasicInfoStepProps {
	errors: Record<string, string>;
	onForceNext?: () => void;
}

export function BasicInfoStep({ errors, onForceNext }: BasicInfoStepProps) {
	const {
		draftConfig,
		setDraftConfig,
		cannonCenter,
		setCannonCenter,
		pearlMomentum,
		setPearlMomentum,
		wizardMode,
	} = useConfigurationState();
	const { t } = useTranslation();

	return (
		<div className="flex-1 flex items-center justify-center p-4">
			<Card className="w-full max-w-[450px]">
				<CardHeader>
					<CardTitle>{t("configuration_page.basic_info_title")}</CardTitle>
					<CardDescription>
						{t("configuration_page.basic_info_desc")}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid w-full items-center gap-4">
						<div className="flex flex-col space-y-1.5">
							<Label>{t("configuration_page.cannon_center_label")}</Label>
							<div className="grid grid-cols-2 gap-2">
								<div className="space-y-1">
									<Label className="text-xs text-muted-foreground">
										{t("configuration_page.label_x")}
									</Label>
									<Input
										type="number"
										value={cannonCenter.x}
										onChange={(e) =>
											setCannonCenter({ ...cannonCenter, x: e.target.value })
										}
										placeholder={errors.cannon_x}
										className={cn(
											"h-7 text-xs font-mono px-2 py-0 shadow-none",
											errors.cannon_x &&
												"border-destructive focus-visible:ring-destructive placeholder:text-destructive/60",
										)}
									/>
								</div>
								<div className="space-y-1">
									<Label className="text-xs text-muted-foreground">
										{t("configuration_page.label_z")}
									</Label>
									<Input
										type="number"
										value={cannonCenter.z}
										onChange={(e) =>
											setCannonCenter({ ...cannonCenter, z: e.target.value })
										}
										placeholder={errors.cannon_z}
										className={cn(
											"h-7 text-xs font-mono px-2 py-0 shadow-none",
											errors.cannon_z &&
												"border-destructive focus-visible:ring-destructive placeholder:text-destructive/60",
										)}
									/>
								</div>
							</div>
							<p className="text-[0.8rem] text-muted-foreground">
								{t("configuration_page.cannon_center_desc")}
							</p>
						</div>

						<div className="flex flex-col space-y-1.5">
							<Label>{t("configuration_page.pearl_coord_label")}</Label>
							<div className="grid grid-cols-3 gap-2">
								<div className="space-y-1">
									<Label className="text-xs text-muted-foreground">
										{t("configuration_page.label_x")}
									</Label>
									<Input
										type="number"
										value={draftConfig.pearl_x_position}
										onChange={(e) =>
											setDraftConfig({
												...draftConfig,
												pearl_x_position: e.target.value,
											})
										}
										placeholder={errors.pearl_x}
										className={cn(
											"h-7 text-xs font-mono px-2 py-0 shadow-none",
											errors.pearl_x &&
												"border-destructive focus-visible:ring-destructive placeholder:text-destructive/60",
										)}
									/>
								</div>
								<div className="space-y-1">
									<Label className="text-xs text-muted-foreground">
										{t("configuration_page.label_y")}
									</Label>
									<Input
										type="number"
										value={draftConfig.pearl_y_position}
										onChange={(e) =>
											setDraftConfig({
												...draftConfig,
												pearl_y_position: e.target.value,
											})
										}
										placeholder={errors.pearl_y}
										className={cn(
											"h-7 text-xs font-mono px-2 py-0 shadow-none",
											errors.pearl_y &&
												"border-destructive focus-visible:ring-destructive placeholder:text-destructive/60",
										)}
									/>
								</div>
								<div className="space-y-1">
									<Label className="text-xs text-muted-foreground">
										{t("configuration_page.label_z")}
									</Label>
									<Input
										type="number"
										value={draftConfig.pearl_z_position}
										onChange={(e) =>
											setDraftConfig({
												...draftConfig,
												pearl_z_position: e.target.value,
											})
										}
										placeholder={errors.pearl_z}
										className={cn(
											"h-7 text-xs font-mono px-2 py-0 shadow-none",
											errors.pearl_z &&
												"border-destructive focus-visible:ring-destructive placeholder:text-destructive/60",
										)}
									/>
								</div>
							</div>
							<p className="text-[0.8rem] text-muted-foreground">
								{t("configuration_page.pearl_coord_desc")}
							</p>
						</div>

						<div className="flex flex-col space-y-1.5">
							<Label>{t("configuration_page.pearl_momentum_label")}</Label>
							<div className="grid grid-cols-3 gap-2">
								<div className="space-y-1">
									<Label className="text-xs text-muted-foreground">
										{t("configuration_page.label_x")}
									</Label>
									<Input
										type="number"
										value={pearlMomentum.x}
										onChange={(e) =>
											setPearlMomentum({ ...pearlMomentum, x: e.target.value })
										}
										placeholder={errors.momentum_x}
										className={cn(
											"h-7 text-xs font-mono px-2 py-0 shadow-none",
											errors.momentum_x &&
												"border-destructive focus-visible:ring-destructive placeholder:text-destructive/60",
										)}
									/>
								</div>
								<div className="space-y-1">
									<Label className="text-xs text-muted-foreground">
										{t("configuration_page.label_y")}
									</Label>
									<Input
										type="number"
										value={draftConfig.pearl_y_motion}
										onChange={(e) => {
											setDraftConfig({
												...draftConfig,
												pearl_y_motion: e.target.value,
											});
											setPearlMomentum({ ...pearlMomentum, y: e.target.value });
										}}
										placeholder={errors.momentum_y}
										className={cn(
											"h-7 text-xs font-mono px-2 py-0 shadow-none",
											errors.momentum_y &&
												"border-destructive focus-visible:ring-destructive placeholder:text-destructive/60",
										)}
									/>
								</div>
								<div className="space-y-1">
									<Label className="text-xs text-muted-foreground">
										{t("configuration_page.label_z")}
									</Label>
									<Input
										type="number"
										value={pearlMomentum.z}
										onChange={(e) =>
											setPearlMomentum({ ...pearlMomentum, z: e.target.value })
										}
										placeholder={errors.momentum_z}
										className={cn(
											"h-7 text-xs font-mono px-2 py-0 shadow-none",
											errors.momentum_z &&
												"border-destructive focus-visible:ring-destructive placeholder:text-destructive/60",
										)}
									/>
								</div>
							</div>
							<p className="text-[0.8rem] text-muted-foreground">
								{t("configuration_page.pearl_momentum_desc")}
							</p>
						</div>

						{wizardMode === "Vector3D" ? (
							<div className="flex flex-col space-y-1.5">
								<Label>{t("configuration_page.max_vertical_tnt_label")}</Label>
								<Input
									type="number"
									value={draftConfig.max_vertical_tnt}
									onChange={(e) =>
										setDraftConfig({
											...draftConfig,
											max_vertical_tnt: e.target.value,
										})
									}
									onKeyDown={(e) => {
										if (e.key === "Tab" && !e.shiftKey) {
											e.preventDefault();
											onForceNext?.();
										}
									}}
									placeholder={errors.max_vertical_tnt}
									className={cn(
										"h-7 text-xs font-mono px-2 py-0 shadow-none",
										errors.max_vertical_tnt &&
											"border-destructive focus-visible:ring-destructive placeholder:text-destructive/60",
									)}
								/>
								<p className="text-[0.8rem] text-muted-foreground">
									{t("configuration_page.max_vertical_tnt_desc")}
								</p>
							</div>
						) : (
							<div className="flex flex-col space-y-1.5">
								<Label>{t("configuration_page.max_tnt_label")}</Label>
								<Input
									type="number"
									value={draftConfig.max_tnt}
									onChange={(e) =>
										setDraftConfig({ ...draftConfig, max_tnt: e.target.value })
									}
									onKeyDown={(e) => {
										if (e.key === "Tab" && !e.shiftKey) {
											e.preventDefault();
											onForceNext?.();
										}
									}}
									placeholder={errors.max_tnt}
									className={cn(
										"h-7 text-xs font-mono px-2 py-0 shadow-none",
										errors.max_tnt &&
											"border-destructive focus-visible:ring-destructive placeholder:text-destructive/60",
									)}
								/>
								<p className="text-[0.8rem] text-muted-foreground">
									{t("configuration_page.max_tnt_desc")}
								</p>
							</div>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
