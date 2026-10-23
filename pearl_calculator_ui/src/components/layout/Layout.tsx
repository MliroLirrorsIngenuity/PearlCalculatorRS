import { AnimatePresence, motion } from "motion/react";
import { Outlet, useLocation } from "react-router";
import { DragDropOverlay } from "@/components/common/DragDropOverlay";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { AppRail } from "@/components/layout/AppRail";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { Toaster } from "@/components/ui/sonner";
import { MobileViewProvider, useMobileView } from "@/context/MobileViewContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";

function LayoutShell() {
	const location = useLocation();
	const { isMobile } = useMobileView();

	return (
		<div className="flex h-dvh w-full overflow-hidden bg-zinc-50 dark:bg-background">
			<DragDropOverlay />
			{!isMobile && <AppRail />}
			<main
				className={cn(
					"flex min-w-0 flex-1 flex-col overflow-hidden pt-[var(--safe-area-inset-top)] pr-[var(--safe-area-inset-right)]",
					!isMobile && "pb-[var(--safe-area-inset-bottom)]",
				)}
			>
				<header className="flex h-12 shrink-0 items-center px-4 pt-1">
					<AppBreadcrumb />
				</header>
				<div className="min-h-0 flex-1 overflow-hidden p-2">
					<AnimatePresence mode="wait">
						<motion.div
							key={location.pathname}
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.2 }}
							className="h-full w-full"
						>
							<Outlet />
						</motion.div>
					</AnimatePresence>
				</div>
				{isMobile && <MobileTabBar />}
			</main>
			<Toaster />
		</div>
	);
}

export default function Layout() {
	return (
		<ThemeProvider>
			<MobileViewProvider>
				<LayoutShell />
			</MobileViewProvider>
		</ThemeProvider>
	);
}
