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
import { useMobileView } from "@/context/MobileViewContext";

export function PreviewStep() {
	const { draftConfig, cannonCenter, pearlMomentum, redTNTLocation } =
		useConfigurationState();
	const { t } = useTranslation();
	const { isMobile } = useMobileView();

	return (
		<div className="flex-1 flex items-center justify-center px-4 pb-4">
			<Card className="w-full max-w-[800px]">
				<CardHeader>
					<CardTitle>{t("configuration_page.preview_title")}</CardTitle>
					<CardDescription>
						{t("configuration_page.preview_desc")}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
						<div className="space-y-4">
							<Label className="text-base font-semibold">
								{t("configuration_page.basic_info_title")}
							</Label>
							<div className="grid grid-cols-2 gap-3">
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
							<div className="grid grid-cols-2 gap-3">
								<div className={`p-3 rounded-lg border bg-muted/50 overflow-hidden relative ${isMobile ? 'pb-8' : ''}`}>
									<div className="flex items-center gap-2 mb-2">
										<span className="text-sm font-bold">
											{t("configuration_page.nw_short")}
										</span>
										{!isMobile && redTNTLocation === "NorthWest" && (
											<Badge variant="destructive" className="h-5 px-1.5 text-[10px]">
												Red
											</Badge>
										)}
										{!isMobile && redTNTLocation === "SouthEast" && (
											<Badge className="h-5 px-1.5 text-[10px] bg-blue-600 hover:bg-blue-700">
												Blue
											</Badge>
										)}
									</div>
									<div className="flex flex-col gap-0.5 text-[11px] md:text-xs font-mono">
										<div className="text-muted-foreground truncate">
											X: <span className="text-foreground">{draftConfig.north_west_tnt.x}</span>
										</div>
										<div className="text-muted-foreground truncate">
											Y: <span className="text-foreground">{draftConfig.north_west_tnt.y}</span>
										</div>
										<div className="text-muted-foreground truncate">
											Z: <span className="text-foreground">{draftConfig.north_west_tnt.z}</span>
										</div>
									</div>
									{isMobile && redTNTLocation === "NorthWest" && (
										<Badge variant="destructive" className="absolute bottom-2 right-2 h-5 px-1.5 text-[10px]">
											Red
										</Badge>
									)}
									{isMobile && redTNTLocation === "SouthEast" && (
										<Badge className="absolute bottom-2 right-2 h-5 px-1.5 text-[10px] bg-blue-600 hover:bg-blue-700">
											Blue
										</Badge>
									)}
								</div>
								<div className={`p-3 rounded-lg border bg-muted/50 overflow-hidden relative ${isMobile ? 'pb-8' : ''}`}>
									<div className="flex items-center gap-2 mb-2">
										<span className="text-sm font-bold">
											{t("configuration_page.ne_short")}
										</span>
										{!isMobile && redTNTLocation === "NorthEast" && (
											<Badge variant="destructive" className="h-5 px-1.5 text-[10px]">
												Red
											</Badge>
										)}
										{!isMobile && redTNTLocation === "SouthWest" && (
											<Badge className="h-5 px-1.5 text-[10px] bg-blue-600 hover:bg-blue-700">
												Blue
											</Badge>
										)}
									</div>
									<div className="flex flex-col gap-0.5 text-[11px] md:text-xs font-mono">
										<div className="text-muted-foreground truncate">
											X: <span className="text-foreground">{draftConfig.north_east_tnt.x}</span>
										</div>
										<div className="text-muted-foreground truncate">
											Y: <span className="text-foreground">{draftConfig.north_east_tnt.y}</span>
										</div>
										<div className="text-muted-foreground truncate">
											Z: <span className="text-foreground">{draftConfig.north_east_tnt.z}</span>
										</div>
									</div>
									{isMobile && redTNTLocation === "NorthEast" && (
										<Badge variant="destructive" className="absolute bottom-2 right-2 h-5 px-1.5 text-[10px]">
											Red
										</Badge>
									)}
									{isMobile && redTNTLocation === "SouthWest" && (
										<Badge className="absolute bottom-2 right-2 h-5 px-1.5 text-[10px] bg-blue-600 hover:bg-blue-700">
											Blue
										</Badge>
									)}
								</div>
								<div className={`p-3 rounded-lg border bg-muted/50 overflow-hidden relative ${isMobile ? 'pb-8' : ''}`}>
									<div className="flex items-center gap-2 mb-2">
										<span className="text-sm font-bold">
											{t("configuration_page.sw_short")}
										</span>
										{!isMobile && redTNTLocation === "SouthWest" && (
											<Badge variant="destructive" className="h-5 px-1.5 text-[10px]">
												Red
											</Badge>
										)}
										{!isMobile && redTNTLocation === "NorthEast" && (
											<Badge className="h-5 px-1.5 text-[10px] bg-blue-600 hover:bg-blue-700">
												Blue
											</Badge>
										)}
									</div>
									<div className="flex flex-col gap-0.5 text-[11px] md:text-xs font-mono">
										<div className="text-muted-foreground truncate">
											X: <span className="text-foreground">{draftConfig.south_west_tnt.x}</span>
										</div>
										<div className="text-muted-foreground truncate">
											Y: <span className="text-foreground">{draftConfig.south_west_tnt.y}</span>
										</div>
										<div className="text-muted-foreground truncate">
											Z: <span className="text-foreground">{draftConfig.south_west_tnt.z}</span>
										</div>
									</div>
									{isMobile && redTNTLocation === "SouthWest" && (
										<Badge variant="destructive" className="absolute bottom-2 right-2 h-5 px-1.5 text-[10px]">
											Red
										</Badge>
									)}
									{isMobile && redTNTLocation === "NorthEast" && (
										<Badge className="absolute bottom-2 right-2 h-5 px-1.5 text-[10px] bg-blue-600 hover:bg-blue-700">
											Blue
										</Badge>
									)}
								</div>
								<div className={`p-3 rounded-lg border bg-muted/50 overflow-hidden relative ${isMobile ? 'pb-8' : ''}`}>
									<div className="flex items-center gap-2 mb-2">
										<span className="text-sm font-bold">
											{t("configuration_page.se_short")}
										</span>
										{!isMobile && redTNTLocation === "SouthEast" && (
											<Badge variant="destructive" className="h-5 px-1.5 text-[10px]">
												Red
											</Badge>
										)}
										{!isMobile && redTNTLocation === "NorthWest" && (
											<Badge className="h-5 px-1.5 text-[10px] bg-blue-600 hover:bg-blue-700">
												Blue
											</Badge>
										)}
									</div>
									<div className="flex flex-col gap-0.5 text-[11px] md:text-xs font-mono">
										<div className="text-muted-foreground truncate">
											X: <span className="text-foreground">{draftConfig.south_east_tnt.x}</span>
										</div>
										<div className="text-muted-foreground truncate">
											Y: <span className="text-foreground">{draftConfig.south_east_tnt.y}</span>
										</div>
										<div className="text-muted-foreground truncate">
											Z: <span className="text-foreground">{draftConfig.south_east_tnt.z}</span>
										</div>
									</div>
									{isMobile && redTNTLocation === "SouthEast" && (
										<Badge variant="destructive" className="absolute bottom-2 right-2 h-5 px-1.5 text-[10px]">
											Red
										</Badge>
									)}
									{isMobile && redTNTLocation === "NorthWest" && (
										<Badge className="absolute bottom-2 right-2 h-5 px-1.5 text-[10px] bg-blue-600 hover:bg-blue-700">
											Blue
										</Badge>
									)}
								</div>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
