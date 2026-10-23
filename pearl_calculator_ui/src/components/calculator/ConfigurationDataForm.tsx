import { useTranslation } from "react-i18next";
import { AxisInput } from "@/components/common/AxisInput";
import { sectionLabelClass } from "@/components/common/Metric";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useConfigurationState } from "@/context/ConfigurationStateContext";
import { getOppositeDirection } from "@/lib/config-utils";
import { preciseAdd, preciseSubtract } from "@/lib/floating-point-utils";
import type { GeneralConfig } from "@/types/domain";

type Vec = { x: number; y: number; z: number };
type DirectionValue = "SouthEast" | "NorthWest" | "SouthWest" | "NorthEast";

const DIRECTION_OPTIONS = [
	{ value: "SouthEast", labelKey: "calculator.direction_se_short" },
	{ value: "NorthWest", labelKey: "calculator.direction_nw_short" },
	{ value: "SouthWest", labelKey: "calculator.direction_sw_short" },
	{ value: "NorthEast", labelKey: "calculator.direction_ne_short" },
] as const;

const blockLabelClass = "text-[13px] font-medium";
const toNumber = (value: string) => parseFloat(value) || 0;

function Section({
	title,
	aside,
	children,
}: {
	title: string;
	aside?: React.ReactNode;
	children: React.ReactNode;
}) {
	return (
		<section className="flex flex-col gap-2">
			<div className="flex items-baseline justify-between gap-2">
				<span className={sectionLabelClass}>{title}</span>
				{aside}
			</div>
			{children}
		</section>
	);
}

function VectorBlock({
	id,
	label,
	value,
	yOffset,
	onChange,
}: {
	id: string;
	label: string;
	value: Vec;
	yOffset: number;
	onChange: (value: Vec) => void;
}) {
	return (
		<div className="flex min-w-0 flex-col gap-1.5">
			<span className={blockLabelClass}>{label}</span>
			<AxisInput
				compact
				axis="X"
				id={`${id}-x`}
				value={value.x}
				onValueChange={(v) => onChange({ ...value, x: toNumber(v) })}
			/>
			<AxisInput
				compact
				axis="Y"
				id={`${id}-y`}
				value={value.y + yOffset}
				onValueChange={(v) =>
					onChange({ ...value, y: preciseSubtract(toNumber(v), yOffset) })
				}
			/>
			<AxisInput
				compact
				axis="Z"
				id={`${id}-z`}
				value={value.z}
				onValueChange={(v) => onChange({ ...value, z: toNumber(v) })}
			/>
		</div>
	);
}

