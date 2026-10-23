import { ArrowLeftRight, ChevronLeft } from "lucide-react";
import { Fragment } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router";
import { match, P } from "ts-pattern";
import { Segmented } from "@/components/common/Metric";
import { ConfigMenu } from "@/components/layout/ConfigMenu";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCalculatorState } from "@/context/CalculatorStateContext";
import { useConfig } from "@/context/ConfigContext";
import { useConfigurationState } from "@/context/ConfigurationStateContext";
import { useMobileView } from "@/context/MobileViewContext";
import {
	type BreadcrumbItemType,
	useBreadcrumbItems,
} from "@/hooks/use-breadcrumb-items";
import { useDirectionLabel } from "@/hooks/use-direction-label";
import type { CannonMode } from "@/types/domain";

const MODES: CannonMode[] = ["Standard", "Accumulation", "Vector3D"];

function ModeSwitcher() {
	const { t } = useTranslation();
	const { isMobile } = useMobileView();
	const { calculationMode, setCalculationMode } = useConfigurationState();

	if (isMobile) {
		return (
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="ghost" size="sm" className="h-8 shrink-0 gap-1">
						<ArrowLeftRight className="size-3.5" />
						<span className="text-xs font-medium">
							{t(`breadcrumb.mode.short.${calculationMode}`)}
						</span>
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					{MODES.map((mode) => (
						<DropdownMenuItem
							key={mode}
							onClick={() => setCalculationMode(mode)}
						>
							{t(`breadcrumb.mode.${mode}`)}
						</DropdownMenuItem>
					))}
				</DropdownMenuContent>
			</DropdownMenu>
		);
	}

	return (
		<Segmented
			value={calculationMode}
			onChange={setCalculationMode}
			options={MODES.map((mode) => ({
				value: mode,
				label: t(`breadcrumb.mode.segment.${mode}`),
			}))}
		/>
	);
}

function Crumb({
	item,
	onSelect,
}: {
	item: BreadcrumbItemType;
	onSelect: (item: BreadcrumbItemType) => void;
}) {
	if (item.active) {
		return (
			<span aria-current="page" className="truncate font-medium">
				{item.label}
			</span>
		);
	}
	if (!item.onClick && !item.href) {
		return <span className="truncate text-muted-foreground">{item.label}</span>;
	}
	return (
		<button
			type="button"
			onClick={() => onSelect(item)}
			className="truncate text-muted-foreground transition-colors hover:text-foreground"
		>
			{item.label}
		</button>
	);
}

export function AppBreadcrumb() {
	const navigate = useNavigate();
	const location = useLocation();
	const { t } = useTranslation();
	const items = useBreadcrumbItems();
	const { isMobile } = useMobileView();
	const { hasConfig } = useConfig();
	const { defaultCalculator } = useCalculatorState();
	const { getCardinalLabel } = useDirectionLabel();

	const onCalculator = location.pathname === "/";
	const trace = defaultCalculator.trace;
	const visibleItems = isMobile ? items.slice(-1) : items;

	const select = (item: BreadcrumbItemType) =>
		match(item)
			.with({ onClick: P.nonNullable }, (i) => i.onClick())
			.with({ href: P.string }, (i) => navigate(i.href))
			.otherwise(() => {});

	return (
		<div className="flex w-full items-center gap-2">
			<Button
				variant="outline"
				size="sm"
				className="h-6 shrink-0 gap-1 px-2 text-xs"
				onClick={() => select(items[items.length - 2])}
				disabled={items.length < 2}
			>
				<ChevronLeft className="size-3.5" />
				{t("breadcrumb.back")}
			</Button>
			<nav
				aria-label={t("breadcrumb.label")}
				className="flex min-w-0 items-center gap-2 text-sm"
			>
				{visibleItems.map((item, index) => (
					<Fragment key={item.label}>
						{index > 0 && (
							<span aria-hidden="true" className="text-muted-foreground/60">
								›
							</span>
						)}
						<Crumb item={item} onSelect={select} />
					</Fragment>
				))}
				{onCalculator && hasConfig && !trace.show && (
					<>
						<span aria-hidden="true" className="text-muted-foreground/60">
							›
						</span>
						<ConfigMenu />
					</>
				)}
				{onCalculator && trace.show && trace.tnt && !isMobile && (
					<span className="ml-1.5 shrink-0 text-[13px] text-muted-foreground tabular-nums">
						{t("breadcrumb.trace_summary", {
							blue: trace.tnt.blue,
							red: trace.tnt.red,
							direction: getCardinalLabel(trace.direction),
						})}
					</span>
				)}
			</nav>
			<div className="flex-1" />
			{onCalculator && <ModeSwitcher />}
		</div>
	);
}
