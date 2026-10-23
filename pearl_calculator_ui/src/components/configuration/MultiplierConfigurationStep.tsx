import { useTranslation } from "react-i18next";
import { MultiplierBitInputSection } from "@/components/calculator/MultiplierBitInputSection";
import { useConfigurationState } from "@/context/ConfigurationStateContext";
import type { MultiplierBitInputState } from "@/types/domain";

interface MultiplierConfigurationStepProps {
	errors: Record<string, string>;
}

export function MultiplierConfigurationStep({
	errors,
}: MultiplierConfigurationStepProps) {
	const { t } = useTranslation();
	const {
		multiplierBitState,
		setMultiplierBitState,
		setIsMultiplierConfigSkipped,
	} = useConfigurationState();

	const handleChange = (state: MultiplierBitInputState) => {
		setMultiplierBitState(state);
		setIsMultiplierConfigSkipped(false);
	};

	const hasValuesError =
		errors.multiplier_values_incomplete || errors.multiplier_template_empty;

	return (
		<div className="flex flex-col gap-3">
			{hasValuesError && (
				<p className="text-sm font-medium text-destructive">
					{t("error.configuration_page.multiplier_values_error")}
				</p>
			)}
			<MultiplierBitInputSection
				value={multiplierBitState}
				onChange={handleChange}
			/>
		</div>
	);
}