function DirectionSelect({
	label,
	value,
	onChange,
}: {
	label: string;
	value: DirectionValue;
	onChange: (value: DirectionValue) => void;
}) {
	const { t } = useTranslation();
	return (
		<div className="flex min-w-0 items-center gap-2">
			<span className="shrink-0 text-[13px] font-medium">{label}</span>
			<Select value={value} onValueChange={onChange}>
				<SelectTrigger size="sm" className="h-8 min-w-0 flex-1 text-[13px]">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					{DIRECTION_OPTIONS.map((option) => (
						<SelectItem key={option.value} value={option.value}>
							{t(option.labelKey)}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
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
	const { calculationMode } = useConfigurationState();
	const baseY = Math.floor(config.pearl_y_position);
	const yOffset = preciseSubtract(parseFloat(cannonYDisplay) || baseY, baseY);

	const update = (patch: Partial<GeneralConfig>) =>
		onConfigChange({ ...config, ...patch });

	const updatePearlY = (value: string) => {
		const newPearlY = preciseSubtract(toNumber(value), yOffset);
		const oldBaseY = Math.floor(config.pearl_y_position);
		const diff = Math.floor(newPearlY) - oldBaseY;
		if (diff !== 0) {
			const currentCannonY = parseFloat(cannonYDisplay) || oldBaseY;
			onCannonYChange(preciseAdd(currentCannonY, diff).toString());
		}
		update({ pearl_y_position: newPearlY });
	};

	const tntRows = [
		{ key: "north_west_tnt", label: t("calculator.direction_badge_nw") },
		{ key: "north_east_tnt", label: t("calculator.direction_badge_ne") },
		{ key: "south_west_tnt", label: t("calculator.direction_badge_sw") },
		{ key: "south_east_tnt", label: t("calculator.direction_badge_se") },
	] as const;

	return (
		<ScrollArea className="h-full">
			<div className="flex flex-col gap-5 pt-1 pr-3 pb-4 pl-1">
				<Section
					title={t("calculator.tnt_positions")}
					aside={
						yOffset !== 0 && (
							<span className="text-xs text-muted-foreground tabular-nums">
								{t("calculator.y_offset", {
									offset: (yOffset > 0 ? "+" : "") + yOffset,
								})}
							</span>
						)
					}
				>
					<div className="grid grid-cols-2 gap-x-3 gap-y-3">
						{tntRows.map(({ key, label }) => (
							<VectorBlock
								key={key}
								id={key}
								label={label}
								value={config[key]}
								yOffset={yOffset}
								onChange={(value) => update({ [key]: value })}
							/>
						))}
						{calculationMode === "Vector3D" && (
							<VectorBlock
								id="vertical_tnt"
								label={t("calculator.vertical_short")}
								value={config.vertical_tnt ?? { x: 0, y: 0, z: 0 }}
								yOffset={yOffset}
								onChange={(value) => update({ vertical_tnt: value })}
							/>
						)}
					</div>
				</Section>

				<Section title={t("calculator.pearl_properties")}>
					<div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
						<AxisInput
							compact
							axis="Y"
							id="pearl-y"
							value={config.pearl_y_position + yOffset}
							onValueChange={updatePearlY}
						/>
						<AxisInput
							compact
							axis="VX"
							id="pearl-mx"
							value={config.pearl_x_motion ?? 0}
							onValueChange={(v) => update({ pearl_x_motion: toNumber(v) })}
						/>
						<AxisInput
							compact
							axis="VY"
							id="pearl-my"
							value={config.pearl_y_motion}
							onValueChange={(v) => update({ pearl_y_motion: toNumber(v) })}
						/>
						<AxisInput
							compact
							axis="VZ"
							id="pearl-mz"
							value={config.pearl_z_motion ?? 0}
							onValueChange={(v) => update({ pearl_z_motion: toNumber(v) })}
						/>
					</div>
				</Section>

				{calculationMode === "Standard" && (
					<Section title={t("calculator.max_tnt")}>
						<div className="grid grid-cols-2 gap-x-3">
							<AxisInput
								compact
								axis="#"
								id="max-tnt"
								value={config.max_tnt}
								onValueChange={(v) => update({ max_tnt: toNumber(v) })}
							/>
						</div>
					</Section>
				)}
				{calculationMode === "Vector3D" && (
					<Section title={t("configuration_page.max_vertical_tnt_label")}>
						<div className="grid grid-cols-2 gap-x-3">
							<AxisInput
								compact
								axis="#"
								id="max-vertical-tnt"
								value={config.max_vertical_tnt ?? 0}
								onValueChange={(v) =>
									update({
										max_vertical_tnt: Number.isNaN(parseFloat(v))
											? undefined
											: parseFloat(v),
									})
								}
							/>
						</div>
					</Section>
				)}

				<Section title={t("calculator.default_positions")}>
					<div className="grid grid-cols-2 gap-3">
						<DirectionSelect
							label={t("calculator.color_blue")}
							value={config.default_blue_tnt_position}
							onChange={(value) =>
								update({
									default_blue_tnt_position: value,
									default_red_tnt_position: getOppositeDirection(value),
								})
							}
						/>
						<DirectionSelect
							label={t("calculator.color_red")}
							value={config.default_red_tnt_position}
							onChange={(value) =>
								update({
									default_red_tnt_position: value,
									default_blue_tnt_position: getOppositeDirection(value),
								})
							}
						/>
					</div>
				</Section>
			</div>
		</ScrollArea>
	);
}
