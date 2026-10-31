import { BadgeInfo, Check, Monitor, Moon, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useConfig } from "@/context/ConfigContext";
import { useThemePreference } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";
import { AppInfo } from "./AppInfo";
import { LANGUAGES, PEARL_VERSIONS } from "./navigation";

const THEME_ICONS = { system: Monitor, light: Sun, dark: Moon };

const tileClass =
	"flex w-[52px] flex-col items-center justify-center rounded-lg border bg-background leading-tight dark:bg-white/[0.04] text-foreground transition-colors hover:bg-accent";

export function ThemeToggle({ className }: { className?: string }) {
	const { t } = useTranslation();
	const { preference, cyclePreference } = useThemePreference();
	const Icon = THEME_ICONS[preference];
	const label = t(`nav.theme_${preference}`);

	return (
		<button
			type="button"
			aria-label={`${t("nav.theme")}: ${label}`}
			onClick={cyclePreference}
			className={cn(tileClass, "h-10 gap-0.5", className)}
		>
			<Icon className="size-[15px]" />
			<span className="text-[9px] text-muted-foreground">{label}</span>
		</button>
	);
}

export function AboutTile({ className }: { className?: string }) {
	const { t } = useTranslation();

	return (
		<AppInfo>
			<button
				type="button"
				className={cn(tileClass, "h-10 gap-0.5", className)}
			>
				<BadgeInfo className="size-[15px]" />
				<span className="text-[9px] text-muted-foreground">
					{t("nav.about")}
				</span>
			</button>
		</AppInfo>
	);
}

export function VersionMenu({
	side = "right",
	className,
}: {
	side?: "right" | "top";
	className?: string;
}) {
	const { t } = useTranslation();
	const { version, setVersion } = useConfig();
	const current =
		PEARL_VERSIONS.find((v) => v.value === version) ?? PEARL_VERSIONS[0];

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button
					type="button"
					aria-label={`${t("nav.version")}: ${current.name}`}
					className={cn(tileClass, "h-10", className)}
				>
					<span className="text-[9px] text-muted-foreground">
						{t("nav.version")}
					</span>
					<span className="text-[11px] font-semibold tabular-nums">
						{current.short}
					</span>
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent side={side} align="end" className="min-w-48">
				<DropdownMenuLabel className="text-xs text-muted-foreground">
					{t("nav.version")}
				</DropdownMenuLabel>
				{PEARL_VERSIONS.map((v) => (
					<DropdownMenuItem key={v.value} onClick={() => setVersion(v.value)}>
						{v.name}
						{v.value === version && <Check className="ml-auto" />}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

export function LanguageMenu({
	side = "right",
	className,
}: {
	side?: "right" | "top";
	className?: string;
}) {
	const { t, i18n } = useTranslation();
	const current =
		LANGUAGES.find((l) => i18n.language.startsWith(l.code)) ?? LANGUAGES[1];

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button
					type="button"
					aria-label={`${t("nav.language")}: ${current.name}`}
					className={cn(tileClass, "h-8 text-xs font-semibold", className)}
				>
					{current.code === "zh" ? "中文" : "EN"}
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent side={side} align="end" className="min-w-40">
				<DropdownMenuLabel className="text-xs text-muted-foreground">
					{t("nav.language")}
				</DropdownMenuLabel>
				{LANGUAGES.map((language) => (
					<DropdownMenuItem
						key={language.code}
						onClick={() => i18n.changeLanguage(language.code)}
					>
						{language.name}
						{language.code === current.code && <Check className="ml-auto" />}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
