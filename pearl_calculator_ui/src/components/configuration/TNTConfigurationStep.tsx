import { useTranslation } from "react-i18next";
import { useConfigurationState } from "@/context/ConfigurationStateContext";
import { TNTInputGroup } from "./TNTInputGroup";

interface TNTConfigurationStepProps {
	errors: Record<string, string>;
}

export function TNTConfigurationStep({ errors }: TNTConfigurationStepProps) {
	const { draftConfig, setDraftConfig, redTNTLocation, setRedTNTLocation } =
		useConfigurationState();
	const { t } = useTranslation();

	const handleSetRedTNT = (location: string) => {
		setRedTNTLocation(location);
	};

	return (
		<div className="min-h-full flex flex-col items-center justify-center px-4 pb-4 pt-20 gap-8">
			<div className="text-center space-y-1.5 z-20">
				<h3 className="font-semibold leading-none tracking-tight">
					{t("configuration_page.tnt_config_title")}
				</h3>
				<p className="text-sm text-muted-foreground">
					{t("configuration_page.tnt_config_desc")}
				</p>
				{errors.red_tnt_selection && (
					<p className="text-sm text-destructive font-medium animate-in fade-in slide-in-from-top-1">
						{t("error.configuration_page.red_tnt_error")}
					</p>
				)}
			</div>
			<div className="w-fit min-w-[580px] mx-auto">
				<div className="relative pb-2">
					<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center gap-1 text-muted-foreground/20 pointer-events-none z-0">
						<span className="text-xs font-black tracking-widest">N</span>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
							className="h-12 w-12"
						>
							<path d="M12 21V6" />
							<path d="m7 9 5-6 5 6" />
						</svg>
					</div>

					<div className="grid grid-cols-2 gap-6 md:gap-12 z-10">
						<TNTInputGroup
							title={t("configuration_page.nw_tnt")}
							data={draftConfig.north_west_tnt}
							onUpdate={(k, v) =>
								setDraftConfig({
									...draftConfig,
									north_west_tnt: { ...draftConfig.north_west_tnt, [k]: v },
								})
							}
							isRedTNT={redTNTLocation === "NorthWest"}
							onSetRedTNT={() => handleSetRedTNT("NorthWest")}
							errors={{
								x: errors.north_west_tnt_x,
								y: errors.north_west_tnt_y,
								z: errors.north_west_tnt_z,
							}}
							hasError={!!errors.red_tnt_selection}
							xSign="-"
							zSign="-"
							inputIdX="tnt-config-start-input"
						/>
						<TNTInputGroup
							title={t("configuration_page.ne_tnt")}
							data={draftConfig.north_east_tnt}
							onUpdate={(k, v) =>
								setDraftConfig({
									...draftConfig,
									north_east_tnt: { ...draftConfig.north_east_tnt, [k]: v },
								})
							}
							isRedTNT={redTNTLocation === "NorthEast"}
							onSetRedTNT={() => handleSetRedTNT("NorthEast")}
							errors={{
								x: errors.north_east_tnt_x,
								y: errors.north_east_tnt_y,
								z: errors.north_east_tnt_z,
							}}
							hasError={!!errors.red_tnt_selection}
							xSign="+"
							zSign="-"
						/>
						<TNTInputGroup
							title={t("configuration_page.sw_tnt")}
							data={draftConfig.south_west_tnt}
							onUpdate={(k, v) =>
								setDraftConfig({
									...draftConfig,
									south_west_tnt: { ...draftConfig.south_west_tnt, [k]: v },
								})
							}
							isRedTNT={redTNTLocation === "SouthWest"}
							onSetRedTNT={() => handleSetRedTNT("SouthWest")}
							errors={{
								x: errors.south_west_tnt_x,
								y: errors.south_west_tnt_y,
								z: errors.south_west_tnt_z,
							}}
							hasError={!!errors.red_tnt_selection}
							xSign="-"
							zSign="+"
						/>
						<TNTInputGroup
							title={t("configuration_page.se_tnt")}
							data={draftConfig.south_east_tnt}
							onUpdate={(k, v) =>
								setDraftConfig({
									...draftConfig,
									south_east_tnt: { ...draftConfig.south_east_tnt, [k]: v },
								})
							}
							isRedTNT={redTNTLocation === "SouthEast"}
							onSetRedTNT={() => handleSetRedTNT("SouthEast")}
							errors={{
								x: errors.south_east_tnt_x,
								y: errors.south_east_tnt_y,
								z: errors.south_east_tnt_z,
							}}
							hasError={!!errors.red_tnt_selection}
							xSign="+"
							zSign="+"
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
