import { AppWindow, Settings, Wrench } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useToolLinks } from "@/plugins/tool-links";
import {
	AboutTile,
	LanguageMenu,
	ThemeToggle,
	VersionMenu,
} from "./AppSettingsControls";
import { NAV_ITEMS } from "./navigation";

const isActive = (pathname: string, to: string) =>
	to === "/" ? pathname === to : pathname.startsWith(to);

const tabClass =
	"flex flex-col items-center justify-center gap-0.5 text-[11px] text-muted-foreground";

export function MobileTabBar() {
	const { t } = useTranslation();
	const { pathname } = useLocation();
	const tools = useToolLinks();

	return (
		<nav
			aria-label={t("nav.modules")}
			className="grid shrink-0 border-t bg-background px-2 pt-1.5 pb-[max(var(--safe-area-inset-bottom),0.5rem)]"
			style={{
				gridTemplateColumns: `repeat(${NAV_ITEMS.length + tools.length + 1}, minmax(0, 1fr))`,
			}}
		>
			{NAV_ITEMS.map(({ to, icon: Icon, labelKey }) => (
				<Link
					key={to}
					to={to}
					aria-current={isActive(pathname, to) ? "page" : undefined}
					className={cn(
						tabClass,
						"h-12",
						isActive(pathname, to) && "font-semibold text-foreground",
					)}
				>
					<Icon className="size-[22px]" />
					{t(labelKey)}
				</Link>
			))}
			{tools.map(({ to, title, kind }) => (
				<Link
					key={to}
					to={to}
					aria-current={pathname === to ? "page" : undefined}
					className={cn(
						tabClass,
						"h-12 min-w-0 px-0.5",
						pathname === to && "font-semibold text-foreground",
					)}
				>
					{kind === "page" ? (
						<AppWindow className="size-[22px] shrink-0" />
					) : (
						<Wrench className="size-[22px] shrink-0" />
					)}
					<span className="w-full truncate text-center">{title}</span>
				</Link>
			))}
			<Sheet>
				<SheetTrigger asChild>
					<button type="button" className={cn(tabClass, "h-12")}>
						<Settings className="size-[22px]" />
						{t("nav.settings")}
					</button>
				</SheetTrigger>
				<SheetContent side="bottom" className="rounded-t-2xl pb-8">
					<SheetHeader>
						<SheetTitle>{t("nav.settings")}</SheetTitle>
					</SheetHeader>
					<div className="grid auto-cols-[minmax(0,5rem)] grid-flow-col justify-center gap-4 px-4">
						<ThemeToggle className="h-14 w-full" />
						<VersionMenu side="top" className="h-14 w-full" />
						<LanguageMenu side="top" className="h-14 w-full" />
						<AboutTile className="h-14 w-full" />
					</div>
				</SheetContent>
			</Sheet>
		</nav>
	);
}
