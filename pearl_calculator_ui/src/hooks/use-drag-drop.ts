import { getCurrentWindow } from "@tauri-apps/api/window";
import { readTextFile } from "@tauri-apps/plugin-fs";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router";
import { useCalculatorState } from "@/context/CalculatorStateContext";
import { useConfig } from "@/context/ConfigContext";
import { useConfigurationState } from "@/context/ConfigurationStateContext";
import { useToastNotifications } from "@/hooks/use-toast-notifications";
import { configToInputState } from "@/lib/bit-template-utils";
import { parseConfigurationContent } from "@/lib/config-service";
import { convertConfigToDraft } from "@/lib/config-utils";
import { isTauri } from "@/services";

export function useDragDrop() {
	const [isDragOver, setIsDragOver] = useState(false);
	const isProcessingRef = useRef(false);
	const { t } = useTranslation();
	const location = useLocation();
	const navigate = useNavigate();
	const { updateDefaultInput } = useCalculatorState();
	const { setConfigData, setHasConfig, setBitTemplateConfig } = useConfig();
	const {
		setDraftConfig,
		setCannonCenter,
		setPearlMomentum,
		setRedTNTLocation,
		setBitTemplateState,
		setIsWizardActive,
		setSavedPath,
	} = useConfigurationState();
	const { showSuccess, showError } = useToastNotifications();

	const locationRef = useRef(location);
	locationRef.current = location;

	const isOnConfigurationPage = location.pathname === "/configuration";

	const handleContentLoad = useCallback(
		async (content: string, path: string) => {
			try {
				const { config, bitTemplate } = parseConfigurationContent(
					content,
					path,
				);

				const currentlyOnConfigPage =
					locationRef.current.pathname === "/configuration";

				if (currentlyOnConfigPage) {
					const { draft, center, momentum, redLocation } =
						convertConfigToDraft(config);
					setDraftConfig(draft);
					setCannonCenter(center);
					setPearlMomentum(momentum);
					setRedTNTLocation(redLocation);

					const bitInput = configToInputState(bitTemplate);
					setBitTemplateState(bitInput);
					setSavedPath(path);
					setIsWizardActive(true);
					showSuccess(t("configuration_page.toast_imported"));
				} else {
					setConfigData(config);
					setBitTemplateConfig(bitTemplate);
					setHasConfig(true);

					updateDefaultInput("pearlX", config.pearl_x_position.toString());
					updateDefaultInput("pearlZ", config.pearl_z_position.toString());
					updateDefaultInput(
						"cannonY",
						Math.floor(config.pearl_y_position).toString(),
					);
					updateDefaultInput("offsetX", (config.offset_x ?? 0).toString());
					updateDefaultInput("offsetZ", (config.offset_z ?? 0).toString());

					showSuccess(t("calculator.toast_config_loaded"));
					if (locationRef.current.pathname !== "/") {
						navigate("/");
					}
				}
			} catch (e) {
				console.error("Parse error:", e);
				showError(t("error.calculator.import_failed"), e);
			}
		},
		[
			t,
			navigate,
			setDraftConfig,
			setCannonCenter,
			setPearlMomentum,
			setRedTNTLocation,
			setBitTemplateState,
			setSavedPath,
			setIsWizardActive,
			setConfigData,
			setBitTemplateConfig,
			setHasConfig,
			updateDefaultInput,
			showSuccess,
			showError,
		],
	);

	const handleTauriFileLoad = useCallback(
		async (path: string) => {
			if (isProcessingRef.current) return;
			isProcessingRef.current = true;

			try {
				const content = await readTextFile(path);
				await handleContentLoad(content, path);
			} catch (e) {
				console.error("File load error:", e);
				showError(t("error.calculator.import_failed"), e);
			} finally {
				isProcessingRef.current = false;
			}
		},
		[handleContentLoad, showError, t],
	);

	const handleWebFileDrop = useCallback(
		async (file: File) => {
			if (isProcessingRef.current) return;
			isProcessingRef.current = true;

			try {
				const content = await file.text();
				await handleContentLoad(content, file.name);
			} catch (e) {
				console.error("File load error:", e);
				showError(t("error.calculator.import_failed"), e);
			} finally {
				isProcessingRef.current = false;
			}
		},
		[handleContentLoad, showError, t],
	);

	const dismissOverlay = () => setIsDragOver(false);

	useEffect(() => {
		if (isTauri) {
			let unlisten: (() => void) | null = null;

			const setupListener = async () => {
				const appWindow = getCurrentWindow();

				unlisten = await appWindow.onDragDropEvent(async (event) => {
					if (event.payload.type === "enter" || event.payload.type === "over") {
						setIsDragOver(true);
					} else if (event.payload.type === "leave") {
						setIsDragOver(false);
					} else if (event.payload.type === "drop") {
						setIsDragOver(false);
						const paths = event.payload.paths;
						if (paths && paths.length > 0) {
							const path = paths[0];
							if (path.endsWith(".json")) {
								await handleTauriFileLoad(path);
							}
						}
					}
				});
			};

			setupListener();

			return () => {
				if (unlisten) {
					unlisten();
				}
			};
		} else {
			const handleDragOver = (e: DragEvent) => {
				e.preventDefault();
				setIsDragOver(true);
			};

			const handleDragLeave = (e: DragEvent) => {
				e.preventDefault();
				if (
					e.clientX === 0 ||
					e.clientY === 0 ||
					e.clientX >= window.innerWidth ||
					e.clientY >= window.innerHeight
				) {
					setIsDragOver(false);
				}
			};

			const handleDrop = async (e: DragEvent) => {
				e.preventDefault();
				setIsDragOver(false);

				const files = e.dataTransfer?.files;
				if (files && files.length > 0) {
					const file = files[0];
					if (file.name.endsWith(".json")) {
						await handleWebFileDrop(file);
					}
				}
			};

			window.addEventListener("dragover", handleDragOver);
			window.addEventListener("dragleave", handleDragLeave);
			window.addEventListener("drop", handleDrop);

			return () => {
				window.removeEventListener("dragover", handleDragOver);
				window.removeEventListener("dragleave", handleDragLeave);
				window.removeEventListener("drop", handleDrop);
			};
		}
	}, [handleTauriFileLoad, handleWebFileDrop]);

	return {
		isDragOver,
		isOnConfigurationPage,
		dismissOverlay,
	};
}
