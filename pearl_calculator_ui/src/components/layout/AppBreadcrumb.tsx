import { match, P } from "ts-pattern";
import {
	ArrowLeftRight,
	ChevronLeft,
	ChevronsRight,
	Ellipsis,
	Menu,
} from "lucide-react";
import { Fragment } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { useBreadcrumbItems } from "@/hooks/use-breadcrumb-items";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useConfigurationState } from "@/context/ConfigurationStateContext";
import { useMobileView } from "@/context/MobileViewContext";
import { useSidebar } from "@/components/ui/sidebar";
import type { CannonMode } from "@/types/domain";

export function AppBreadcrumb() {
	const navigate = useNavigate();
	const location = useLocation();
	const { t } = useTranslation();
	const items = useBreadcrumbItems();
	const { calculationMode, setCalculationMode } = useConfigurationState();

	const showModeSwitcher = location.pathname === "/";
	const { isMobile } = useMobileView();
	const { toggleSidebar } = useSidebar();

	const handleBack = () => {
		const prev = items[items.length - 2];
		match(prev)
			.with({ onClick: P.nonNullable }, (item) => item.onClick())
			.with({ href: P.string }, (item) => navigate(item.href))
			.otherwise(() => {});
	};

	const handleModeChange = (mode: CannonMode) => {
		setCalculationMode(mode);
	};

	return (
		<div className="flex items-center gap-2 w-full justify-between">
			<div className="flex items-center gap-2">
				{isMobile && (
					<Button
						variant="ghost"
						size="icon"
						className="h-6 w-6 shrink-0"
						onClick={toggleSidebar}
					>
						<Menu className="h-4 w-4" />
					</Button>
				)}
				<Button
					variant="outline"
					className="h-6 px-2 shrink-0 gap-1"
					onClick={handleBack}
					disabled={items.length < 2}
				>
					<ChevronLeft className="h-3.5 w-3.5" />
					<span className="text-xs">{t("breadcrumb.back")}</span>
				</Button>
				<Breadcrumb>
					<BreadcrumbList>
						{(() => {
							const shouldCollapse = isMobile && items.length > 2;
							const visibleItems = shouldCollapse
								? [items[items.length - 1]]
								: items;
							const collapsedItems = shouldCollapse ? items.slice(0, -1) : [];

							return (
								<>
									{shouldCollapse && collapsedItems.length > 0 && (
										<>
											<BreadcrumbItem>
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button
															variant="ghost"
															size="sm"
															className="h-6 w-6 p-0"
														>
															<Ellipsis className="h-4 w-4" />
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="start">
														{collapsedItems.map((item, idx) => (
															<DropdownMenuItem
																key={idx}
																onClick={() => item.onClick?.()}
																className={
																	item.onClick
																		? "cursor-pointer"
																		: "cursor-default"
																}
															>
																{item.label}
															</DropdownMenuItem>
														))}
													</DropdownMenuContent>
												</DropdownMenu>
											</BreadcrumbItem>
											<BreadcrumbSeparator>
												<ChevronsRight />
											</BreadcrumbSeparator>
										</>
									)}
									{visibleItems.map((item, index) => (
										<Fragment key={shouldCollapse ? "last" : index}>
											{!shouldCollapse && index > 0 && (
												<BreadcrumbSeparator>
													<ChevronsRight />
												</BreadcrumbSeparator>
											)}
											<BreadcrumbItem>
												{item.active ? (
													<BreadcrumbPage>
														<Badge className="shadow-none rounded-full">
															{item.label}
														</Badge>
													</BreadcrumbPage>
												) : (
													<BreadcrumbLink
														className={
															item.onClick ? "cursor-pointer" : "cursor-default"
														}
														onClick={(e) => {
															if (item.onClick) {
																e.preventDefault();
																item.onClick();
															}
														}}
													>
														<Badge
															variant="outline"
															className="font-medium shadow-none rounded-full"
														>
															{item.label}
														</Badge>
													</BreadcrumbLink>
												)}
											</BreadcrumbItem>
										</Fragment>
									))}
								</>
							);
						})()}
					</BreadcrumbList>
				</Breadcrumb>
			</div>

			{showModeSwitcher && (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" size="sm" className="h-8 gap-1">
							<ArrowLeftRight
								className="h-3.5 w-3.5"
								style={{ transform: "translateY(-0.5px)" }}
							/>
							<span className="text-xs font-medium">
								{t(`breadcrumb.mode.${calculationMode}`)}
							</span>
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem onClick={() => handleModeChange("Standard")}>
							{t("breadcrumb.mode.Standard")}
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => handleModeChange("Accumulation")}>
							{t("breadcrumb.mode.Accumulation")}
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => handleModeChange("Vector3D")}>
							{t("breadcrumb.mode.Vector3D")}
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			)}
		</div>
	);
}
