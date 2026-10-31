import { ClipboardPaste, FileJson, Import, Upload } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useConfig } from "@/context/ConfigContext";
import { useToastNotifications } from "@/hooks/use-toast-notifications";
import { decodeConfig } from "@/lib/config-codec";
import { loadConfiguration } from "@/lib/config-service";
import { calculatorService } from "@/services";
import type { GeneralConfig, SimulatorConfig } from "@/types/domain";

function toSimulatorConfig(
	config: GeneralConfig,
	current: SimulatorConfig,
): SimulatorConfig {
	return {
		pearl: {
			pos: { x: 0, y: config.pearl_y_position, z: 0 },
			momentum: {
				x: config.pearl_x_motion,
				y: config.pearl_y_motion,
				z: config.pearl_z_motion,
			},
		},
		tntA: { ...current.tntA, pos: config.north_west_tnt },
		tntB: { ...current.tntB, pos: config.north_east_tnt },
		tntC: { ...current.tntC, pos: config.south_west_tnt },
		tntD: { ...current.tntD, pos: config.south_east_tnt },
	};
}

export function SimulatorImportMenu({
	config,
	onImport,
}: {
	config: SimulatorConfig;
	onImport: (config: SimulatorConfig) => void;
}) {
	const { t } = useTranslation();
	const { hasConfig, configData } = useConfig();
	const { showSuccess, showError } = useToastNotifications();

	const apply = (general: GeneralConfig) => {
		onImport(toSimulatorConfig(general, config));
		showSuccess(
			general.vertical_tnt
				? t("simulator.imported_without_vertical")
				: t("simulator.imported"),
		);
	};

	const fromFile = async () => {
		try {
			const result = await loadConfiguration();
			if (result) apply(result.config);
		} catch (error) {
			showError(t("error.calculator.load_failed"), error);
		}
	};

	const fromCode = async () => {
		try {
			const text = await calculatorService.readFromClipboard();
			apply(decodeConfig(text.replace(/\s+/g, "")).generalConfig);
		} catch (error) {
			showError(t("error.calculator.code_import_failed"), error);
		}
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline">
					<Import />
					{t("simulator.import")}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" side="top" className="w-60">
				<DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
					{t("simulator.import_hint")}
				</DropdownMenuLabel>
				<DropdownMenuItem
					disabled={!hasConfig}
					onClick={() => apply(configData)}
				>
					<FileJson />
					{t("config_menu.current")}
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem onClick={fromFile}>
					<Upload />
					{t("config_menu.import_file")}
				</DropdownMenuItem>
				<DropdownMenuItem onClick={fromCode}>
					<ClipboardPaste />
					{t("config_menu.paste_code")}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
