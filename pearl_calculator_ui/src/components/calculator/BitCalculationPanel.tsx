import { ChevronDown, Settings2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCalculatorState } from "@/context/CalculatorStateContext";
import { useConfig } from "@/context/ConfigContext";
import { useElementSize } from "@/hooks/use-element-size";
import { useToastNotifications } from "@/hooks/use-toast-notifications";
import { calculateBits } from "@/lib/bit-decoder";
import {
	configToInputState,
	inputStateToConfig,
} from "@/lib/bit-template-utils";
import type { BitCalculationResult, BitInputState } from "@/types/domain";
import {
	BitCellGroup,
	HorizontalBitRow,
} from "./BitCellGroup";
import { BitInputSection } from "./BitInputSection";
import { DirectionDisplay } from "./DirectionDisplay";
import {
	ThemeColor,
	calculateRequiredWidth,
} from "./bit-layout-utils";

export default function BitCalculationPanel() {
	const { t } = useTranslation();
	const { bitTemplateConfig, setBitTemplateConfig } = useConfig();
	const { defaultCalculator } = useCalculatorState();
	const { showError } = useToastNotifications();

	const traceTNT = defaultCalculator.trace.tnt;
	const traceDirection = defaultCalculator.trace.direction;

	const initialState = useMemo(
		() => configToInputState(bitTemplateConfig),
		[bitTemplateConfig],
	);
	const [inputState, setInputState] = useState<BitInputState | undefined>(
		initialState,
	);

	useEffect(() => {
		setInputState(configToInputState(bitTemplateConfig));
	}, [bitTemplateConfig]);

	const handleInputChange = (state: BitInputState) => {
		setInputState(state);
		setBitTemplateConfig(inputStateToConfig(state));
	};

	const [calculationResult, setCalculationResult] =
		useState<BitCalculationResult>({
			blue: [],
			red: [],
			direction: [false, false],
		});

	const hasTemplateValues = useMemo(() => {
		if (!inputState) return false;
		return inputState.sideValues.some((v) => v && v.trim() !== "");
	}, [inputState]);

	const [isConfigOpen, setIsConfigOpen] = useState(!hasTemplateValues);
	const hasAutoCalculated = useRef(false);

	const { ref: scrollViewportRef, height: viewportHeight } = useElementSize<HTMLDivElement>();
	const { ref: resultContainerRef, width: resultContainerWidth } = useElementSize<HTMLDivElement>();

	const runCalculation = useCallback(() => {
		if (!inputState || !traceTNT) return;

		const result = calculateBits(
			inputState,
			traceTNT.blue,
			traceTNT.red,
			traceDirection,
		);

		if ("error" in result) {
			const { errorKey, errorParams } = result.error;
			if (errorKey) {
				showError(t(errorKey as any, errorParams as any));
			}
			return;
		}

		setCalculationResult(result.result);
	}, [inputState, traceTNT, traceDirection, showError, t]);

	useEffect(() => {
		if (hasAutoCalculated.current) return;

		if (inputState && traceTNT) {
			const hasValues = inputState.sideValues.some((v) => v && v.trim() !== "");
			if (hasValues) {
				hasAutoCalculated.current = true;
				runCalculation();
			}
		}
	}, [inputState, traceTNT, runCalculation]);

	const sideCount = inputState?.sideCount ?? 13;
	const isSwapped = inputState?.isSwapped ?? false;
	const getPlaceholder = (index: number) => (index + 1).toString();

	const topTheme: ThemeColor = isSwapped ? "red" : "blue";
	const botTheme: ThemeColor = isSwapped ? "blue" : "red";

	const topResultValues = useMemo(
		() =>
			Array(sideCount)
				.fill(0)
				.map((_, i) => {
					const val = inputState?.sideValues[i];
					return val && val.trim() !== "" ? val : getPlaceholder(i);
				}),
		[sideCount, inputState?.sideValues],
	);

	const botResultValues = useMemo(
		() =>
			Array(sideCount)
				.fill(0)
				.map((_, i) => {
					const idx = sideCount - 1 - i;
					const val = inputState?.sideValues[idx];
					return val && val.trim() !== "" ? val : getPlaceholder(idx);
				}),
		[sideCount, inputState?.sideValues],
	);

	const topActiveIndices =
		topTheme === "blue" ? calculationResult.blue : calculationResult.red;
	const botActiveIndices = useMemo(
		() =>
			(botTheme === "blue"
				? calculationResult.blue
				: calculationResult.red
			).map((idx) => sideCount - 1 - idx),
		[botTheme, calculationResult.blue, calculationResult.red, sideCount],
	);

	const useHorizontalLayout =
		resultContainerWidth >= calculateRequiredWidth(sideCount);

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
								className="space-y-2 shrink-0"
							>
								<CollapsibleTrigger className="group flex w-full items-center justify-between py-2 hover:bg-slate-50 rounded-lg transition-colors px-1">
									<h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
										<Settings2 className="h-4 w-4" />
										{t("breadcrumb.bit_calculation")}
									</h3>
									<ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
								</CollapsibleTrigger>

								<CollapsibleContent>
									<div className="pt-2">
										<BitInputSection
											value={inputState}
											onChange={handleInputChange}
											showCalculateButton
											calculateButtonLabel={t("calculator.bit_calculate_btn")}
											onCalculate={runCalculation}
										/>
									</div>
								</CollapsibleContent>
							</Collapsible>

							<div className="flex items-center gap-4 py-2 shrink-0">
								<div className="h-px flex-1 bg-slate-200 border-t border-dashed border-slate-300" />
								<Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">
									Calculation Result
								</Label>
								<div className="h-px flex-1 bg-slate-200 border-t border-dashed border-slate-300" />
							</div>

							<div
								ref={resultContainerRef}
								className="flex-1 flex flex-col justify-center items-center w-full gap-4 pb-4"
							>
								{useHorizontalLayout ? (
									<div className="flex justify-center items-center gap-2 w-full">
										<HorizontalBitRow
											values={topResultValues}
											activeIndices={topActiveIndices}
											theme={topTheme}
											arrowPosition="right"
										/>
										<DirectionDisplay direction={calculationResult.direction} />
										<HorizontalBitRow
											values={botResultValues}
											activeIndices={botActiveIndices}
											theme={botTheme}
											arrowPosition="left"
										/>
									</div>
								) : (
									<>
										<DirectionDisplay
											direction={calculationResult.direction}
											label={t("calculator.direction_label")}
										/>
										<div className="space-y-2 w-full">
											<div className="flex justify-center items-center gap-2 px-4">
												<BitCellGroup
													values={topResultValues}
													activeIndices={topActiveIndices}
													theme={topTheme}
													arrowPosition="right"
													wrap
													elevated
												/>
											</div>
											<div className="flex justify-center items-center gap-2 px-4">
												<BitCellGroup
													values={botResultValues}
													activeIndices={botActiveIndices}
													theme={botTheme}
													arrowPosition="left"
													wrap
													elevated
												/>
											</div>
										</div>
									</>
								)}
							</div>
						</div>
					</ScrollArea>
				</CardContent>
			</Card>
		</div>
	);
}
