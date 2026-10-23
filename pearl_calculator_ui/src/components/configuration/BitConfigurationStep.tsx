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
		<div className="flex flex-col gap-3">
			{hasValuesError && (
				<p className="text-sm font-medium text-destructive">
					{t("error.configuration_page.bit_values_error")}
				</p>
			)}
			{hasMasksError && (
				<p className="text-sm font-medium text-destructive">
					{t("error.configuration_page.bit_masks_error")}
				</p>
			)}
			<BitInputSection value={bitTemplateState} onChange={handleChange} />
		</div>
	);
}
