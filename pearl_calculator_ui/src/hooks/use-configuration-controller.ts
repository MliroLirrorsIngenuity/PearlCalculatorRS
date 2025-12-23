import { revealItemInDir } from "@tauri-apps/plugin-opener";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useCalculatorState } from "@/context/CalculatorStateContext";
import { useConfig } from "@/context/ConfigContext";
import { useConfigurationState } from "@/context/ConfigurationStateContext";
import { useToastNotifications } from "@/hooks/use-toast-notifications";
import { inputStateToConfig, configToInputState } from "@/lib/bit-template-utils";
import { buildExportConfig, convertDraftToConfig, convertConfigToDraft } from "@/lib/config-utils";
import { exportConfiguration, loadConfiguration } from "@/lib/config-service";
import { decodeConfig, encodeConfig, type EncodableConfig } from "@/lib/config-codec";
import { isTauri } from "@/services";
import type { BitTemplateConfig, GeneralConfig } from "@/types/domain";

export function useConfigurationController() {
	const navigate = useNavigate();
	const { t } = useTranslation();
	const {
		draftConfig,
		cannonCenter,
		pearlMomentum,
		redTNTLocation,
		bitTemplateState,
		resetDraft,
		isWizardActive,
		setIsWizardActive,
		isFinished,
		setIsFinished,
		setDraftConfig,
		setCannonCenter,
		setPearlMomentum,
		setRedTNTLocation,
		setBitTemplateState,
		isBitConfigSkipped,
		setIsBitConfigSkipped,
	} = useConfigurationState();
	const { setConfigData, setHasConfig, setBitTemplateConfig } = useConfig();
	const { updateDefaultInput } = useCalculatorState();
	const { showSuccess, showError } = useToastNotifications();

	const [savedPath, setSavedPath] = useState<string | null>(null);
	const [shouldRestoreLastPage, setShouldRestoreLastPage] = useState(false);
	const [errors, setErrors] = useState<Record<string, string>>({});

	const validateStep = (step: number) => {
		const newErrors: Record<string, string> = {};
		let isValid = true;

		if (step === 1) {
			if (!cannonCenter.x)
				newErrors.cannon_x = t("configuration_page.validation.required");
			if (!cannonCenter.z)
				newErrors.cannon_z = t("configuration_page.validation.required");
			if (!draftConfig.pearl_x_position)
				newErrors.pearl_x = t("configuration_page.validation.required");
			if (!draftConfig.pearl_y_position)
				newErrors.pearl_y = t("configuration_page.validation.required");
			if (!draftConfig.pearl_z_position)
				newErrors.pearl_z = t("configuration_page.validation.required");
			if (!pearlMomentum.x)
				newErrors.momentum_x = t("configuration_page.validation.required");
			if (!draftConfig.pearl_y_motion)
				newErrors.momentum_y = t("configuration_page.validation.required");
			if (!pearlMomentum.z)
				newErrors.momentum_z = t("configuration_page.validation.required");

			const maxTntVal = parseFloat(draftConfig.max_tnt);
			if (!draftConfig.max_tnt || Number.isNaN(maxTntVal) || maxTntVal <= 0)
				newErrors.max_tnt = t("configuration_page.validation.positive_integer");
		} else if (step === 2) {
			const blocks = [
				"north_west_tnt",
				"north_east_tnt",
				"south_west_tnt",
				"south_east_tnt",
			] as const;
			blocks.forEach((block) => {
				if (!draftConfig[block].x)
					newErrors[`${block}_x`] = t("configuration_page.validation.required");
				if (!draftConfig[block].y)
					newErrors[`${block}_y`] = t("configuration_page.validation.required");
				if (!draftConfig[block].z)
					newErrors[`${block}_z`] = t("configuration_page.validation.required");
			});
			if (!redTNTLocation) {
				newErrors.red_tnt_selection = "true";
				isValid = false;
			}
		} else if (step === 3) {
			if (isBitConfigSkipped) {
				return true;
			}
			if (!bitTemplateState) {
				newErrors.bit_template_empty = t(
					"configuration_page.validation.required",
				);
				isValid = false;
			} else {
				const hasEmptyValue = bitTemplateState.sideValues.some(
					(v) => !v || v.trim() === "",
				);
				if (hasEmptyValue) {
					newErrors.bit_values_incomplete = t(
						"configuration_page.validation.required",
					);
					isValid = false;
				}
				const hasEmptyMask = bitTemplateState.masks.some((m) => !m.direction);
				if (hasEmptyMask) {
					newErrors.bit_masks_incomplete = t(
						"configuration_page.validation.required",
					);
					isValid = false;
				}
			}
		}

		if (Object.keys(newErrors).length > 0) {
			setErrors(newErrors);
			isValid = false;
		} else {
			setErrors({});
		}

		return isValid;
	};

	const handleStart = () => {
		setIsWizardActive(true);
		setIsFinished(false);
		setSavedPath(null);
		setShouldRestoreLastPage(false);
	};

	const handleReset = () => {
		resetDraft();
		setIsFinished(false);
		setSavedPath(null);
		setShouldRestoreLastPage(false);
	};

	const handleFinish = () => {
		if (validateStep(3)) {
			setIsFinished(true);
			setShouldRestoreLastPage(true);
		}
	};

	const handleApplyToCalculator = () => {
		const config = convertDraftToConfig(
			draftConfig,
			cannonCenter,
			redTNTLocation,
		);

		updateDefaultInput("pearlX", "0");
		updateDefaultInput("pearlZ", "0");

		const cx = parseFloat(cannonCenter.x) || 0;
		const cz = parseFloat(cannonCenter.z) || 0;
		const px = parseFloat(draftConfig.pearl_x_position) || 0;
		const pz = parseFloat(draftConfig.pearl_z_position) || 0;

		updateDefaultInput("offsetX", (px - cx).toString());
		updateDefaultInput("offsetZ", (pz - cz).toString());

		const pearlY = parseFloat(draftConfig.pearl_y_position) || 0;
		updateDefaultInput("cannonY", Math.floor(pearlY).toString());

		setConfigData(config);
		setHasConfig(true);

		if (bitTemplateState) {
			setBitTemplateConfig(inputStateToConfig(bitTemplateState));
		}

		navigate("/");
	};

	const handleExport = async () => {
		try {
			const config = buildExportConfig(
				draftConfig,
				cannonCenter,
				pearlMomentum,
				redTNTLocation,
				bitTemplateState,
			);
			const path = await exportConfiguration(config);
			if (path) {
				setSavedPath(path);
				showSuccess(t("configuration_page.toast_exported"));
			}
		} catch (error) {
			console.error(error);
			showError(t("error.export_config"));
		}
	};

	const handleOpenFolder = async () => {
		if (savedPath && isTauri) {
			try {
				await revealItemInDir(savedPath);
			} catch (error) {
				console.error(error);
				showError(t("error.open_folder"));
			}
		}
	};

	const hydrateWizard = (
		config: GeneralConfig,
		bitTemplate: BitTemplateConfig | null,
	) => {
		const { draft, center, momentum, redLocation } = convertConfigToDraft(config);
		setDraftConfig(draft);
		setCannonCenter(center);
		setPearlMomentum(momentum);
		setRedTNTLocation(redLocation);

		const bitInput = configToInputState(bitTemplate);
		setBitTemplateState(bitInput);

		setIsWizardActive(true);
	};

	const handleImportFromClipboard = async () => {
		try {
			const { calculatorService } = await import("@/services");
			const text = await calculatorService.readFromClipboard();
			if (!text) {
				showError(t("error.clipboard_empty"));
				return;
			}
			const decoded = decodeConfig(text);
			hydrateWizard(decoded.generalConfig, decoded.bitTemplate);
			showSuccess(t("configuration_page.toast_imported"));
		} catch (error) {
			console.error(error);
			showError(t("calculator.toast_code_import_failed"), error);
		}
	};

	const handleImportFromFile = async () => {
		try {
			const result = await loadConfiguration();
			if (result) {
				hydrateWizard(result.config, result.bitTemplate);
				setSavedPath(result.path);
				showSuccess(t("configuration_page.toast_imported"));
			}
		} catch (error) {
			console.error(error);
			showError(t("error.import_failed"));
		}
	};

	const handleCopyEncodedConfig = async () => {
		try {
			const config = buildExportConfig(
				draftConfig,
				cannonCenter,
				pearlMomentum,
				redTNTLocation,
				bitTemplateState,
			);
			const encoded = encodeConfig(config as unknown as EncodableConfig);
			const { calculatorService } = await import("@/services");
			await calculatorService.copyToClipboard(encoded);
			showSuccess(t("configuration_page.toast_code_copied"));
		} catch (error) {
			console.error(error);
			showError(t("error.copy_code"));
		}
	};

	const handleSkipBitConfiguration = () => {
		setIsBitConfigSkipped(true);
	};

	return {
		isConfiguring: isWizardActive,
		isFinished,
		savedPath,
		shouldRestoreLastPage,
		setShouldRestoreLastPage,
		errors,
		validateStep,
		handleStart,
		handleReset,
		handleFinish,
		handleExport,
		handleOpenFolder,
		handleApplyToCalculator,
		handleCopyEncodedConfig,
		handleImportFromClipboard,
		handleImportFromFile,
		handleSkipBitConfiguration,
	};
}
