import { ChevronDown, Copy } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	hitBlock,
	incomingDirection,
	landingIndex,
	landingPoint,
} from "@/components/charts/trajectory";
import {
	Metric,
	sectionLabelClass,
	TntCounts,
	Unit,
} from "@/components/common/Metric";
import { Button } from "@/components/ui/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCalculatorState } from "@/context/CalculatorStateContext";
import { useConfig } from "@/context/ConfigContext";
import { useConfigurationState } from "@/context/ConfigurationStateContext";
import { useMobileView } from "@/context/MobileViewContext";
import { useDirectionLabel } from "@/hooks/use-direction-label";
import { useElementSize } from "@/hooks/use-element-size";
import { useToastNotifications } from "@/hooks/use-toast-notifications";
import {
	configToInputState,
	configToMultiplierInputState,
	inputStateToConfig,
	inputStateToMultiplierConfig,
} from "@/lib/bit-template-utils";
import { BitTemplateError, builtinBits } from "@/lib/bits-builtin";
import { copyText } from "@/plugins/copy";
import { runSlot } from "@/plugins/pipeline";
import { calculatorService } from "@/services";
import type { BitCalculationResult, BitInputState } from "@/types/domain";
import { BitInputSection } from "./BitInputSection";
import { BitResultSection } from "./BitResultSection";
import {
	MultiplierBitInputSection,
	type MultiplierBitInputState,
} from "./MultiplierBitInputSection";

interface MultiplierCalculationResult {
	blue: number[];
	red: number[];
}

interface BitSectionCollapsibleProps {
	label: string;
	variant: "amber" | "violet";
	open: boolean;
	onOpenChange: (open: boolean) => void;
	children: React.ReactNode;
}

function BitSectionCollapsible({
	label,
	variant,
	open,
	onOpenChange,
	children,
}: BitSectionCollapsibleProps) {
	const triggerClass =
		variant === "amber"
			? "bg-amber-50 hover:bg-amber-100/80 border-amber-200 dark:bg-amber-400/10 dark:hover:bg-amber-400/15 dark:border-amber-400/30"
			: "bg-violet-50 hover:bg-violet-100/80 border-violet-200 dark:bg-violet-400/10 dark:hover:bg-violet-400/15 dark:border-violet-400/30";

	const textClass =
		variant === "amber"
			? "text-amber-600 dark:text-amber-400"
			: "text-violet-600 dark:text-violet-400";

	const iconClass =
		variant === "amber"
			? "text-amber-500 dark:text-amber-400"
			: "text-violet-400";

	return (
		<Collapsible open={open} onOpenChange={onOpenChange} className="space-y-2">
			<CollapsibleTrigger
				className={`group flex w-full items-center justify-center gap-2 py-1.5 px-3 rounded-lg border transition-colors ${triggerClass}`}
			>
				<span className={`text-xs font-medium ${textClass}`}>{label}</span>
				<ChevronDown
					className={`h-3.5 w-3.5 transition-transform duration-200 group-data-[state=open]:rotate-180 ${iconClass}`}
				/>
			</CollapsibleTrigger>
			<CollapsibleContent>{children}</CollapsibleContent>
		</Collapsible>
	);
}

