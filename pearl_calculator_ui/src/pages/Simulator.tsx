import { AnimatePresence, motion } from "motion/react";
import SimulatorInputForm from "@/components/calculator/SimulatorInputForm";
import { SimulatorResults } from "@/components/calculator/SimulatorResults";
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
							<div className="flex h-full w-[min(440px,46.7%)] shrink-0 flex-col overflow-hidden px-6 pt-2 pb-2">
								<SimulatorInputForm
									config={simulator.config}
									onConfigChange={updateSimulatorConfig}
									onTrace={handleTrace}
									onReset={resetSimulatorConfig}
								/>
							</div>
							<div className="flex h-full min-w-0 flex-1 flex-col gap-2 pt-2 pr-4 pb-2 pl-1">
								<SimulatorResults
									trace={pearlTraceData}
									className="min-h-0 flex-1"
								/>
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
									<SimulatorResults
										trace={pearlTraceData}
										className="min-h-0 flex-1"
									/>
								</motion.div>
							)}
						</AnimatePresence>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
