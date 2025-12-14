import { ArrowLeft, ArrowRight, ChevronDown, Settings2 } from "lucide-react";
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
import { useToastNotifications } from "@/hooks/use-toast-notifications";
import { calculateBits } from "@/lib/bit-decoder";
import {
	configToInputState,
	inputStateToConfig,
} from "@/lib/bit-template-utils";
import type { BitCalculationResult, BitInputState } from "@/types/domain";
import type { ThemeColor } from "./BitInputRow";
import { BitInputSection, PLACEHOLDERS } from "./BitInputSection";

interface DirectionDisplayProps {
	direction: [boolean, boolean];
	label?: string;
}

function DirectionDisplay({ direction, label }: DirectionDisplayProps) {
	return (
		<div className="flex justify-center">
			<div className="inline-flex items-center gap-3 px-2 py-2 rounded-2xl border border-slate-200 border-dashed bg-slate-50/50">
				{label && (
					<span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest ml-2 mr-1">
						{label}
					</span>
				)}
				<div className="flex gap-2">
					{direction.map((isActive, idx) => (
						<div
							key={idx}
							className={`w-8 h-8 flex items-center justify-center text-xs font-mono rounded-lg border transition-all duration-300 ${
								isActive
									? "bg-slate-900 border-slate-900 shadow-md text-white font-bold scale-110 z-10"
									: "bg-white border-slate-200 text-slate-300"
							}`}
						>
							{isActive ? "1" : "0"}
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

interface BitCellProps {
	value: string;
	isActive: boolean;
	theme: ThemeColor;
	elevated?: boolean;
}

function BitCell({ value, isActive, theme, elevated = false }: BitCellProps) {
	const activeClass =
		theme === "blue"
			? "bg-blue-500 border-blue-600 shadow-md shadow-blue-200 text-white font-bold scale-110 z-10"
			: "bg-red-500 border-red-600 shadow-md shadow-red-200 text-white font-bold scale-110 z-10";

	const inactiveClass =
		"bg-slate-50 border-slate-200 border-dashed text-slate-300 opacity-50";
	const elevatedClass = elevated ? "-translate-y-0.5" : "";

	return (
		<div
			className={`w-12 h-8 flex items-center justify-center text-xs font-mono rounded-lg border transition-all duration-300 ${
				isActive ? `${activeClass} ${elevatedClass}` : inactiveClass
			}`}
		>
			{value}
		</div>
	);
}

interface BitCellGroupProps {
	values: string[];
	activeIndices: number[];
	theme: ThemeColor;
	arrowPosition: "left" | "right";
	wrap?: boolean;
	elevated?: boolean;
}

function BitCellGroup({
	values,
	activeIndices,
	theme,
	arrowPosition,
	wrap = false,
	elevated = false,
}: BitCellGroupProps) {
	const arrowClass = theme === "blue" ? "text-blue-400" : "text-red-400";
	const containerClass = wrap
		? "flex flex-wrap justify-center gap-1.5"
		: "flex items-center gap-1.5";

	return (
		<div className={`flex items-center gap-1.5 ${wrap ? "" : "shrink-0"}`}>
			{arrowPosition === "left" ? (
				<ArrowLeft className={`w-4 h-4 shrink-0 ${arrowClass}`} />
			) : (
				<ArrowLeft className="w-4 h-4 shrink-0 invisible" />
			)}
			<div className={containerClass}>
				{values.map((val, index) => (
					<BitCell
						key={index}
						value={val}
						isActive={activeIndices.includes(index)}
						theme={theme}
						elevated={elevated}
					/>
				))}
			</div>
			{arrowPosition === "right" ? (
				<ArrowRight className={`w-4 h-4 shrink-0 ${arrowClass}`} />
			) : (
				<ArrowRight className="w-4 h-4 shrink-0 invisible" />
			)}
		</div>
	);
}

interface HorizontalBitRowProps {
	values: string[];
	activeIndices: number[];
	theme: ThemeColor;
	arrowPosition: "left" | "right";
}

function HorizontalBitRow({
	values,
	activeIndices,
	theme,
	arrowPosition,
}: HorizontalBitRowProps) {
	const arrowClass = theme === "blue" ? "text-blue-400" : "text-red-400";

	return (
		<div className="flex items-center gap-1.5 shrink-0">
			{arrowPosition === "left" && (
				<ArrowLeft className={`w-4 h-4 shrink-0 ${arrowClass}`} />
			)}
			{values.map((val, index) => (
				<BitCell
					key={index}
					value={val}
					isActive={activeIndices.includes(index)}
					theme={theme}
				/>
			))}
			{arrowPosition === "right" && (
				<ArrowRight className={`w-4 h-4 shrink-0 ${arrowClass}`} />
			)}
		</div>
	);
}

const LAYOUT_CONSTANTS = {
	CELL_WIDTH: 48 + 6,
	ARROW_WIDTH: 16 + 8,
	DIRECTION_WIDTH: 160,
	PADDING: 40,
};

function calculateRequiredWidth(sideCount: number): number {
	const { CELL_WIDTH, ARROW_WIDTH, DIRECTION_WIDTH, PADDING } =
		LAYOUT_CONSTANTS;
	return (sideCount * CELL_WIDTH + ARROW_WIDTH) * 2 + DIRECTION_WIDTH + PADDING;
}

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

	const scrollViewportRef = useRef<HTMLDivElement | null>(null);
	const resultContainerRef = useRef<HTMLDivElement | null>(null);
	const [viewportHeight, setViewportHeight] = useState<number>(0);
	const [resultContainerWidth, setResultContainerWidth] = useState<number>(0);

	useEffect(() => {
		const viewport = scrollViewportRef.current;
		if (!viewport) return;

		const resizeObserver = new ResizeObserver((entries) => {
			for (const entry of entries) {
				setViewportHeight(entry.contentRect.height);
			}
		});

		resizeObserver.observe(viewport);
		setViewportHeight(viewport.clientHeight);

		return () => resizeObserver.disconnect();
	}, []);

	useEffect(() => {
		const container = resultContainerRef.current;
		if (!container) return;

		const resizeObserver = new ResizeObserver((entries) => {
			for (const entry of entries) {
				setResultContainerWidth(entry.contentRect.width);
			}
		});

		resizeObserver.observe(container);
		setResultContainerWidth(container.clientWidth);

		return () => resizeObserver.disconnect();
	}, []);

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
	const getPlaceholder = (index: number) => PLACEHOLDERS[index] || "0";

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
