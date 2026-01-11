import { ChevronDown, Settings2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCalculatorState } from "@/context/CalculatorStateContext";
import { useConfig } from "@/context/ConfigContext";
import { useConfigurationState } from "@/context/ConfigurationStateContext";
import { useElementSize } from "@/hooks/use-element-size";
import { useToastNotifications } from "@/hooks/use-toast-notifications";
import { calculateBits, decodeWithMultiplier } from "@/lib/bit-decoder";
import {
	configToInputState,
	configToMultiplierInputState,
	inputStateToConfig,
	inputStateToMultiplierConfig,
} from "@/lib/bit-template-utils";
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
			? "bg-amber-50 hover:bg-amber-100/80 border-amber-200"
			: "bg-violet-50 hover:bg-violet-100/80 border-violet-200";

	const textClass = variant === "amber" ? "text-amber-600" : "text-violet-500";

	const iconClass = variant === "amber" ? "text-amber-500" : "text-violet-400";

	return (
		<Collapsible open={open} onOpenChange={onOpenChange} className="space-y-2">
			<CollapsibleTrigger
				className={`group flex w-full items-center justify-center gap-2 py-1.5 px-3 rounded-lg border transition-colors ${triggerClass}`}
			>
				<span
					className={`text-[11px] font-bold uppercase tracking-widest ${textClass}`}
				>
					{label}
				</span>
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
	const { calculationMode } = useConfigurationState();
	const { showError } = useToastNotifications();

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

	const parseMultiplierValues = (
		state: MultiplierBitInputState,
	): number[] | null => {
		const values: number[] = [];
		for (const v of state.sideValues) {
			const num = parseInt(v, 10);
			if (isNaN(num) || num <= 0) {
				return null;
			}
			values.push(num);
		}
		return values;
	};

	const runCalculation = useCallback(() => {
		if (!inputState || !traceTNT) return;

		if (hasMultiplierSupport && isMultiplierEnabled) {
			const multiplierValues = parseMultiplierValues(multiplierState);

			let blueTNT = traceTNT.blue;
			let redTNT = traceTNT.red;
			let blueMultiplierIndices: number[] = [];
			let redMultiplierIndices: number[] = [];

			if (multiplierValues && multiplierValues.length > 0) {
				const blueMultResult = decodeWithMultiplier(
					multiplierValues,
					multiplierState.multiplier,
					blueTNT,
				);
				blueMultiplierIndices = blueMultResult.activatedIndices;
				blueTNT = blueMultResult.remainder;

				const redMultResult = decodeWithMultiplier(
					multiplierValues,
					multiplierState.multiplier,
					redTNT,
				);
				redMultiplierIndices = redMultResult.activatedIndices;
				redTNT = redMultResult.remainder;
			}

			setMultiplierResult({
				blue: blueMultiplierIndices,
				red: redMultiplierIndices,
			});

			const result = calculateBits(inputState, blueTNT, redTNT, traceDirection);

			if ("error" in result) {
				const { errorKey, errorParams } = result.error;
				if (errorKey) {
					showError(
						t("error.calculator.calc_failed"),
						t(errorKey as any, errorParams as any),
					);
				}
				return;
			}

			setCalculationResult(result.result);
		} else {
			const result = calculateBits(
				inputState,
				traceTNT.blue,
				traceTNT.red,
				traceDirection,
			);

			if ("error" in result) {
				const { errorKey, errorParams } = result.error;
				if (errorKey) {
					showError(
						t("error.calculator.calc_failed"),
						t(errorKey as any, errorParams as any),
					);
				}
				return;
			}

			setCalculationResult(result.result);
			setMultiplierResult({ blue: [], red: [] });
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
	]);

	useEffect(() => {
		if (hasAutoCalculated.current) return;

		if (inputState && traceTNT) {
			const allValuesPresent = inputState.sideValues.every(
				(v) => v && v.trim() !== "",
			);
			if (allValuesPresent) {
				hasAutoCalculated.current = true;
				runCalculation();
			}
		}
	}, [inputState, traceTNT, runCalculation]);

	return (
		<div className="flex h-full w-full flex-col bg-background">
			<Card className="h-full w-full shadow-sm">
				<CardContent className="flex-1 min-h-0 p-0 overflow-hidden">
					<ScrollArea className="h-full" viewportRef={scrollViewportRef}>
						<div
							className="flex flex-col px-5 pb-5"
							style={{
								minHeight: viewportHeight > 0 ? viewportHeight : "100%",
							}}
						>
							<Collapsible
								open={isConfigOpen}
								onOpenChange={setIsConfigOpen}
								className="space-y-2 shrink-0 relative z-10"
							>
								<CollapsibleTrigger className="group flex w-full items-center justify-between py-2 hover:bg-slate-50 rounded-lg transition-colors px-1">
									<h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
										<Settings2 className="h-4 w-4" />
										{t("breadcrumb.bit_calculation")}
									</h3>
									<ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
								</CollapsibleTrigger>

								<CollapsibleContent>
									<div className="pt-2 space-y-4">
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

										<div className="flex justify-center pt-2 pb-4">
											<Button
												className="w-40 bg-slate-900 hover:bg-slate-800 text-white shadow-md transition-all active:scale-95"
												onClick={runCalculation}
											>
												{t("calculator.bit_calculate_btn")}
											</Button>
										</div>
									</div>
								</CollapsibleContent>
							</Collapsible>

							<div
								className={`flex-1 flex flex-col justify-center ${hasMultiplierSupport && !isConfigOpen ? "-mt-8" : ""}`}
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
						</div>
					</ScrollArea>
				</CardContent>
			</Card>
		</div>
	);
}
