import { useTranslation } from "react-i18next";
import { sectionLabelClass } from "@/components/common/Metric";
import { useConfigurationState } from "@/context/ConfigurationStateContext";
import { getOppositeDirection } from "@/lib/config-utils";
import { cn } from "@/lib/utils";

type Vec = { x: string | number; y: string | number; z: string | number };

function VectorCard({
	title,
	value,
	group,
}: {
	title: string;
	value: Vec;
	group?: { color: "red" | "blue"; label: string };
}) {
	return (
		<div className="flex flex-col gap-2 rounded-lg border p-3">
			<div className="flex items-center justify-between gap-2">
				<span className="text-[13px] font-medium">{title}</span>
				{group && (
					<span className="flex items-center gap-1.5 text-xs text-muted-foreground">
						<span
							className={cn(
								"size-2",
								group.color === "red"
									? "bg-red-600 dark:bg-red-400"
									: "bg-blue-600 dark:bg-blue-400",
							)}
						/>
						{group.label}
					</span>
				)}
			</div>
			<dl className="grid grid-cols-[16px_minmax(0,1fr)] gap-y-1 text-[13px] tabular-nums">
				{(["x", "y", "z"] as const).map((axis) => (
					<div key={axis} className="contents">
						<dt className="text-muted-foreground">{axis.toUpperCase()}</dt>
						<dd className="truncate">
							{value[axis] === "" ? "—" : value[axis]}
						</dd>
					</div>
				))}
			</dl>
		</div>
	);
}

export function PreviewStep() {
	const { draftConfig, redTNTLocation, wizardMode } = useConfigurationState();
	const { t } = useTranslation();
	const blueLocation = redTNTLocation
		? getOppositeDirection(redTNTLocation)
		: undefined;

	const groupOf = (location: string) =>
		location === redTNTLocation
			? { color: "red" as const, label: t("configuration_page.red_tnt_badge") }
			: location === blueLocation
				? { color: "blue" as const, label: t("configuration_page.color_blue") }
				: undefined;

	const limit =
		wizardMode === "Standard"
			? {
					label: t("configuration_page.max_tnt_label"),
					value: draftConfig.max_tnt,
				}
			: wizardMode === "Vector3D"
				? {
						label: t("configuration_page.max_vertical_tnt_label"),
						value: draftConfig.max_vertical_tnt,
					}
				: null;

	return (
		<div className="flex max-w-[640px] flex-col gap-6">
			<section className="flex flex-col gap-2">
				<span className={sectionLabelClass}>
					{t("configuration_page.basic_info_title")}
				</span>
				<div className="grid grid-cols-2 gap-3">
					<VectorCard
						title={t("configuration_page.pearl_coord_label")}
						value={{
							x: draftConfig.pearl_x_position,
							y: draftConfig.pearl_y_position,
							z: draftConfig.pearl_z_position,
						}}
					/>
					<VectorCard
						title={t("configuration_page.pearl_momentum_label")}
						value={{
							x: draftConfig.pearl_x_motion,
							y: draftConfig.pearl_y_motion,
							z: draftConfig.pearl_z_motion,
						}}
					/>
				</div>
				{limit && (
					<div className="flex items-baseline justify-between rounded-lg border px-3 py-2.5 text-[13px]">
						<span className="font-medium">{limit.label}</span>
						<span className="tabular-nums">{limit.value || "—"}</span>
					</div>
				)}
			</section>

			<section className="flex flex-col gap-2">
				<span className={sectionLabelClass}>
					{t("configuration_page.tnt_config_title")}
				</span>
				<div className="grid grid-cols-2 gap-3">
					<VectorCard
						title={t("configuration_page.nw_tnt")}
						value={draftConfig.north_west_tnt}
						group={groupOf("NorthWest")}
					/>
					<VectorCard
						title={t("configuration_page.ne_tnt")}
						value={draftConfig.north_east_tnt}
						group={groupOf("NorthEast")}
					/>
					<VectorCard
						title={t("configuration_page.sw_tnt")}
						value={draftConfig.south_west_tnt}
						group={groupOf("SouthWest")}
					/>
					<VectorCard
						title={t("configuration_page.se_tnt")}
						value={draftConfig.south_east_tnt}
						group={groupOf("SouthEast")}
					/>
					{wizardMode === "Vector3D" && (
						<VectorCard
							title={t("configuration_page.vertical_tnt")}
							value={draftConfig.vertical_tnt}
						/>
					)}
				</div>
			</section>
		</div>
	);
}
