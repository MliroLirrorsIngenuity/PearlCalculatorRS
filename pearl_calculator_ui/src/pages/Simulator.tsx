import { AnimatePresence, motion } from "motion/react";
import TraceDataPanel from "@/components/calculator/results/TraceDataPanel";
import SimulatorInputForm from "@/components/calculator/SimulatorInputForm";
import { Card, CardContent } from "@/components/ui/card";
import { useCalculatorState } from "@/context/CalculatorStateContext";
import { useConfig } from "@/context/ConfigContext";
import { useMobileView } from "@/context/MobileViewContext";
import { useSimulatorTrace } from "@/hooks/use-simulator-trace";

export default function Simulator() {
	const {
		simulator,
		updateSimulatorConfig,
		updateSimulatorTrace,
		resetSimulatorConfig,
	} = useCalculatorState();

	const { version } = useConfig();
	const { calculateSimulatorTrace } = useSimulatorTrace();
	const { isMobile, mobileView, showResults } = useMobileView();

	const pearlTraceData = simulator.trace.data;

	const handleTrace = async () => {
		const result = await calculateSimulatorTrace(simulator.config, version);
		if (result) {
			updateSimulatorTrace({
				data: result,
				show: true,
			});
			if (isMobile) {
				showResults();
			}
		}
	};

	return (
		<div className="h-full w-full">
			<Card className="h-full w-full">
				<CardContent className="flex h-full w-full p-0 relative">
					{!isMobile && (
						<>
							<div className="h-full w-[46.7%] pt-2 px-6 pb-2 flex flex-col overflow-hidden">
								<SimulatorInputForm
									config={simulator.config}
									onConfigChange={updateSimulatorConfig}
									onTrace={handleTrace}
									onReset={resetSimulatorConfig}
								/>
							</div>
							<div className="h-full w-[53.2%] flex flex-col pt-2 pl-1 pr-4 pb-2 gap-2">
								<TraceDataPanel data={pearlTraceData} />
							</div>
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
									className="h-full w-full pt-2 px-6 pb-2 flex flex-col overflow-hidden absolute inset-0"
								>
									<SimulatorInputForm
										config={simulator.config}
										onConfigChange={updateSimulatorConfig}
										onTrace={handleTrace}
										onReset={resetSimulatorConfig}
									/>
								</motion.div>
							)}
							{mobileView === "results" && (
								<motion.div
									key="mobile-results"
									initial={{ opacity: 0, x: 20 }}
									animate={{ opacity: 1, x: 0 }}
									exit={{ opacity: 0, x: 20 }}
									transition={{ duration: 0.15, ease: "easeOut" }}
									className="h-full w-full flex flex-col pt-2 px-4 pb-2 gap-2 absolute inset-0"
								>
									<TraceDataPanel data={pearlTraceData} />
								</motion.div>
							)}
						</AnimatePresence>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
