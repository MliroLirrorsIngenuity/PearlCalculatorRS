import { ArrowUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useConfigurationState } from "@/context/ConfigurationStateContext";
import { getOppositeDirection } from "@/lib/config-utils";
import { TNTInputGroup } from "./TNTInputGroup";

interface TNTConfigurationStepProps {
	errors: Record<string, string>;
}

const GROUPS = [
	{
		location: "NorthWest",
		key: "north_west_tnt",
		titleKey: "configuration_page.nw_tnt",
		xSign: "−",
		zSign: "−",
	},
	{
		location: "NorthEast",
		key: "north_east_tnt",
		titleKey: "configuration_page.ne_tnt",
		xSign: "+",
		zSign: "−",
	},
	{
		location: "SouthWest",
		key: "south_west_tnt",
		titleKey: "configuration_page.sw_tnt",
		xSign: "−",
		zSign: "+",
	},
	{
		location: "SouthEast",
		key: "south_east_tnt",
		titleKey: "configuration_page.se_tnt",
		xSign: "+",
		zSign: "+",
	},
] as const;

export function TNTConfigurationStep({ errors }: TNTConfigurationStepProps) {
	const { draftConfig, setDraftConfig, redTNTLocation, setRedTNTLocation } =
		useConfigurationState();
	const { t } = useTranslation();
	const blueLocation = redTNTLocation
		? getOppositeDirection(redTNTLocation)
		: undefined;

	return (
		<div className="flex max-w-[640px] flex-col gap-3">
			{errors.red_tnt_selection && (
				<p className="text-sm font-medium text-destructive">
					{t("error.configuration_page.red_tnt_error")}
				</p>
			)}
			<div className="relative grid grid-cols-2 gap-x-10 gap-y-4">
				<div
					aria-hidden="true"
					className="pointer-events-none absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-0.5 text-muted-foreground/60"
				>
					<span className="text-[11px] font-semibold">N</span>
					<ArrowUp className="size-4" />
				</div>
				{GROUPS.map((group, index) => (
					<TNTInputGroup
						key={group.location}
						title={t(group.titleKey)}
						data={draftConfig[group.key]}
						onUpdate={(axis, value) =>
							setDraftConfig({
								...draftConfig,
								[group.key]: { ...draftConfig[group.key], [axis]: value },
							})
						}
						isRedTNT={redTNTLocation === group.location}
						isBlueTNT={blueLocation === group.location}
						onSetRedTNT={() => setRedTNTLocation(group.location)}
						errors={{
							x: errors[`${group.key}_x`],
							y: errors[`${group.key}_y`],
							z: errors[`${group.key}_z`],
						}}
						hasError={!!errors.red_tnt_selection}
						xSign={group.xSign}
						zSign={group.zSign}
						inputIdX={index === 0 ? "tnt-config-start-input" : undefined}
					/>
				))}
			</div>
		</div>
	);
}
