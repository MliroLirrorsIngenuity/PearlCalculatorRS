import { ChevronLeft, ChevronsRight } from "lucide-react";
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
import { useCalculatorState } from "@/context/CalculatorStateContext";
import { useConfig } from "@/context/ConfigContext";
import { useConfigurationState } from "@/context/ConfigurationStateContext";

export function AppBreadcrumb() {
	const location = useLocation();
	const navigate = useNavigate();
	const { t } = useTranslation();
	const { hasConfig, setHasConfig } = useConfig();
	const { defaultCalculator, updateDefaultTrace } = useCalculatorState();
	const { isWizardActive, isFinished, setIsFinished, setIsWizardActive } =
		useConfigurationState();
	const showPearlTrace = defaultCalculator.trace.show;
	const showBitCalculation = defaultCalculator.trace.bitCalculation?.show;
	const { updateBitCalculation } = useCalculatorState();

	const getBreadcrumbs = () => {
		const path = location.pathname;
		if (path === "/") {
			const breadcrumbs = [];
			if (hasConfig) {
				breadcrumbs.push({
					label: t("breadcrumb.select_config"),
					onClick: () => {
						updateBitCalculation({ show: false });
						updateDefaultTrace({ show: false });
						setHasConfig(false);
					},
				});
				breadcrumbs.push({
					label: t("breadcrumb.calculator"),
					href: "/",
					active: !showPearlTrace,
					onClick: showPearlTrace
						? () => {
								updateBitCalculation({ show: false });
								updateDefaultTrace({ show: false });
							}
						: undefined,
				});
				if (showPearlTrace) {
					breadcrumbs.push({
						label: t("breadcrumb.pearl_trace"),
						active: !showBitCalculation,
						onClick: showBitCalculation
							? () => updateBitCalculation({ show: false })
							: undefined,
					});

					if (showBitCalculation) {
						breadcrumbs.push({
							label: t("breadcrumb.bit_calculation"),
							active: true,
						});
					}
				}
			} else {
				breadcrumbs.push({
					label: t("breadcrumb.select_config"),
					href: "/",
					active: true,
				});
			}
			return breadcrumbs;
		}
		if (path === "/simulator") {
			return [
				{ label: t("breadcrumb.simulator"), href: "/simulator", active: true },
			];
		}
		if (path === "/configuration") {
			const crumbs: any[] = [
				{
					label: t("breadcrumb.configuration"),
					href: "/configuration",
					active: !isWizardActive,
					onClick: isWizardActive ? () => setIsWizardActive(false) : undefined,
				},
			];

			if (isWizardActive) {
				crumbs.push({
					label: t("breadcrumb.new_config"),
					active: !isFinished,
					href: undefined,
					onClick: isFinished ? () => setIsFinished(false) : undefined,
				});
			}

			if (isFinished) {
				crumbs.push({
					label: t("breadcrumb.completed"),
					active: true,
					href: undefined,
					onClick: undefined,
				});
			}
			return crumbs;
		}
		if (path === "/settings") {
			return [
				{ label: t("breadcrumb.settings"), href: "/settings", active: true },
			];
		}
		return [];
	};

	const items = getBreadcrumbs();

	const handleBack = () => {
		if (items.length < 2) return;
		const prev = items[items.length - 2];
		if (prev.onClick) {
			prev.onClick();
		} else if (prev.href) {
			navigate(prev.href);
		}
	};

	return (
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
	);
}
