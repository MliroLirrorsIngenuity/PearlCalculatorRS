import { useTranslation } from "react-i18next";
import { useConfigurationState } from "@/context/ConfigurationStateContext";
import { TNTInputGroup } from "./TNTInputGroup";

interface VerticalTNTStepProps {
	errors: Record<string, string>;
}

export function VerticalTNTStep({ errors }: VerticalTNTStepProps) {
	const { draftConfig, setDraftConfig } = useConfigurationState();
	const { t } = useTranslation();

	return (
		<div className="min-h-full flex flex-col items-center justify-center px-4 pb-4 pt-32 gap-8">
			<div className="text-center space-y-1.5 z-20">
				<h3 className="font-semibold leading-none tracking-tight">
					{t("configuration_page.vertical_tnt_config_title")}
				</h3>
				<p className="text-sm text-muted-foreground">
					{t("configuration_page.vertical_tnt_config_desc")}
				</p>
			</div>
			<div className="flex justify-center">
				<TNTInputGroup
					title={t("configuration_page.vertical_tnt")}
					data={draftConfig.vertical_tnt}
					onUpdate={(k, v) =>
						setDraftConfig({
							...draftConfig,
							vertical_tnt: { ...draftConfig.vertical_tnt, [k]: v },
						})
					}
					errors={{
						x: errors.vertical_tnt_x,
						y: errors.vertical_tnt_y,
						z: errors.vertical_tnt_z,
					}}
					inputIdX="vertical-tnt-config-start-input"
				/>
			</div>
		</div>
	);
}
