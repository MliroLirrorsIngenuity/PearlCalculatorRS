import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import BitCalculationPanel from "@/components/calculator/BitCalculationPanel";
import ConfigurationDataForm from "@/components/calculator/ConfigurationDataForm";
import PearlTracePanel from "@/components/calculator/PearlTracePanel";
import RightPanel from "@/components/calculator/RightPanel";
import TNTCalculationForm from "@/components/calculator/TNTCalculationForm";
import { ConfigOnboarding } from "@/components/common/ConfigOnboarding";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import SpinnerCircle1 from "@/components/ui/spinner-circle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCalculatorState } from "@/context/CalculatorStateContext";
import { useConfig } from "@/context/ConfigContext";
import { useConfigurationState } from "@/context/ConfigurationStateContext";
import { useMobileView } from "@/context/MobileViewContext";
import { useTNTCalculator } from "@/hooks/use-calculator";
import { usePearlTrace } from "@/hooks/use-pearl-trace";
import { useToastNotifications } from "@/hooks/use-toast-notifications";
import {
	defaultDistanceRange,
	defaultTickRange,
	sameRange,
} from "@/lib/calculator-defaults";
import {
	type CalculatorTab,
	setCalculatorTab,
	useCalculatorTab,
} from "@/lib/calculator-tab";
import type { CalculatorInputs } from "@/types/domain";

function InputTabs({
	onCalculate,
	isCalculating,
}: {
	onCalculate: () => void;
	isCalculating: boolean;
}) {
	const { t } = useTranslation();
	const tab = useCalculatorTab();
	const { configData, setConfigData } = useConfig();
	const { defaultCalculator, updateDefaultInput } = useCalculatorState();
	const inputs = defaultCalculator.inputs;
	const updateInput = (field: keyof CalculatorInputs, value: any) =>
		updateDefaultInput(field, value);

	return (
		<>
			<Tabs
				value={tab}
				onValueChange={(value) => setCalculatorTab(value as CalculatorTab)}
				className="flex min-h-0 flex-1 flex-col gap-3.5"
			>
				<TabsList className="grid h-[34px] w-full grid-cols-2">
					<TabsTrigger value="general" className="text-[13px]">
						{t("calculator.tab_general")}
					</TabsTrigger>
					<TabsTrigger value="config" className="text-[13px]">
						{t("calculator.tab_configuration")}
					</TabsTrigger>
				</TabsList>
				<TabsContent value="general" className="min-h-0 flex-1 overflow-hidden">
					<TNTCalculationForm inputs={inputs} onInputChange={updateInput} />
				</TabsContent>
				<TabsContent value="config" className="min-h-0 flex-1 overflow-hidden">
					<ConfigurationDataForm
						config={configData}
						cannonYDisplay={inputs.cannonY}
						onConfigChange={setConfigData}
						onCannonYChange={(v) => updateInput("cannonY", v)}
					/>
				</TabsContent>
			</Tabs>
			<Button
				className="mt-2 w-full"
				onClick={onCalculate}
				disabled={isCalculating}
			>
				{isCalculating ? <SpinnerCircle1 /> : t("calculator.calculate_btn")}
			</Button>
		</>
	);
}

