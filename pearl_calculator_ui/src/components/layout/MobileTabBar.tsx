import { Settings } from "lucide-react";
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
import { LanguageMenu, ThemeToggle, VersionMenu } from "./AppSettingsControls";
import { NAV_ITEMS } from "./navigation";

const tabClass =
	"flex flex-col items-center justify-center gap-0.5 text-[11px] text-muted-foreground";

export function MobileTabBar() {
	const { t } = useTranslation();
	const { pathname } = useLocation();

	return (
		<nav
			aria-label={t("nav.modules")}
			className="grid shrink-0 grid-cols-4 border-t bg-background px-2 pt-1.5 pb-[max(var(--safe-area-inset-bottom),0.5rem)]"
		>
			{NAV_ITEMS.map(({ to, icon: Icon, labelKey }) => (
				<Link
					key={to}
					to={to}
					aria-current={pathname === to ? "page" : undefined}
					className={cn(
						tabClass,
						"h-12",
						pathname === to && "font-semibold text-foreground",
					)}
				>
					<Icon className="size-[22px]" />
					{t(labelKey)}
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
					<div className="flex justify-center gap-4 px-4">
						<ThemeToggle className="h-14 w-20" />
						<VersionMenu side="top" className="h-14 w-20" />
						<LanguageMenu side="top" className="h-14 w-20" />
					</div>
				</SheetContent>
			</Sheet>
		</nav>
	);
}
