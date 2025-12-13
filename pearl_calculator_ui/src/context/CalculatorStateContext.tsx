import { createContext, type ReactNode, useContext, useState } from "react";
import type {
	CalculatorInputs,
	PearlTraceResult,
	SimulatorConfig,
	TNTResult,
	TraceTNT,
} from "../types/domain";

interface CalculatorState {
	inputs: CalculatorInputs;
	results: TNTResult[];
	trace: {
		data: PearlTraceResult | null;
		direction: string;
		tnt: TraceTNT | null;
		show: boolean;
		bitCalculation: {
			show: boolean;
		};
	};
}

interface SimulatorState {
	inputs: CalculatorInputs;
	config: SimulatorConfig;
	trace: {
		data: PearlTraceResult | null;
		direction: string;
		tnt: TraceTNT | null;
		show: boolean;
	};
}

interface CalculatorStateContextType {
	defaultCalculator: CalculatorState;
	setDefaultCalculator: React.Dispatch<React.SetStateAction<CalculatorState>>;

	simulator: SimulatorState;
	setSimulator: React.Dispatch<React.SetStateAction<SimulatorState>>;

	updateDefaultInput: (field: keyof CalculatorInputs, value: any) => void;

	updateDefaultTrace: (data: Partial<CalculatorState["trace"]>) => void;
	updateBitCalculation: (
		data: Partial<CalculatorState["trace"]["bitCalculation"]>,
	) => void;
	resetDefaultCalculator: () => void;

	updateSimulatorInput: (field: keyof CalculatorInputs, value: any) => void;
	updateSimulatorConfig: (config: SimulatorConfig) => void;
	updateSimulatorTrace: (data: Partial<SimulatorState["trace"]>) => void;
	resetSimulatorConfig: () => void;
}

const initialDefaultInputs: CalculatorInputs = {
	pearlX: "",
	pearlZ: "",
	destX: "",
	destZ: "",
	cannonY: "36",
	offsetX: "0",
	offsetZ: "0",
	tickRange: [0, 20],
	distanceRange: [0, 20],
};

const initialSimulatorInputs: CalculatorInputs = {
	pearlX: "",
	pearlZ: "",
	destX: "",
	destZ: "",
	cannonY: "36",
	offsetX: "0",
	offsetZ: "0",
	tickRange: [0, 20],
	distanceRange: [0, 20],
};

export const emptyCalculatorInputs: CalculatorInputs = {
	pearlX: "",
	pearlZ: "",
	destX: "",
	destZ: "",
	cannonY: "0",
	offsetX: "0",
	offsetZ: "0",
	tickRange: [0, 20],
	distanceRange: [0, 20],
};

export const emptySimulatorConfig: SimulatorConfig = {
	pearl: {
		pos: { x: 0, y: 0, z: 0 },
		momentum: { x: 0, y: 0, z: 0 },
	},
	tntA: {
		pos: { x: 0, y: 0, z: 0 },
		amount: 0,
	},
	tntB: {
		pos: { x: 0, y: 0, z: 0 },
		amount: 0,
	},
};

const CalculatorStateContext = createContext<
	CalculatorStateContextType | undefined
>(undefined);

export function CalculatorStateProvider({ children }: { children: ReactNode }) {
	const [defaultCalculator, setDefaultCalculator] = useState<CalculatorState>({
		inputs: initialDefaultInputs,
		results: [],
		trace: {
			data: null,
			direction: "",
			tnt: null,
			show: false,
			bitCalculation: {
				show: false,
			},
		},
	});

	const [simulator, setSimulator] = useState<SimulatorState>({
		inputs: initialSimulatorInputs,
		config: emptySimulatorConfig,
		trace: {
			data: null,
			direction: "",
			tnt: null,
			show: false,
		},
	});

	const updateDefaultInput = (field: keyof CalculatorInputs, value: any) => {
		setDefaultCalculator((prev) => ({
			...prev,
			inputs: {
				...prev.inputs,
				[field]: value,
			},
		}));
	};

	const updateDefaultTrace = (data: Partial<CalculatorState["trace"]>) => {
		setDefaultCalculator((prev) => ({
			...prev,
			trace: {
				...prev.trace,
				...data,
			},
		}));
	};

	const updateBitCalculation = (
		data: Partial<CalculatorState["trace"]["bitCalculation"]>,
	) => {
		setDefaultCalculator((prev) => ({
			...prev,
			trace: {
				...prev.trace,
				bitCalculation: {
					...prev.trace.bitCalculation,
					...data,
				},
			},
		}));
	};

	const resetDefaultCalculator = () => {
		setDefaultCalculator({
			inputs: emptyCalculatorInputs,
			results: [],
			trace: {
				data: null,
				direction: "",
				tnt: null,
				show: false,
				bitCalculation: {
					show: false,
				},
			},
		});
	};

	const updateSimulatorInput = (field: keyof CalculatorInputs, value: any) => {
		setSimulator((prev) => ({
			...prev,
			inputs: {
				...prev.inputs,
				[field]: value,
			},
		}));
	};

	const updateSimulatorConfig = (config: SimulatorConfig) => {
		setSimulator((prev) => ({
			...prev,
			config,
		}));
	};

	const updateSimulatorTrace = (data: Partial<SimulatorState["trace"]>) => {
		setSimulator((prev) => ({
			...prev,
			trace: {
				...prev.trace,
				...data,
			},
		}));
	};

	const resetSimulatorConfig = () => {
		setSimulator((prev) => ({
			...prev,
			config: emptySimulatorConfig,
			trace: {
				...prev.trace,
				data: null,
				show: false,
			},
		}));
	};

	return (
		<CalculatorStateContext.Provider
			value={{
				defaultCalculator,
				setDefaultCalculator,
				simulator,
				setSimulator,
				updateDefaultInput,
				updateDefaultTrace,
				updateBitCalculation,
				resetDefaultCalculator,
				updateSimulatorInput,
				updateSimulatorConfig,
				updateSimulatorTrace,
				resetSimulatorConfig,
			}}
		>
			{children}
		</CalculatorStateContext.Provider>
	);
}

export function useCalculatorState() {
	const context = useContext(CalculatorStateContext);
	if (context === undefined) {
		throw new Error(
			"useCalculatorState must be used within a CalculatorStateProvider",
		);
	}
	return context;
}
