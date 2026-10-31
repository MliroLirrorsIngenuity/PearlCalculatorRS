import { AppWindow, Wrench } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router";
import { cn } from "@/lib/utils";
import { useToolLinks } from "@/plugins/tool-links";
import appIcon from "../../../src-tauri/icons/128x128.png";
import { AppInfo } from "./AppInfo";
import { LanguageMenu, ThemeToggle, VersionMenu } from "./AppSettingsControls";
import { NAV_ITEMS } from "./navigation";

const itemClass =
	"flex w-[58px] shrink-0 flex-col items-center justify-center gap-1 rounded-[10px] text-[11px] text-muted-foreground transition-colors hover:text-foreground";
const activeClass =
	"bg-background font-semibold text-foreground shadow-[0_0_0_1px_var(--color-border),0_1px_2px_rgba(0,0,0,0.06)] dark:bg-white/[0.1]";

export function AppRail() {
	const { t } = useTranslation();
	const { pathname } = useLocation();
	const tools = useToolLinks();

	return (
		<nav
			aria-label={t("nav.modules")}
			className="flex w-[72px] shrink-0 flex-col items-center gap-1.5 overflow-y-auto border-r bg-zinc-100 pt-[var(--safe-area-inset-top)] pb-[calc(0.75rem+var(--safe-area-inset-bottom))] pl-[var(--safe-area-inset-left)] [scrollbar-width:none] dark:bg-zinc-900/50"
		>
			<AppInfo className="mb-0.5 flex h-12 shrink-0 items-center pt-1">
				<button
					type="button"
					aria-label="Pearl Calculator RS"
					className="rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
				>
					<img src={appIcon} alt="" className="size-9" />
				</button>
			</AppInfo>
			{NAV_ITEMS.map(({ to, icon: Icon, labelKey }) => {
				const active = to === "/" ? pathname === to : pathname.startsWith(to);
				return (
					<Link
						key={to}
						to={to}
						aria-current={active ? "page" : undefined}
						className={cn(itemClass, "h-[54px]", active && activeClass)}
					>
						<Icon className="size-5" />
						{t(labelKey)}
					</Link>
				);
			})}
			{tools.length > 0 && (
				<span aria-hidden="true" className="my-0.5 h-px w-8 bg-border" />
			)}
			{tools.map(({ to, title, pluginName, kind }) => {
				const Icon = kind === "page" ? AppWindow : Wrench;
				const active = pathname === to;
				return (
					<Link
						key={to}
						to={to}
						title={`${title} · ${pluginName}`}
						aria-current={active ? "page" : undefined}
						className={cn(
							itemClass,
							"min-h-[54px] px-1 py-2",
							active && activeClass,
						)}
					>
						<Icon className="size-5 shrink-0" />
						<span className="line-clamp-2 text-center leading-tight break-all">
							{title}
						</span>
					</Link>
				);
			})}
			<div className="flex-1" />
			<ThemeToggle />
			<VersionMenu />
			<LanguageMenu />
		</nav>
	);
}
