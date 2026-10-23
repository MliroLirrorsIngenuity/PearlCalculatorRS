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
		<TNTInputGroup
			className="max-w-[300px]"
			title={t("configuration_page.vertical_tnt")}
			data={draftConfig.vertical_tnt}
			onUpdate={(axis, value) =>
				setDraftConfig({
					...draftConfig,
					vertical_tnt: { ...draftConfig.vertical_tnt, [axis]: value },
				})
			}
			errors={{
				x: errors.vertical_tnt_x,
				y: errors.vertical_tnt_y,
				z: errors.vertical_tnt_z,
			}}
			inputIdX="vertical-tnt-config-start-input"
		/>
	);
}