export default function BitCalculationPanel() {
	const { t } = useTranslation();
	const {
		bitTemplateConfig,
		setBitTemplateConfig,
		multiplierConfig,
		setMultiplierConfig,
	} = useConfig();
	const { defaultCalculator } = useCalculatorState();
	const { isMobile } = useMobileView();
	const { getCardinalLabel } = useDirectionLabel();
	const { calculationMode } = useConfigurationState();
	const { showError, showSuccess } = useToastNotifications();

	const hasMultiplierSupport =
		calculationMode === "Accumulation" || calculationMode === "Vector3D";

	const traceTNT = defaultCalculator.trace.tnt;
	const traceDirection = defaultCalculator.trace.direction;

	const initialState = useMemo(
		() => configToInputState(bitTemplateConfig),
		[bitTemplateConfig],
	);
	const [inputState, setInputState] = useState<BitInputState | undefined>(
		initialState,
	);

	const initialMultiplierState = useMemo(
		() =>
			configToMultiplierInputState(multiplierConfig) ?? {
				sideCount: 13,
				sideValues: Array(13).fill(""),
				multiplier: 200,
				isSwapped: false,
			},
		[multiplierConfig],
	);

	const [multiplierState, setMultiplierState] =
		useState<MultiplierBitInputState>(initialMultiplierState);

	const [isMultiplierEnabled, setIsMultiplierEnabled] = useState(
		!!multiplierConfig,
	);

	useEffect(() => {
		setInputState(configToInputState(bitTemplateConfig));
	}, [bitTemplateConfig]);

	useEffect(() => {
		const newState = configToMultiplierInputState(multiplierConfig);
		if (newState) {
			setMultiplierState(newState);
			setIsMultiplierEnabled(true);
		} else {
			setIsMultiplierEnabled(false);
		}
	}, [multiplierConfig]);

	const handleInputChange = (state: BitInputState) => {
		setInputState(state);
		setBitTemplateConfig(inputStateToConfig(state));
	};

	const handleMultiplierChange = (state: MultiplierBitInputState) => {
		setMultiplierState(state);
		setMultiplierConfig(inputStateToMultiplierConfig(state));
	};

	const [calculationResult, setCalculationResult] =
		useState<BitCalculationResult>({
			blue: [],
			red: [],
			direction: [false, false],
		});

	const [multiplierResult, setMultiplierResult] =
		useState<MultiplierCalculationResult>({
			blue: [],
			red: [],
		});

	const hasTemplateValues = useMemo(() => {
		if (!inputState) return false;
		return inputState.sideValues.some((v) => v && v.trim() !== "");
	}, [inputState]);

	const hasMultiplierValues = useMemo(() => {
		if (!multiplierState) return false;
		return multiplierState.sideValues.some((v) => v && v.trim() !== "");
	}, [multiplierState]);

	const [isConfigOpen, setIsConfigOpen] = useState(!hasTemplateValues);
	const [isMultiplierOpen, setIsMultiplierOpen] = useState(
		isMultiplierEnabled && !hasMultiplierValues,
	);
	const [isStandardOpen, setIsStandardOpen] = useState(!hasTemplateValues);
	const hasAutoCalculated = useRef(false);

	const { ref: scrollViewportRef, height: viewportHeight } =
		useElementSize<HTMLDivElement>();

	const runCalculation = useCallback(async () => {
		if (!inputState || !traceTNT) return;
		const multiplierEnabled = hasMultiplierSupport && isMultiplierEnabled;
		try {
			const result = await runSlot(
				"bits",
				{
					template: inputState,
					multiplier: multiplierEnabled ? multiplierState : null,
					tnt: {
						blue: traceTNT.blue,
						red: traceTNT.red,
						vertical: traceTNT.vertical,
					},
					direction: traceDirection,
					mode: calculationMode,
				},
				builtinBits,
			);
			setCalculationResult(result.standard);
			setMultiplierResult(
				multiplierEnabled ? result.multiplier : { blue: [], red: [] },
			);
		} catch (error) {
			if (error instanceof BitTemplateError) {
				if (error.errorKey) {
					showError(
						t("error.calculator.calc_failed"),
						t(error.errorKey as any, error.errorParams as any),
					);
				}
				return;
			}
			showError(t("error.calculator.calc_failed"), error);
		}
	}, [
		inputState,
		traceTNT,
		traceDirection,
		showError,
		t,
		hasMultiplierSupport,
		multiplierState,
		isMultiplierEnabled,
		calculationMode,
	]);

	useEffect(() => {
		if (hasAutoCalculated.current) return;

		if (inputState && traceTNT) {
			const allValuesPresent = inputState.sideValues.every(
				(v) => v && v.trim() !== "",
			);
			if (allValuesPresent) {
				void runCalculation();
			}
			hasAutoCalculated.current = true;
		}
	}, [inputState, traceTNT, runCalculation]);

	const trace = defaultCalculator.trace.data;
	const deviation = trace?.closest_approach?.distance ?? trace?.distance;
	const flightTicks = trace ? landingIndex(trace) : 0;
	const landingBlock = trace
		? hitBlock(landingPoint(trace), incomingDirection(trace)).block
		: null;
	const { destX, destZ } = defaultCalculator.inputs;
	const templateValues = (inputState?.sideValues ?? []).filter(
		(v) => v && v.trim() !== "",
	);

	const copyBitResult = async () => {
		const bits = (count: number, active: number[], reversed: boolean) => {
			const on = new Set(active);
			return Array.from({ length: count }, (_, i) =>
				on.has(reversed ? count - 1 - i : i) ? "1" : "0",
			).join("");
		};
		const rows = (
			count: number,
			result: { blue: number[]; red: number[] },
			swapped: boolean,
			prefix = "",
		) => {
			const top = swapped ? "red" : "blue";
			const bottom = swapped ? "blue" : "red";
			return [
				`${prefix}${t(`calculator.color_${top}`)}: ${bits(count, result[top], false)}`,
				`${prefix}${t(`calculator.color_${bottom}`)}: ${bits(count, result[bottom], true)}`,
			];
		};
		const lines = [
			...rows(
				inputState?.sideCount ?? 13,
				calculationResult,
				inputState?.isSwapped ?? false,
			),
			`${t("calculator.direction_label")}: ${calculationResult.direction.map(Number).join("")}`,
		];
		if (hasMultiplierSupport && isMultiplierEnabled) {
			lines.push(
				...rows(
					multiplierState.sideCount,
					multiplierResult,
					multiplierState.isSwapped,
					`${t("calculator.multiplier_section")} `,
				),
			);
		}
		try {
			const text = await copyText("bits", lines.join("\n"), {
				standard: calculationResult,
				multiplier: multiplierResult,
				tnt: traceTNT,
				direction: traceDirection,
			});
			await calculatorService.copyToClipboard(text);
			showSuccess(t("bit.copied"));
		} catch (error) {
			showError(t("bit.copy_failed"), error);
		}
	};

	return (
		<div className="flex h-full w-full bg-card">
			{!isMobile && (
				<aside className="flex w-[248px] shrink-0 flex-col gap-5 border-r border-border/60 p-5">
					<span className={sectionLabelClass}>{t("bit.current_solution")}</span>
					<Metric
						label="TNT"
						sub={t("trace.tnt_sub", {
							total: traceTNT?.total ?? 0,
							direction: getCardinalLabel(traceDirection),
						})}
					>
						<TntCounts
							blue={traceTNT?.blue}
							red={traceTNT?.red}
							vertical={
								calculationMode === "Vector3D" ? traceTNT?.vertical : undefined
							}
						/>
					</Metric>
					<Metric
						label={t("calculator.target_coordinates")}
						sub={
							landingBlock &&
							t("trace.hit_block", {
								x: landingBlock.X,
								y: landingBlock.Y,
								z: landingBlock.Z,
							})
						}
					>
						<Unit>X</Unit>
						{destX || "0"}
						<Unit>Z</Unit>
						{destZ || "0"}
					</Metric>
					{deviation !== undefined && (
						<Metric
							label={t("trace.deviation")}
							sub={t("bit.flight_sub", {
								ticks: flightTicks,
								seconds: (flightTicks / 20).toFixed(2),
							})}
						>
							{deviation.toFixed(4)}
							<Unit>{t("trace.blocks_unit")}</Unit>
						</Metric>
					)}
				</aside>
			)}

			<div className="flex min-w-0 flex-1 flex-col px-7 pt-5 pb-4">
				<div className="flex items-center gap-3">
					<span className={sectionLabelClass}>{t("bit.result_title")}</span>
					<span className="text-xs text-muted-foreground/70">
						{t("bit.result_hint")}
					</span>
					<div className="flex-1" />
					<Button variant="outline" size="sm" onClick={copyBitResult}>
						<Copy />
						{t("bit.copy")}
					</Button>
				</div>

				<ScrollArea className="min-h-0 flex-1" viewportRef={scrollViewportRef}>
					<div
						className="flex flex-col justify-center gap-2 py-4"
						style={{ minHeight: viewportHeight > 0 ? viewportHeight : "100%" }}
					>
						{hasMultiplierSupport && (
							<BitResultSection
								sideCount={multiplierState.sideCount}
								sideValues={multiplierState.sideValues}
								activeIndices={multiplierResult}
								isSwapped={multiplierState.isSwapped}
								label={t("calculator.multiplier_result")}
								variant="multiplier"
								disabled={!isMultiplierEnabled}
							/>
						)}
						<BitResultSection
							sideCount={inputState?.sideCount ?? 13}
							sideValues={inputState?.sideValues ?? []}
							activeIndices={calculationResult}
							direction={calculationResult.direction}
							isSwapped={inputState?.isSwapped ?? false}
							label={
								hasMultiplierSupport
									? t("calculator.standard_result")
									: undefined
							}
						/>
					</div>
				</ScrollArea>

				<Collapsible
					open={isConfigOpen}
					onOpenChange={setIsConfigOpen}
					className="shrink-0 border-t border-border/60 pt-3"
				>
					<CollapsibleTrigger className="group flex w-full items-center gap-3 text-left">
						<span className={sectionLabelClass}>{t("bit.template_title")}</span>
						<span className="truncate text-[13px] tabular-nums">
							{templateValues.length > 0
								? t("bit.template_summary", {
										count: templateValues.length,
										values: templateValues.slice(0, 3).join(", "),
										last: templateValues[templateValues.length - 1],
									})
								: t("bit.template_empty")}
						</span>
						<div className="flex-1" />
						<span className="flex items-center gap-1 text-[13px] text-muted-foreground">
							{t("bit.template_edit")}
							<ChevronDown className="size-3.5 transition-transform group-data-[state=open]:rotate-180" />
						</span>
					</CollapsibleTrigger>
					<CollapsibleContent>
						<div className="max-h-[45vh] space-y-4 overflow-auto pt-3">
							{hasMultiplierSupport && (
								<>
									<BitSectionCollapsible
										label={t("calculator.multiplier_section")}
										variant="amber"
										open={isMultiplierOpen}
										onOpenChange={setIsMultiplierOpen}
									>
										<MultiplierBitInputSection
											value={multiplierState}
											onChange={handleMultiplierChange}
											enabled={isMultiplierEnabled}
											onToggle={setIsMultiplierEnabled}
										/>
									</BitSectionCollapsible>
									<BitSectionCollapsible
										label={t("calculator.standard_section")}
										variant="violet"
										open={isStandardOpen}
										onOpenChange={setIsStandardOpen}
									>
										<BitInputSection
											value={inputState}
											onChange={handleInputChange}
										/>
									</BitSectionCollapsible>
								</>
							)}
							{!hasMultiplierSupport && (
								<BitInputSection
									value={inputState}
									onChange={handleInputChange}
								/>
							)}
							<div className="flex justify-center pb-2">
								<Button className="w-40" onClick={() => void runCalculation()}>
									{t("calculator.bit_calculate_btn")}
								</Button>
							</div>
						</div>
					</CollapsibleContent>
				</Collapsible>
			</div>
		</div>
	);
}
