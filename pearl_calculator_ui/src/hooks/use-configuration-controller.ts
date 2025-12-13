import { save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import { revealItemInDir } from "@tauri-apps/plugin-opener";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useCalculatorState } from "@/context/CalculatorStateContext";
import { useConfig } from "@/context/ConfigContext";
import { useConfigurationState } from "@/context/ConfigurationStateContext";
import { inputStateToConfig } from "@/lib/bit-template-utils";
import type { BitDirection, GeneralConfig } from "@/types/domain";

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
	} = useConfigurationState();
	const { setConfigData, setHasConfig, setBitTemplateConfig } = useConfig();
	const { updateDefaultInput } = useCalculatorState();

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

	const convertDraftToConfig = (): GeneralConfig => {
		const cx = parseFloat(cannonCenter.x) || 0;
		const cz = parseFloat(cannonCenter.z) || 0;

		const getRelativeTNT = (tnt: { x: string; y: string; z: string }) => ({
			x: (parseFloat(tnt.x) || 0) - cx,
			y: parseFloat(tnt.y) || 0,
			z: (parseFloat(tnt.z) || 0) - cz,
		});

		const getOppositeDirection = (
			dir: string | undefined,
		): "SouthEast" | "NorthWest" | "SouthWest" | "NorthEast" => {
			switch (dir) {
				case "NorthWest":
					return "SouthEast";
				case "SouthEast":
					return "NorthWest";
				case "NorthEast":
					return "SouthWest";
				case "SouthWest":
					return "NorthEast";
				default:
					return "SouthEast";
			}
		};

		const redDir = redTNTLocation === "NorthWest" ? "NorthWest" : "SouthEast";

		return {
			north_east_tnt: getRelativeTNT(draftConfig.north_east_tnt),
			north_west_tnt: getRelativeTNT(draftConfig.north_west_tnt),
			south_east_tnt: getRelativeTNT(draftConfig.south_east_tnt),
			south_west_tnt: getRelativeTNT(draftConfig.south_west_tnt),
			pearl_x_position: 0,
			pearl_y_motion: parseFloat(draftConfig.pearl_y_motion) || 0,
			pearl_y_position: parseFloat(draftConfig.pearl_y_position) || 0,
			pearl_z_position: 0,
			max_tnt: parseFloat(draftConfig.max_tnt) || 0,
			default_red_tnt_position: redDir,
			default_blue_tnt_position: getOppositeDirection(redDir),
		};
	};

	const handleApplyToCalculator = () => {
		const config = convertDraftToConfig();

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
			const path = await save({
				filters: [
					{
						name: "JSON",
						extensions: ["json"],
					},
				],
			});

			if (path) {
				const cx = parseFloat(cannonCenter.x) || 0;
				const cz = parseFloat(cannonCenter.z) || 0;

				const getRelativeTNT = (tnt: { x: string; y: string; z: string }) => ({
					X: (parseFloat(tnt.x) || 0) - cx,
					Y: parseFloat(tnt.y) || 0,
					Z: (parseFloat(tnt.z) || 0) - cz,
				});

				const pearlX = parseFloat(draftConfig.pearl_x_position) || 0;
				const pearlZ = parseFloat(draftConfig.pearl_z_position) || 0;

				const getOppositeDirection = (dir: string | undefined) => {
					switch (dir) {
						case "NorthWest":
							return "SouthEast";
						case "SouthEast":
							return "NorthWest";
						case "NorthEast":
							return "SouthWest";
						case "SouthWest":
							return "NorthEast";
						default:
							return "SouthEast";
					}
				};

				const config: Record<string, unknown> = {
					NorthEastTNT: getRelativeTNT(draftConfig.north_east_tnt),
					NorthWestTNT: getRelativeTNT(draftConfig.north_west_tnt),
					SouthEastTNT: getRelativeTNT(draftConfig.south_east_tnt),
					SouthWestTNT: getRelativeTNT(draftConfig.south_west_tnt),
					Offset: {
						X: pearlX - cx,
						Z: pearlZ - cz,
					},
					Pearl: {
						Position: {
							X: 0,
							Y: parseFloat(draftConfig.pearl_y_position) || 0,
							Z: 0,
						},
						Motion: {
							X: parseFloat(pearlMomentum.x) || 0,
							Y: parseFloat(draftConfig.pearl_y_motion) || 0,
							Z: parseFloat(pearlMomentum.z) || 0,
						},
					},
					MaxTNT: parseFloat(draftConfig.max_tnt) || 0,
					DefaultRedTNTDirection: redTNTLocation,
					DefaultBlueTNTDirection: getOppositeDirection(redTNTLocation),
				};

				if (bitTemplateState) {
					config.SideMode = bitTemplateState.sideCount;
					const directionMasks: Record<string, BitDirection> = {};
					for (const mask of bitTemplateState.masks) {
						const key = mask.bits.join("");
						if (mask.direction) {
							directionMasks[key] = mask.direction as BitDirection;
						}
					}
					config.DirectionMasks = directionMasks;
					config.RedValues = bitTemplateState.sideValues
						.map((v) => parseInt(v, 10) || 0)
						.reverse();
					config.IsRedArrowCenter = bitTemplateState.isSwapped;
				}

				await writeTextFile(path, JSON.stringify(config, null, 2));
				setSavedPath(path);
				toast.success("Configuration exported successfully");
			}
		} catch (error) {
			console.error(error);
			toast.error("Failed to export configuration");
		}
	};

	const handleOpenFolder = async () => {
		if (savedPath) {
			try {
				await revealItemInDir(savedPath);
			} catch (error) {
				console.error(error);
				toast.error("Failed to open folder");
			}
		}
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
	};
}
