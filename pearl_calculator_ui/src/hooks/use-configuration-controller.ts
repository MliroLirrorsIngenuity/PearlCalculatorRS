import { match, P } from "ts-pattern";
import { revealItemInDir } from "@tauri-apps/plugin-opener";
import {
	WizardBasicInfoSchema,
	WizardBitConfigSchema,
	WizardTNTConfigSchema,
	WizardVerticalTNTSchema,
} from "@/lib/schemas";
import { z } from "zod";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useCalculatorState } from "@/context/CalculatorStateContext";
import { useConfig } from "@/context/ConfigContext";
import { useConfigurationState } from "@/context/ConfigurationStateContext";
import { useToastNotifications } from "@/hooks/use-toast-notifications";
import {
	configToInputState,
	inputStateToConfig,
} from "@/lib/bit-template-utils";
import {
	buildExportConfig,
	convertConfigToDraft,
	convertDraftToConfig,
} from "@/lib/config-utils";
import { exportConfiguration, loadConfiguration } from "@/lib/config-service";
import {
	decodeConfig,
	type EncodableConfig,
	encodeConfig,
} from "@/lib/config-codec";
import { isTauri } from "@/services";
import type { BitTemplateConfig, GeneralConfig } from "@/types/domain";

export const ERROR_MAPPINGS = [
	["cannonCenter.x", "cannon_x"],
	["cannonCenter.z", "cannon_z"],
	["pearlPosition.x", "pearl_x"],
	["pearlPosition.y", "pearl_y"],
	["pearlPosition.z", "pearl_z"],
	["pearlMomentum.x", "momentum_x"],
	["pearlMomentum.y", "momentum_y"],
	["pearlMomentum.z", "momentum_z"],
	["maxTNT", "max_tnt"],
	["northWest.x", "north_west_tnt_x"],
	["northWest.y", "north_west_tnt_y"],
	["northWest.z", "north_west_tnt_z"],
	["northEast.x", "north_east_tnt_x"],
	["northEast.y", "north_east_tnt_y"],
	["northEast.z", "north_east_tnt_z"],
	["southWest.x", "south_west_tnt_x"],
	["southWest.y", "south_west_tnt_y"],
	["southWest.z", "south_west_tnt_z"],
	["southEast.x", "south_east_tnt_x"],
	["southEast.y", "south_east_tnt_y"],
	["southEast.z", "south_east_tnt_z"],
	["redTNTLocation", "red_tnt_selection"],
	["verticalTNT.x", "vertical_tnt_x"],
	["verticalTNT.y", "vertical_tnt_y"],
	["verticalTNT.z", "vertical_tnt_z"],
] as const;

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
		savedPath,
		setSavedPath,
		calculationMode,
	} = useConfigurationState();
	const { setConfigData, setHasConfig, setBitTemplateConfig } = useConfig();
	const { updateDefaultInput } = useCalculatorState();
	const { showSuccess, showError } = useToastNotifications();

	const [shouldRestoreLastPage, setShouldRestoreLastPage] = useState(false);
	const [errors, setErrors] = useState<Record<string, string>>({});

	const validateStep = (step: number) => {
		let zodErrors: z.ZodIssue[] = [];

		const result = match(step)
			.with(1, () => ({ success: true, error: null }))
			.with(2, () =>
				WizardBasicInfoSchema.safeParse({
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
				}),
			)
			.with(3, () =>
				WizardTNTConfigSchema.safeParse({
					northWest: draftConfig.north_west_tnt,
					northEast: draftConfig.north_east_tnt,
					southWest: draftConfig.south_west_tnt,
					southEast: draftConfig.south_east_tnt,
					redTNTLocation,
				}),
			)
			.with(4, () => {
				if (calculationMode === "Vector3D") {
					return WizardVerticalTNTSchema.safeParse({
						verticalTNT: draftConfig.vertical_tnt,
					});
				}
				return WizardBitConfigSchema.safeParse({
					state: bitTemplateState,
					skipped: isBitConfigSkipped,
				});
			})
			.with(5, () => {
				if (calculationMode === "Vector3D") {
					return WizardBitConfigSchema.safeParse({
						state: bitTemplateState,
						skipped: isBitConfigSkipped,
					});
				}
				return { success: true, error: null };
			})
			.otherwise(() => ({ success: true, error: null }));

		if (!result.success && result.error) {
			zodErrors = result.error.issues;
		}

		if (zodErrors.length > 0) {
			const newErrors: Record<string, string> = {};
			zodErrors.forEach((issue) => {
				const path = issue.path.join(".");

				if (issue.message === "incomplete") {
					match(bitTemplateState)
						.with(
							P.nullish,
							() =>
								(newErrors.bit_template_empty = t(
									"error.configuration_page.validation.required",
								)),
						)
						.with(
							{
								sideValues: P.when((v) =>
									v.some((val) => !val || val.trim() === ""),
								),
							},
							() =>
								(newErrors.bit_values_incomplete = t(
									"error.configuration_page.validation.required",
								)),
						)
						.with(
							{ masks: P.when((m) => m.some((mask) => !mask.direction)) },
							() =>
								(newErrors.bit_masks_incomplete = t(
									"error.configuration_page.validation.required",
								)),
						)
						.otherwise(
							() =>
								(newErrors.bit_template_empty = t(
									"error.configuration_page.validation.required",
								)),
						);
					return;
				}

				const mapping = ERROR_MAPPINGS.find(([sub]) => path.includes(sub));
				if (mapping) {
					const [sub, errorKey] = mapping;
					newErrors[errorKey] = match(sub)
						.with("maxTNT", () =>
							t("error.configuration_page.validation.positive_integer"),
						)
						.with("redTNTLocation", () => "true")
						.otherwise(() => t("error.configuration_page.validation.required"));
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
		const lastStep = calculationMode === "Vector3D" ? 5 : 4;
		if (validateStep(lastStep)) {
			setIsFinished(true);
			setShouldRestoreLastPage(true);
		}
	};

	const handleApplyToCalculator = () => {
		const config = convertDraftToConfig(
			draftConfig,
			cannonCenter,
			redTNTLocation,
			calculationMode,
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
				calculationMode,
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
		path: string | null = null,
	) => {
		const { draft, center, momentum, redLocation } =
			convertConfigToDraft(config);
		setDraftConfig(draft);
		setCannonCenter(center);
		setPearlMomentum(momentum);
		setRedTNTLocation(redLocation);

		const bitInput = configToInputState(bitTemplate);
		setBitTemplateState(bitInput);

		setBitTemplateState(bitInput);

		if (path) {
			setSavedPath(path);
		} else {
			setSavedPath(null);
		}

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
		} catch (error) {
			console.error(error);
			showError(t("error.calculator.code_import_failed"), error);
		}
	};

	const handleImportFromFile = async () => {
		try {
			const result = await loadConfiguration();
			if (result) {
				hydrateWizard(result.config, result.bitTemplate, result.path);
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
				calculationMode,
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
