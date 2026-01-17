import { AnimatePresence, motion } from "motion/react";
import { Outlet, useLocation } from "react-router";
import { DragDropOverlay } from "@/components/common/DragDropOverlay";
import { AppSidebar } from "@/components/app-sidebar";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { MobileViewProvider } from "@/context/MobileViewContext";

export default function Layout() {
	const location = useLocation();
	return (
		<MobileViewProvider>
			<SidebarProvider>
				<DragDropOverlay />
				<AppSidebar />
				<main className="w-full h-dvh flex flex-col overflow-hidden pt-[var(--safe-area-inset-top)] pb-[var(--safe-area-inset-bottom)] pr-[var(--safe-area-inset-right)]">
					<header className="flex h-12 shrink-0 items-center gap-2 px-4 pt-1 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
						<AppBreadcrumb />
					</header>
					<div className="flex-1 overflow-hidden p-2">
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
				</main>
				<Toaster />
			</SidebarProvider>
		</MobileViewProvider>
	);
}
