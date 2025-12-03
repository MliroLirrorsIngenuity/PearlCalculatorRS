import TraceDataPanel from "@/components/calculator/results/TraceDataPanel";
import SimulatorInputForm from "@/components/calculator/SimulatorInputForm";
import { Card, CardContent } from "@/components/ui/card";
import { useCalculatorState } from "@/context/CalculatorStateContext";
import { useConfig } from "@/context/ConfigContext";
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

	const pearlTraceData = simulator.trace.data;

	const handleTrace = async () => {
		const result = await calculateSimulatorTrace(simulator.config, version);
		if (result) {
			updateSimulatorTrace({
				data: result,
				show: true,
			});
		}
	};

	return (
		<div className="h-full w-full">
			<Card className="h-full w-full">
				<CardContent className="flex h-full w-full p-0">
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
				</CardContent>
			</Card>
		</div>
	);
}
