import {
	ChevronsUpDown,
	ClipboardPaste,
	Copy,
	Download,
	FileJson,
	Pencil,
	Plus,
	RefreshCw,
	Upload,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useConfig } from "@/context/ConfigContext";
import { useConfigurationState } from "@/context/ConfigurationStateContext";
import { useConfigActions } from "@/hooks/use-config-actions";
import { setCalculatorTab } from "@/lib/calculator-tab";
import { usePluginState } from "@/plugins/store";

function configDisplayName(path: string) {
	return path
		.split(/[\\/]/)
		.pop()
		?.replace(/\.json$/i, "");
}

export function ConfigMenu() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { configPath, configData, bitTemplateConfig } = useConfig();
	const { calculationMode } = useConfigurationState();
	const actions = useConfigActions();
	const name = configDisplayName(configPath) || t("config_menu.unnamed");
	const bitCount = bitTemplateConfig?.SideMode;
	const pluginCount = usePluginState(
		(state) => state.plugins.length + state.dormant.length,
	);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button
					type="button"
					className="flex h-7 min-w-0 items-center gap-1.5 rounded-md border bg-background pr-2 pl-2.5 dark:bg-white/[0.06] text-[13px] font-medium shadow-xs hover:bg-accent"
				>
					<FileJson className="size-3.5 shrink-0 text-muted-foreground" />
					<span className="truncate">{name}</span>
					<ChevronsUpDown className="size-3 shrink-0 text-muted-foreground" />
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="w-72">
				<div className="flex flex-col gap-0.5 px-2 pt-2 pb-1.5">
					<span className="text-xs text-muted-foreground">
						{t("config_menu.current")}
					</span>
					<span className="truncate font-semibold">{name}</span>
					<span className="text-xs text-muted-foreground tabular-nums">
						{[
							t(`breadcrumb.mode.short.${calculationMode}`),
							t("config_menu.max_tnt", { count: configData.max_tnt }),
							bitCount
								? t("config_menu.bit_template", { count: bitCount })
								: null,
							pluginCount > 0
								? t("config_menu.plugins", { count: pluginCount })
								: null,
						]
							.filter(Boolean)
							.join(" · ")}
					</span>
				</div>
				<DropdownMenuItem onClick={() => setCalculatorTab("config")}>
					<Pencil />
					{t("config_menu.edit")}
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem onClick={actions.importFromFile}>
					<Upload />
					{t("config_menu.import_file")}
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => actions.importFromCode()}>
					<ClipboardPaste />
					{t("config_menu.paste_code")}
				</DropdownMenuItem>
				<DropdownMenuItem onClick={actions.exportJson}>
					<Download />
					{t("configuration_page.export_btn")}
				</DropdownMenuItem>
				<DropdownMenuItem onClick={actions.copyCode}>
					<Copy />
					{t("calculator.copy_code_tooltip")}
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem onClick={actions.changeConfig}>
					<RefreshCw />
					{t("config_menu.change")}
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => navigate("/configuration")}>
					<Plus />
					{t("config_menu.new")}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
