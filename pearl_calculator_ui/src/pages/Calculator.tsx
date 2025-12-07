import { FileJson } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef } from "react";
import AdvancedSettingsForm from "@/components/calculator/AdvancedSettingsForm";
import ConfigurationDataForm from "@/components/calculator/ConfigurationDataForm";
import PearlTracePanel from "@/components/calculator/PearlTracePanel";
import RightPanel from "@/components/calculator/RightPanel";
import TNTCalculationForm from "@/components/calculator/TNTCalculationForm";
import { OnboardingPanel } from "@/components/common/OnboardingPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import SpinnerCircle1 from "@/components/ui/spinner-circle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCalculatorState } from "@/context/CalculatorStateContext";
import { useConfig } from "@/context/ConfigContext";
import { useTNTCalculator } from "@/hooks/use-calculator";
import { usePearlTrace } from "@/hooks/use-pearl-trace";
import { useToastNotifications } from "@/hooks/use-toast-notifications";
import { loadConfiguration } from "@/lib/config-service";
import type { CalculatorInputs } from "@/types/domain";

export default function Calculator() {
	const {
		hasConfig,
		setHasConfig,
		configData,
		setConfigData,
		setConfigPath,
		version,
		resetConfig,
	} = useConfig();

	const { t } = useTranslation();

	const {
		defaultCalculator,
		updateDefaultInput,
		updateDefaultTrace,
		setDefaultCalculator,
		resetDefaultCalculator,
	} = useCalculatorState();

	const inputs = defaultCalculator.inputs;
	const calculationResults = defaultCalculator.results;
	const pearlTraceData = defaultCalculator.trace.data;
	const showPearlTrace = defaultCalculator.trace.show;
	const traceDirection = defaultCalculator.trace.direction;
	const traceTNT = defaultCalculator.trace.tnt;

	const updateInput = (field: keyof CalculatorInputs, value: any) => {
		updateDefaultInput(field, value);
	};

	const isFirstRender = useRef(true);
	const { calculate, isCalculating } = useTNTCalculator();
	const { calculatePearlTrace } = usePearlTrace();
	const { showSuccess, showError } = useToastNotifications();

	useEffect(() => {
		isFirstRender.current = false;
	}, []);

	const handleImport = async () => {
		try {
			const result = await loadConfiguration();
			if (result) {
				setConfigData(result.config);
				setConfigPath(result.path);
				setHasConfig(true);

				updateDefaultInput("pearlX", result.config.pearl_x_position.toString());
				updateDefaultInput("pearlZ", result.config.pearl_z_position.toString());
				updateDefaultInput(
					"cannonY",
					Math.floor(result.config.pearl_y_position).toString(),
				);
				updateDefaultInput(
					"offsetX",
					(result.config.offset_x ?? 0).toString(),
				);
				updateDefaultInput(
					"offsetZ",
					(result.config.offset_z ?? 0).toString(),
				);

				showSuccess(t("calculator.toast_config_loaded"));
			}
		} catch (e) {
			console.error("Import error:", e);
			showError(t("calculator.toast_load_failed"), e);
		}
	};

	const handleRunCalculation = async () => {
		const result = await calculate(inputs, configData, version);

		if (result.success) {
			setDefaultCalculator((prev) => ({ ...prev, results: result.data }));
			showSuccess(t("calculator.toast_found_configs", { count: result.data.length }));
		} else {
			showError(t("calculator.toast_calc_failed"), result.error);
		}
	};

	const handlePearlTrace = async (
		red: number,
		blue: number,
		direction: string,
	) => {
		const traceInputs = {
			...inputs,
			red,
			blue,
			direction,
		};
		const result = await calculatePearlTrace(traceInputs, configData, version);
		if (result) {
			updateDefaultTrace({
				data: result,
				direction,
				tnt: { blue, red, total: blue + red },
				show: true,
			});
		}
	};

	if (!hasConfig) {
		return (
			<OnboardingPanel
				icon={<FileJson />}
				title={t("calculator.no_configuration")}
				description={t("calculator.import_config_desc")}
			>
				<Button className="w-48" onClick={handleImport}>
					{t("calculator.import_config_btn")}
				</Button>
				<Button
					className="w-48"
					variant="outline"
					onClick={() => {
						resetConfig();
						resetDefaultCalculator();
						setHasConfig(true);
					}}
				>
					{t("calculator.skip_import")}
				</Button>
			</OnboardingPanel>
		);
	}

	return (
		<div className="h-full w-full overflow-hidden">
			<AnimatePresence mode="wait">
				<motion.div
					key="calculator"
					initial={
						isFirstRender.current
							? false
							: { opacity: 0, y: 20, filter: "blur(10px)" }
					}
					animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
					transition={{ duration: 0.25, ease: "easeOut" }}
					className="h-full w-full"
				>
					<Card className="h-full w-full relative">
						<AnimatePresence mode="wait">
							{showPearlTrace && (
								<motion.div
									key="pearl-trace"
									initial={{ opacity: 0, scale: 0.98 }}
									animate={{ opacity: 1, scale: 1 }}
									exit={{ opacity: 0, scale: 0.98 }}
									transition={{ duration: 0.2 }}
									className="absolute inset-0 z-10"
								>
									<PearlTracePanel
										pearlTraceData={pearlTraceData}
										destX={inputs.destX}
										destZ={inputs.destZ}
										traceDirection={traceDirection}
										traceTNT={traceTNT}
									/>
								</motion.div>
							)}
						</AnimatePresence>

						<CardContent className="flex h-full w-full p-0">
							<div className="h-full w-[46.7%] pt-2 px-6 pb-2 flex flex-col">
								<Tabs
									defaultValue="general"
									className="flex-1 flex flex-col min-h-0"
								>
									<TabsList className="grid w-full grid-cols-3">
										<TabsTrigger value="general">{t("calculator.tab_general")}</TabsTrigger>
										<TabsTrigger value="config">{t("calculator.tab_configuration")}</TabsTrigger>
										<TabsTrigger value="advanced">{t("calculator.tab_advanced")}</TabsTrigger>
									</TabsList>

									<TabsContent
										value="general"
										className="flex-1 overflow-hidden min-h-0"
									>
										<TNTCalculationForm
											inputs={inputs}
											onInputChange={updateInput}
										/>
									</TabsContent>

									<TabsContent
										value="config"
										className="flex-1 overflow-hidden min-h-0"
									>
										<ConfigurationDataForm
											config={configData}
											cannonYDisplay={inputs.cannonY}
											onConfigChange={setConfigData}
											onCannonYChange={(v) => updateInput("cannonY", v)}
										/>
									</TabsContent>

									<TabsContent
										value="advanced"
										className="flex-1 overflow-hidden min-h-0"
									>
										<AdvancedSettingsForm
											inputs={inputs}
											onInputChange={updateInput}
										/>
									</TabsContent>
								</Tabs>

								<Button
									className="w-full mt-2"
									onClick={handleRunCalculation}
									disabled={isCalculating}
								>
									{isCalculating ? <SpinnerCircle1 /> : t("calculator.calculate_btn")}
								</Button>
							</div>

							<div className="h-full w-[53.2%]">
								<RightPanel
									results={calculationResults}
									tickRange={inputs.tickRange}
									distanceRange={inputs.distanceRange}
									onTrace={handlePearlTrace}
								/>
							</div>
						</CardContent>
					</Card>
				</motion.div>
			</AnimatePresence>
		</div>
	);
}
