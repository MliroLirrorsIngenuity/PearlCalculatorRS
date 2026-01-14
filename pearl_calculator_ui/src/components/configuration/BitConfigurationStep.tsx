import { useTranslation } from "react-i18next";
import { BitInputSection } from "@/components/calculator/BitInputSection";
import { useConfigurationState } from "@/context/ConfigurationStateContext";
import type { BitInputState } from "@/types/domain";

interface BitConfigurationStepProps {
	errors: Record<string, string>;
}

export function BitConfigurationStep({ errors }: BitConfigurationStepProps) {
	const { t } = useTranslation();
	const { bitTemplateState, setBitTemplateState, setIsBitConfigSkipped } =
		useConfigurationState();

	const handleChange = (state: BitInputState) => {
		setBitTemplateState(state);
		setIsBitConfigSkipped(false);
	};

	const hasValuesError =
		errors.bit_values_incomplete || errors.bit_template_empty;
	const hasMasksError = errors.bit_masks_incomplete;

	return (
		<div className="flex-1 flex flex-col items-center justify-center px-4 pb-4 gap-6">
			<div className="text-center space-y-1.5">
				<h3 className="font-semibold leading-none tracking-tight">
					{t("configuration_page.bit_config_title")}
				</h3>
				<p className="text-sm text-muted-foreground">
					{t("configuration_page.bit_config_desc")}
				</p>
				{(hasValuesError || hasMasksError) && (
					<div className="space-y-1">
						{hasValuesError && (
							<p className="text-sm text-destructive font-medium animate-in fade-in slide-in-from-top-1">
								{t("error.configuration_page.bit_values_error")}
							</p>
						)}
						{hasMasksError && (
							<p className="text-sm text-destructive font-medium animate-in fade-in slide-in-from-top-1">
								{t("error.configuration_page.bit_masks_error")}
							</p>
						)}
					</div>
				)}
			</div>
			<div className="w-full">
				<BitInputSection value={bitTemplateState} onChange={handleChange} />
			</div>
		</div>
	);
}
