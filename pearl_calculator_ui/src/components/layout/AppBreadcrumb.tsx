import { match, P } from "ts-pattern";
import { ArrowLeftRight, ChevronLeft, ChevronsRight } from "lucide-react";
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
import type { CannonMode } from "@/types/domain";

export function AppBreadcrumb() {
	const navigate = useNavigate();
	const location = useLocation();
	const { t } = useTranslation();
	const items = useBreadcrumbItems();
	const { calculationMode, setCalculationMode } = useConfigurationState();

	const showModeSwitcher = location.pathname === "/";

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
						{items.map((item, index) => (
							<Fragment key={index}>
								{index > 0 && (
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
