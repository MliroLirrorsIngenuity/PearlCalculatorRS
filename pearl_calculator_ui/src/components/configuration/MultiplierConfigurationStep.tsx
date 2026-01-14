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
		<div className="h-full min-h-[500px] flex flex-col items-center justify-center px-4 pb-4 gap-6">
			<div className="text-center space-y-1.5">
				<h3 className="font-semibold leading-none tracking-tight">
					{t("configuration_page.multiplier_config_title")}
				</h3>
				<p className="text-sm text-muted-foreground">
					{t("configuration_page.multiplier_config_desc")}
				</p>
				{hasValuesError && (
					<p className="text-sm text-destructive font-medium animate-in fade-in slide-in-from-top-1">
						{t("error.configuration_page.multiplier_values_error")}
					</p>
				)}
			</div>
			<div className="w-full">
				<MultiplierBitInputSection
					value={multiplierBitState}
					onChange={handleChange}
				/>
			</div>
		</div>
	);
}
