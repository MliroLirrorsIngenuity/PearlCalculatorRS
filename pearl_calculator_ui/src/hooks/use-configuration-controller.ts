import { revealItemInDir } from "@tauri-apps/plugin-opener";
import { WizardBasicInfoSchema, WizardBitConfigSchema, WizardTNTConfigSchema } from "@/lib/schemas";
import { z } from "zod";
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
		let zodErrors: z.ZodIssue[] = [];

		if (step === 1) {
			const result = WizardBasicInfoSchema.safeParse({
				cannonCenter,
				pearlPosition: {
					x: draftConfig.pearl_x_position,
					y: draftConfig.pearl_y_position,
					z: draftConfig.pearl_z_position,
				},
				pearlMomentum: {
					x: pearlMomentum.x,
					y: draftConfig.pearl_y_motion,
					z: pearlMomentum.z,
				},
				maxTNT: draftConfig.max_tnt,
			});
			if (!result.success) zodErrors = result.error.issues;
		} else if (step === 2) {
			const result = WizardTNTConfigSchema.safeParse({
				northWest: draftConfig.north_west_tnt,
				northEast: draftConfig.north_east_tnt,
				southWest: draftConfig.south_west_tnt,
				southEast: draftConfig.south_east_tnt,
				redTNTLocation,
			});
			if (!result.success) zodErrors = result.error.issues;
		} else if (step === 3) {
			const result = WizardBitConfigSchema.safeParse({
				state: bitTemplateState,
				skipped: isBitConfigSkipped,
			});
			if (!result.success) zodErrors = result.error.issues;
		}

		if (zodErrors.length > 0) {
			const newErrors: Record<string, string> = {};
			zodErrors.forEach((issue) => {
				const path = issue.path.join(".");
				const msg = t("error.configuration_page.validation.required");

				if (path.includes("cannonCenter.x")) newErrors.cannon_x = msg;
				else if (path.includes("cannonCenter.z")) newErrors.cannon_z = msg;
				else if (path.includes("pearlPosition.x")) newErrors.pearl_x = msg;
				else if (path.includes("pearlPosition.y")) newErrors.pearl_y = msg;
				else if (path.includes("pearlPosition.z")) newErrors.pearl_z = msg;
				else if (path.includes("pearlMomentum.x")) newErrors.momentum_x = msg;
				else if (path.includes("pearlMomentum.y")) newErrors.momentum_y = msg;
				else if (path.includes("pearlMomentum.z")) newErrors.momentum_z = msg;
				else if (path.includes("maxTNT")) newErrors.max_tnt = t("error.configuration_page.validation.positive_integer");

				else if (path.includes("northWest.x")) newErrors.north_west_tnt_x = msg;
				else if (path.includes("northWest.y")) newErrors.north_west_tnt_y = msg;
				else if (path.includes("northWest.z")) newErrors.north_west_tnt_z = msg;
				else if (path.includes("northEast.x")) newErrors.north_east_tnt_x = msg;
				else if (path.includes("northEast.y")) newErrors.north_east_tnt_y = msg;
				else if (path.includes("northEast.z")) newErrors.north_east_tnt_z = msg;
				else if (path.includes("southWest.x")) newErrors.south_west_tnt_x = msg;
				else if (path.includes("southWest.y")) newErrors.south_west_tnt_y = msg;
				else if (path.includes("southWest.z")) newErrors.south_west_tnt_z = msg;
				else if (path.includes("southEast.x")) newErrors.south_east_tnt_x = msg;
				else if (path.includes("southEast.y")) newErrors.south_east_tnt_y = msg;
				else if (path.includes("southEast.z")) newErrors.south_east_tnt_z = msg;
				else if (path.includes("redTNTLocation")) newErrors.red_tnt_selection = "true";

				else if (issue.message === "incomplete") {
					const state = bitTemplateState;
					if (!state) newErrors.bit_template_empty = msg;
					else if (state.sideValues.some(v => !v || v.trim() === "")) newErrors.bit_values_incomplete = msg;
					else if (state.masks.some(m => !m.direction)) newErrors.bit_masks_incomplete = msg;
					else newErrors.bit_template_empty = msg;
				}
			});
			setErrors(newErrors);
			return false;
		}

		setErrors({});
		return true;
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
			showError(t("error.configuration_page.export_failed"));
		}
	};

	const handleOpenFolder = async () => {
		if (savedPath && isTauri) {
			try {
				await revealItemInDir(savedPath);
			} catch (error) {
				console.error(error);
				showError(t("error.configuration_page.open_folder_failed"));
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
				showError(t("error.calculator.clipboard_empty"));
				return;
			}
			const decoded = decodeConfig(text);
			hydrateWizard(decoded.generalConfig, decoded.bitTemplate);
			showSuccess(t("configuration_page.toast_imported"));
		} catch (error) {
			console.error(error);
			showError(t("error.calculator.code_import_failed"), error);
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
			showError(t("error.calculator.import_failed"));
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
			showError(t("error.configuration_page.copy_code_failed"));
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
