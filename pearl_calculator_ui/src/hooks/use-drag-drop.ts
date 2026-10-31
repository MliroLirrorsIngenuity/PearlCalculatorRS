import { getCurrentWindow } from "@tauri-apps/api/window";
import { readTextFile } from "@tauri-apps/plugin-fs";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router";
import { useConfig } from "@/context/ConfigContext";
import { useConfigActions } from "@/hooks/use-config-actions";
import { useWizardImport } from "@/hooks/use-configuration-controller";
import { useToastNotifications } from "@/hooks/use-toast-notifications";
import {
	configExtensions,
	extensionOf,
	importConfigurationContent,
	PLUGIN_EXTENSIONS,
} from "@/lib/config-service";
import { attachPlugin } from "@/plugins/config-plugins";
import { noticeWizardPlugins, toastPluginError } from "@/plugins/errors";
import { setWizardPlugins } from "@/plugins/store";
import { isTauri } from "@/services";

function isAcceptedFile(path: string) {
	const extension = extensionOf(path);
	return (
		PLUGIN_EXTENSIONS.includes(extension) ||
		configExtensions().includes(extension)
	);
}

export function useDragDrop() {
	const [isDragOver, setIsDragOver] = useState(false);
	const isProcessingRef = useRef(false);
	const { t } = useTranslation();
	const location = useLocation();
	const navigate = useNavigate();
	const { hasConfig } = useConfig();
	const hasConfigRef = useRef(hasConfig);
	hasConfigRef.current = hasConfig;
	const { applyConfig } = useConfigActions();
	const importToWizard = useWizardImport();
	const importers = useRef({ applyConfig, importToWizard });
	importers.current = { applyConfig, importToWizard };
	const { showSuccess, showError } = useToastNotifications();

	const locationRef = useRef(location);
	locationRef.current = location;

	const isOnConfigurationPage = location.pathname === "/configuration";

	const handleContentLoad = useCallback(
		async (content: string, path: string) => {
			try {
				const imported = await importConfigurationContent(content, path);
				if (locationRef.current.pathname === "/configuration") {
					setWizardPlugins(imported.plugins);
					noticeWizardPlugins(imported.plugins.length);
					importers.current.importToWizard(
						imported.config,
						imported.bitTemplate,
						path,
						imported.multiplierTemplate,
					);
					showSuccess(t("configuration_page.toast_imported"));
					return;
				}
				await importers.current.applyConfig(imported);
				showSuccess(t("calculator.toast_config_loaded"));
				if (locationRef.current.pathname !== "/") {
					navigate("/");
				}
			} catch (e) {
				console.error("Parse error:", e);
				showError(t("error.calculator.import_failed"), e);
			}
		},
		[t, navigate, showSuccess, showError],
	);

	const handleFileContent = useCallback(
		async (content: string, path: string) => {
			if (PLUGIN_EXTENSIONS.includes(extensionOf(path))) {
				if (!hasConfigRef.current) {
					showError(t("plugins.toast_need_config"));
					return;
				}
				try {
					const record = await attachPlugin(content);
					showSuccess(
						t("plugins.toast_attached", { name: record.manifest.name }),
					);
				} catch (e) {
					toastPluginError(t("plugins.toast_load_failed"), e);
				}
				return;
			}
			await handleContentLoad(content, path);
		},
		[handleContentLoad, showError, showSuccess, t],
	);

	const handleTauriFileLoad = useCallback(
		async (path: string) => {
			if (isProcessingRef.current) return;
			isProcessingRef.current = true;

			try {
				const content = await readTextFile(path);
				await handleFileContent(content, path);
			} catch (e) {
				console.error("File load error:", e);
				showError(t("error.calculator.import_failed"), e);
			} finally {
				isProcessingRef.current = false;
			}
		},
		[handleFileContent, showError, t],
	);

	const handleWebFileDrop = useCallback(
		async (file: File) => {
			if (isProcessingRef.current) return;
			isProcessingRef.current = true;

			try {
				const content = await file.text();
				await handleFileContent(content, file.name);
			} catch (e) {
				console.error("File load error:", e);
				showError(t("error.calculator.import_failed"), e);
			} finally {
				isProcessingRef.current = false;
			}
		},
		[handleFileContent, showError, t],
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
							if (isAcceptedFile(path)) {
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
					if (isAcceptedFile(file.name)) {
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
