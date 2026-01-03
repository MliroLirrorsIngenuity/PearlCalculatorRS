import { useTranslation } from "react-i18next";
import { preciseSubtract } from "@/lib/floating-point-utils";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useConfigurationState } from "@/context/ConfigurationStateContext";

export function PreviewStep() {
	const { draftConfig, cannonCenter, pearlMomentum, redTNTLocation } =
		useConfigurationState();
	const { t } = useTranslation();

	return (
		<div className="min-h-full flex items-center justify-center px-4 pb-4 pt-20">
			<Card className="w-auto min-w-[800px]">
				<CardHeader>
					<CardTitle>{t("configuration_page.preview_title")}</CardTitle>
					<CardDescription>
						{t("configuration_page.preview_desc")}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-2 gap-8">
						<div className="space-y-4">
							<Label className="text-base font-semibold">
								{t("configuration_page.basic_info_title")}
							</Label>
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2 p-3 rounded-lg border bg-muted/50 h-full min-h-[110px]">
									<div className="flex items-center justify-between mb-2">
										<span className="text-sm font-bold">
											{t("configuration_page.pearl_coord_label")}
										</span>
									</div>
									<div className="flex flex-col gap-1">
										<div className="text-xs text-muted-foreground font-mono">
											{t("configuration_page.label_x")}:{" "}
											<span className="text-foreground">
												{draftConfig.pearl_x_position}
											</span>
										</div>
										<div className="text-xs text-muted-foreground font-mono">
											{t("configuration_page.label_y")}:{" "}
											<span className="text-foreground">
												{draftConfig.pearl_y_position}
											</span>
										</div>
										<div className="text-xs text-muted-foreground font-mono">
											{t("configuration_page.label_z")}:{" "}
											<span className="text-foreground">
												{draftConfig.pearl_z_position}
											</span>
										</div>
									</div>
								</div>

								<div className="space-y-2 p-3 rounded-lg border bg-muted/50 h-full min-h-[110px]">
									<div className="flex items-center justify-between mb-2">
										<span className="text-sm font-bold">
											{t("configuration_page.pearl_momentum_label")}
										</span>
									</div>
									<div className="flex flex-col gap-1">
										<div className="text-xs text-muted-foreground font-mono">
											{t("configuration_page.label_x")}:{" "}
											<span className="text-foreground">{pearlMomentum.x}</span>
										</div>
										<div className="text-xs text-muted-foreground font-mono">
											{t("configuration_page.label_y")}:{" "}
											<span className="text-foreground">
												{draftConfig.pearl_y_motion}
											</span>
										</div>
										<div className="text-xs text-muted-foreground font-mono">
											{t("configuration_page.label_z")}:{" "}
											<span className="text-foreground">{pearlMomentum.z}</span>
										</div>
									</div>
								</div>

								<div className="space-y-2 p-3 rounded-lg border bg-muted/50 h-full min-h-[110px]">
									<div className="flex items-center justify-between mb-2">
										<span className="text-sm font-bold">
											{t("configuration_page.calculated_offset")}
										</span>
									</div>
									<div className="flex flex-col gap-1">
										<div className="text-xs text-muted-foreground font-mono">
											{t("configuration_page.label_x")}:{" "}
											<span className="text-foreground">
												{(() => {
													const val = preciseSubtract(
														parseFloat(draftConfig.pearl_x_position) || 0,
														parseFloat(cannonCenter.x) || 0,
													);
													return val > 0 ? `+${val}` : val;
												})()}
											</span>
										</div>
										<div className="text-xs text-muted-foreground font-mono">
											{t("configuration_page.label_z")}:{" "}
											<span className="text-foreground">
												{(() => {
													const val = preciseSubtract(
														parseFloat(draftConfig.pearl_z_position) || 0,
														parseFloat(cannonCenter.z) || 0,
													);
													return val > 0 ? `+${val}` : val;
												})()}
											</span>
										</div>
									</div>
								</div>

								<div className="space-y-2 p-3 rounded-lg border bg-muted/50 h-full min-h-[110px]">
									<div className="flex items-center justify-between mb-2">
										<span className="text-sm font-bold">
											{t("configuration_page.max_tnt_label")}
										</span>
									</div>
									<div className="text-sm font-medium font-mono text-muted-foreground">
										{t("configuration_page.label_amount")}:{" "}
										<span className="text-foreground">
											{draftConfig.max_tnt}
										</span>
									</div>
								</div>
							</div>
						</div>

						<div className="space-y-4">
							<Label className="text-base font-semibold">
								{t("configuration_page.tnt_config_title")}
							</Label>
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2 p-3 rounded-lg border bg-muted/50 h-full min-h-[110px]">
									<div className="flex items-center justify-between mb-2">
										<span className="text-sm font-bold">
											{t("configuration_page.nw_short")}
										</span>
										{redTNTLocation === "NorthWest" && (
											<Badge
												variant="destructive"
												className="h-5 px-1.5 text-[10px]"
											>
												{t("configuration_page.red_tnt_badge")}
											</Badge>
										)}
										{redTNTLocation === "SouthEast" && (
											<Badge className="h-5 px-1.5 text-[10px] bg-blue-600 hover:bg-blue-700">
												{t("configuration_page.color_blue")}
											</Badge>
										)}
									</div>
									<div className="flex flex-col gap-1">
										<div className="text-xs text-muted-foreground font-mono">
											{t("configuration_page.label_x")}:{" "}
											<span className="text-foreground">
												{draftConfig.north_west_tnt.x}
											</span>
										</div>
										<div className="text-xs text-muted-foreground font-mono">
											{t("configuration_page.label_y")}:{" "}
											<span className="text-foreground">
												{draftConfig.north_west_tnt.y}
											</span>
										</div>
										<div className="text-xs text-muted-foreground font-mono">
											{t("configuration_page.label_z")}:{" "}
											<span className="text-foreground">
												{draftConfig.north_west_tnt.z}
											</span>
										</div>
									</div>
								</div>
								<div className="space-y-2 p-3 rounded-lg border bg-muted/50 h-full min-h-[110px]">
									<div className="flex items-center justify-between mb-2">
										<span className="text-sm font-bold">
											{t("configuration_page.ne_short")}
										</span>
										{redTNTLocation === "NorthEast" && (
											<Badge
												variant="destructive"
												className="h-5 px-1.5 text-[10px]"
											>
												{t("configuration_page.red_tnt_badge")}
											</Badge>
										)}
										{redTNTLocation === "SouthWest" && (
											<Badge className="h-5 px-1.5 text-[10px] bg-blue-600 hover:bg-blue-700">
												{t("configuration_page.color_blue")}
											</Badge>
										)}
									</div>
									<div className="flex flex-col gap-1">
										<div className="text-xs text-muted-foreground font-mono">
											{t("configuration_page.label_x")}:{" "}
											<span className="text-foreground">
												{draftConfig.north_east_tnt.x}
											</span>
										</div>
										<div className="text-xs text-muted-foreground font-mono">
											{t("configuration_page.label_y")}:{" "}
											<span className="text-foreground">
												{draftConfig.north_east_tnt.y}
											</span>
										</div>
										<div className="text-xs text-muted-foreground font-mono">
											{t("configuration_page.label_z")}:{" "}
											<span className="text-foreground">
												{draftConfig.north_east_tnt.z}
											</span>
										</div>
									</div>
								</div>
								<div className="space-y-2 p-3 rounded-lg border bg-muted/50 h-full min-h-[110px]">
									<div className="flex items-center justify-between mb-2">
										<span className="text-sm font-bold">
											{t("configuration_page.sw_short")}
										</span>
										{redTNTLocation === "SouthWest" && (
											<Badge
												variant="destructive"
												className="h-5 px-1.5 text-[10px]"
											>
												{t("configuration_page.red_tnt_badge")}
											</Badge>
										)}
										{redTNTLocation === "NorthEast" && (
											<Badge className="h-5 px-1.5 text-[10px] bg-blue-600 hover:bg-blue-700">
												{t("configuration_page.color_blue")}
											</Badge>
										)}
									</div>
									<div className="flex flex-col gap-1">
										<div className="text-xs text-muted-foreground font-mono">
											{t("configuration_page.label_x")}:{" "}
											<span className="text-foreground">
												{draftConfig.south_west_tnt.x}
											</span>
										</div>
										<div className="text-xs text-muted-foreground font-mono">
											{t("configuration_page.label_y")}:{" "}
											<span className="text-foreground">
												{draftConfig.south_west_tnt.y}
											</span>
										</div>
										<div className="text-xs text-muted-foreground font-mono">
											{t("configuration_page.label_z")}:{" "}
											<span className="text-foreground">
												{draftConfig.south_west_tnt.z}
											</span>
										</div>
									</div>
								</div>
								<div className="space-y-2 p-3 rounded-lg border bg-muted/50 h-full min-h-[110px]">
									<div className="flex items-center justify-between mb-2">
										<span className="text-sm font-bold">
											{t("configuration_page.se_short")}
										</span>
										{redTNTLocation === "SouthEast" && (
											<Badge
												variant="destructive"
												className="h-5 px-1.5 text-[10px]"
											>
												{t("configuration_page.red_tnt_badge")}
											</Badge>
										)}
										{redTNTLocation === "NorthWest" && (
											<Badge className="h-5 px-1.5 text-[10px] bg-blue-600 hover:bg-blue-700">
												{t("configuration_page.color_blue")}
											</Badge>
										)}
									</div>
									<div className="flex flex-col gap-1">
										<div className="text-xs text-muted-foreground font-mono">
											{t("configuration_page.label_x")}:{" "}
											<span className="text-foreground">
												{draftConfig.south_east_tnt.x}
											</span>
										</div>
										<div className="text-xs text-muted-foreground font-mono">
											{t("configuration_page.label_y")}:{" "}
											<span className="text-foreground">
												{draftConfig.south_east_tnt.y}
											</span>
										</div>
										<div className="text-xs text-muted-foreground font-mono">
											{t("configuration_page.label_z")}:{" "}
											<span className="text-foreground">
												{draftConfig.south_east_tnt.z}
											</span>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