function CalculatorContent() {
	const { t } = useTranslation();
	const { hasConfig, configData, version } = useConfig();
	const {
		defaultCalculator,
		updateDefaultInput,
		updateDefaultTrace,
		setDefaultResults,
	} = useCalculatorState();
	const { calculationMode } = useConfigurationState();
	const { isMobile, mobileView, showResults } = useMobileView();
	const { calculate, isCalculating } = useTNTCalculator();
	const { calculatePearlTrace } = usePearlTrace();
	const { showSuccess, showError } = useToastNotifications();

	const inputs = defaultCalculator.inputs;
	const trace = defaultCalculator.trace;
	const isFirstRender = useRef(true);
	const prevPlaneInterceptY = useRef(inputs.planeInterceptY);
	const savedTickRange = useRef<[number, number] | null>(null);
	const savedDistanceRange = useRef<[number, number] | null>(null);

	useEffect(() => {
		isFirstRender.current = false;
	}, []);

	useEffect(() => {
		if (prevPlaneInterceptY.current === inputs.planeInterceptY) return;
		if (inputs.planeInterceptY) {
			savedTickRange.current = [inputs.tickRange[0], inputs.tickRange[1]];
			savedDistanceRange.current = [
				inputs.distanceRange[0],
				inputs.distanceRange[1],
			];
			if (!sameRange(inputs.tickRange, [0, 10000])) {
				updateDefaultInput("tickRange", [0, 10000]);
			}
			if (!sameRange(inputs.distanceRange, [0, 50])) {
				updateDefaultInput("distanceRange", [0, 50]);
			}
		} else {
			updateDefaultInput(
				"tickRange",
				savedTickRange.current ?? defaultTickRange(calculationMode),
			);
			updateDefaultInput(
				"distanceRange",
				savedDistanceRange.current ?? defaultDistanceRange(calculationMode),
			);
			savedTickRange.current = null;
			savedDistanceRange.current = null;
		}
		prevPlaneInterceptY.current = inputs.planeInterceptY;
	}, [
		calculationMode,
		inputs.planeInterceptY,
		inputs.tickRange,
		inputs.distanceRange,
		updateDefaultInput,
	]);

	const handleRunCalculation = async () => {
		const result = await calculate(
			inputs,
			configData,
			version,
			calculationMode,
		);
		if (!result.success) {
			showError(t("error.calculator.calc_failed"), result.error);
			return;
		}
		setDefaultResults(result.data);
		showSuccess(
			t("calculator.toast_found_configs", { count: result.data.length }),
		);
		if (isMobile) showResults();
	};

	const handlePearlTrace = async (
		red: number,
		blue: number,
		direction: string,
		vertical?: number,
	) => {
		const result = await calculatePearlTrace(inputs, {
			red,
			blue,
			direction,
			vertical,
		});
		if (result) {
			updateDefaultTrace({
				data: result,
				direction,
				tnt: { blue, red, total: blue + red + (vertical ?? 0), vertical },
				show: true,
			});
		}
	};

	if (!hasConfig) return <ConfigOnboarding />;

	const inputPanel = (
		<InputTabs
			onCalculate={handleRunCalculation}
			isCalculating={isCalculating}
		/>
	);
	const resultsPanel = (
		<RightPanel
			results={defaultCalculator.results}
			inputs={inputs}
			onTrace={handlePearlTrace}
		/>
	);

	return (
		<div className="h-full w-full overflow-hidden">
			<motion.div
				initial={
					isFirstRender.current
						? false
						: { opacity: 0, y: 20, filter: "blur(10px)" }
				}
				animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
				transition={{ duration: 0.25, ease: "easeOut" }}
				className="h-full w-full"
			>
				<Card className="relative h-full w-full overflow-hidden">
					<AnimatePresence>
						{trace.show && (
							<motion.div
								key="pearl-trace"
								initial={{ opacity: 0, scale: 0.98 }}
								animate={{ opacity: 1, scale: 1 }}
								exit={{ opacity: 0, scale: 0.98 }}
								transition={{ duration: 0.2 }}
								className="absolute inset-0 z-10"
							>
								<PearlTracePanel />
							</motion.div>
						)}
						{trace.show && trace.bitCalculation?.show && (
							<motion.div
								key="bit-calculation"
								initial={{ opacity: 0, scale: 0.98 }}
								animate={{ opacity: 1, scale: 1 }}
								exit={{ opacity: 0, scale: 0.98 }}
								transition={{ duration: 0.2 }}
								className="absolute inset-0 z-20"
							>
								<BitCalculationPanel />
							</motion.div>
						)}
					</AnimatePresence>

					<CardContent className="relative flex h-full w-full p-0">
						{!isMobile && (
							<>
								<div className="isolate flex h-full w-[min(440px,46.7%)] shrink-0 flex-col px-6 pt-2 pb-2">
									{inputPanel}
								</div>
								<div className="h-full min-w-0 flex-1">{resultsPanel}</div>
							</>
						)}
						{isMobile && (
							<AnimatePresence mode="wait">
								{mobileView === "input" && (
									<motion.div
										key="mobile-input"
										initial={{ opacity: 0, x: -20 }}
										animate={{ opacity: 1, x: 0 }}
										exit={{ opacity: 0, x: -20 }}
										transition={{ duration: 0.025, ease: "easeOut" }}
										className="absolute inset-0 isolate flex h-full w-full flex-col px-6 pt-2 pb-2"
									>
										{inputPanel}
									</motion.div>
								)}
								{mobileView === "results" && (
									<motion.div
										key="mobile-results"
										initial={{ opacity: 0, x: 20 }}
										animate={{ opacity: 1, x: 0 }}
										exit={{ opacity: 0, x: 20 }}
										transition={{ duration: 0.2, ease: "easeOut" }}
										className="absolute inset-0 h-full w-full"
									>
										{resultsPanel}
									</motion.div>
								)}
							</AnimatePresence>
						)}
					</CardContent>
				</Card>
			</motion.div>
		</div>
	);
}

export default function Calculator() {
	return <CalculatorContent />;
}
