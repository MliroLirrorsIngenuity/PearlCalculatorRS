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

	const isAccumulationMode = calculationMode === "Accumulation";

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

	useEffect(() => {
		setInputState(configToInputState(bitTemplateConfig));
	}, [bitTemplateConfig]);

	useEffect(() => {
		const newState = configToMultiplierInputState(multiplierConfig);
		if (newState) {
			setMultiplierState(newState);
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

	const [isConfigOpen, setIsConfigOpen] = useState(!hasTemplateValues);
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

		if (isAccumulationMode) {
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
		isAccumulationMode,
		multiplierState,
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
										{isAccumulationMode && (
											<>
												<Collapsible defaultOpen className="space-y-2">
													<CollapsibleTrigger className="group flex w-full items-center justify-center gap-2 py-1.5 px-3 bg-amber-50 hover:bg-amber-100/80 rounded-lg border border-amber-200 transition-colors">
														<span className="text-[11px] font-bold text-amber-600 uppercase tracking-widest">
															{t("calculator.multiplier_section")}
														</span>
														<ChevronDown className="h-3.5 w-3.5 text-amber-500 transition-transform duration-200 group-data-[state=open]:rotate-180" />
													</CollapsibleTrigger>
													<CollapsibleContent>
														<MultiplierBitInputSection
															value={multiplierState}
															onChange={handleMultiplierChange}
														/>
													</CollapsibleContent>
												</Collapsible>
												<Collapsible defaultOpen className="space-y-2">
													<CollapsibleTrigger className="group flex w-full items-center justify-center gap-2 py-1.5 px-3 bg-violet-50 hover:bg-violet-100/80 rounded-lg border border-violet-200 transition-colors">
														<span className="text-[11px] font-bold text-violet-500 uppercase tracking-widest">
															{t("calculator.standard_section")}
														</span>
														<ChevronDown className="h-3.5 w-3.5 text-violet-400 transition-transform duration-200 group-data-[state=open]:rotate-180" />
													</CollapsibleTrigger>
													<CollapsibleContent>
														<BitInputSection
															value={inputState}
															onChange={handleInputChange}
														/>
													</CollapsibleContent>
												</Collapsible>
											</>
										)}

										{!isAccumulationMode && (
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
								className={`flex-1 flex flex-col justify-center ${isAccumulationMode && !isConfigOpen ? "-mt-8" : ""}`}
							>
								{isAccumulationMode && (
									<BitResultSection
										sideCount={multiplierState.sideCount}
										sideValues={multiplierState.sideValues}
										activeIndices={multiplierResult}
										isSwapped={multiplierState.isSwapped}
										label={t("calculator.multiplier_result")}
										variant="multiplier"
									/>
								)}

								<BitResultSection
									sideCount={inputState?.sideCount ?? 13}
									sideValues={inputState?.sideValues ?? []}
									activeIndices={calculationResult}
									direction={calculationResult.direction}
									isSwapped={inputState?.isSwapped ?? false}
									label={
										isAccumulationMode
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
