import { useTranslation } from "react-i18next";
import { useCalculatorState } from "@/context/CalculatorStateContext";
import { useConfig } from "@/context/ConfigContext";
import { useConfigurationState } from "@/context/ConfigurationStateContext";
import { useToastNotifications } from "@/hooks/use-toast-notifications";
import {
	buildEncodableConfig,
	decodeConfig,
	encodeConfig,
} from "@/lib/config-codec";
import { exportConfiguration, loadConfiguration } from "@/lib/config-service";
import { dispatchTauriAppStateAction } from "@/lib/tauri-app-state";
import { calculatorService, isTauri } from "@/services";
import type {
	BitTemplateConfig,
	GeneralConfig,
	MultiplierConfig,
} from "@/types/domain";

interface ImportedConfig {
	config: GeneralConfig;
	bitTemplate: BitTemplateConfig | null;
	multiplierTemplate: MultiplierConfig | null;
	path: string;
}

export function useConfigActions() {
	const { t } = useTranslation();
	const { showSuccess, showError } = useToastNotifications();
	const {
		configData,
		bitTemplateConfig,
		setConfigData,
		setConfigPath,
		setBitTemplateConfig,
		setMultiplierConfig,
		setHasConfig,
	} = useConfig();
	const { updateDefaultInput, updateDefaultTrace, updateBitCalculation } =
		useCalculatorState();
	const { setCalculationMode } = useConfigurationState();

	const applyConfig = async (imported: ImportedConfig) => {
		if (isTauri) {
			await dispatchTauriAppStateAction({
				type: "applyConfigToCalculator",
				config: imported.config,
				bitTemplate: imported.bitTemplate,
				multiplierTemplate: imported.multiplierTemplate,
				path: imported.path,
			});
			return;
		}
		setConfigData(imported.config);
		setConfigPath(imported.path);
		setBitTemplateConfig(imported.bitTemplate);
		setMultiplierConfig(imported.multiplierTemplate);
		setHasConfig(true);
		updateDefaultInput("pearlX", "0");
		updateDefaultInput("pearlZ", "0");
		updateDefaultInput(
			"cannonY",
			Math.floor(imported.config.pearl_y_position).toString(),
		);
		setCalculationMode(imported.config.mode ?? "Standard");
	};

	const importFromFile = async () => {
		try {
			const result = await loadConfiguration();
			if (!result) return;
			await applyConfig({
				config: result.config,
				bitTemplate: result.bitTemplate,
				multiplierTemplate: result.multiplierTemplate,
				path: result.path,
			});
			showSuccess(t("calculator.toast_config_loaded"));
		} catch (error) {
			console.error("Import error:", error);
			showError(t("error.calculator.load_failed"), error);
		}
	};

	const importFromCode = async (code?: string) => {
		try {
			const text = code ?? (await calculatorService.readFromClipboard());
			const decoded = decodeConfig(text.trim());
			await applyConfig({
				config: decoded.generalConfig,
				bitTemplate: decoded.bitTemplate,
				multiplierTemplate: null,
				path: "",
			});
			showSuccess(t("calculator.toast_code_imported"));
		} catch (error) {
			console.error("Import from code error:", error);
			showError(t("error.calculator.code_import_failed"), error);
		}
	};

	const copyCode = async () => {
		try {
			const encoded = encodeConfig(
				buildEncodableConfig(configData, bitTemplateConfig),
			);
			await calculatorService.copyToClipboard(encoded);
			showSuccess(t("configuration_page.toast_code_copied"));
		} catch (error) {
			console.error(error);
			showError(t("error.configuration_page.copy_code_failed"));
		}
	};

	const exportJson = async () => {
		try {
			await exportConfiguration(
				buildEncodableConfig(configData, bitTemplateConfig),
			);
			showSuccess(t("configuration_page.toast_exported"));
		} catch (error) {
			console.error(error);
			showError(t("error.configuration_page.export_failed"));
		}
	};

	const changeConfig = () => {
		updateBitCalculation({ show: false });
		updateDefaultTrace({ show: false });
		setHasConfig(false);
	};

	return { importFromFile, importFromCode, copyCode, exportJson, changeConfig };
}
