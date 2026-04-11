import { createContext, type ReactNode, useContext, useState } from "react";
import { dispatchTauriAppStateAction, useTauriAppStateSlice } from "@/lib/tauri-app-state";
import { isTauri } from "@/services";
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
	setDefaultResults: (results: TNTResult[]) => void;
	simulator: SimulatorState;
	updateDefaultInput: (
		field: keyof CalculatorInputs,
		value: string | number[] | boolean,
	) => void;
	updateDefaultTrace: (data: Partial<CalculatorState["trace"]>) => void;
	updateBitCalculation: (
		data: Partial<CalculatorState["trace"]["bitCalculation"]>,
	) => void;
	resetDefaultCalculator: () => void;
	updateSimulatorConfig: (config: SimulatorConfig) => void;
	updateSimulatorTrace: (data: Partial<SimulatorState["trace"]>) => void;
	resetSimulatorConfig: () => void;
}

const initialDefaultInputs: CalculatorInputs = {
	pearlX: "",
	pearlZ: "",
	destX: "",
	planeInterceptY: false,
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
	planeInterceptY: false,
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
	tntC: {
		pos: { x: 0, y: 0, z: 0 },
		amount: 0,
	},
	tntD: {
		pos: { x: 0, y: 0, z: 0 },
		amount: 0,
	},
};

const CalculatorStateContext = createContext<
	CalculatorStateContextType | undefined
>(undefined);

function TauriCalculatorStateProvider({ children }: { children: ReactNode }) {
	const defaultCalculator = useTauriAppStateSlice(
		(snapshot) => snapshot.calculator.defaultCalculator,
	);
	const simulator = useTauriAppStateSlice(
		(snapshot) => snapshot.calculator.simulator,
	);

	return (
		<CalculatorStateContext.Provider
			value={{
				defaultCalculator,
				setDefaultResults: (results) => {
					void dispatchTauriAppStateAction({
						type: "setDefaultResults",
						results,
					}).catch((error) => {
						console.error("Failed to persist calculation results", error);
					});
				},
				simulator,
				updateDefaultInput: (field, value) => {
					void dispatchTauriAppStateAction({
						type: "updateDefaultInput",
						field,
						value,
					});
				},
				updateDefaultTrace: (data) => {
					void dispatchTauriAppStateAction({
						type: "updateDefaultTrace",
						patch: data,
					});
				},
				updateBitCalculation: (data) => {
					if (data.show !== undefined) {
						void dispatchTauriAppStateAction({
							type: "updateBitCalculation",
							show: data.show,
						});
					}
				},
				resetDefaultCalculator: () => {
					void dispatchTauriAppStateAction({
						type: "resetDefaultCalculator",
					});
				},
				updateSimulatorConfig: (config) => {
					void dispatchTauriAppStateAction({
						type: "setSimulatorConfig",
						config,
					});
				},
				updateSimulatorTrace: (data) => {
					void dispatchTauriAppStateAction({
						type: "updateSimulatorTrace",
						patch: data,
					});
				},
				resetSimulatorConfig: () => {
					void dispatchTauriAppStateAction({
						type: "resetSimulatorConfig",
					});
				},
			}}
		>
			{children}
		</CalculatorStateContext.Provider>
	);
}

function WebCalculatorStateProvider({ children }: { children: ReactNode }) {
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
		inputs: initialDefaultInputs,
		config: emptySimulatorConfig,
		trace: {
			data: null,
			direction: "",
			tnt: null,
			show: false,
		},
	});

	const updateDefaultInput = (
		field: keyof CalculatorInputs,
		value: string | number[] | boolean,
	) => {
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
				setDefaultResults: (results) => {
					setDefaultCalculator((prev) => ({ ...prev, results }));
				},
				simulator,
				updateDefaultInput,
				updateDefaultTrace,
				updateBitCalculation,
				resetDefaultCalculator,
				updateSimulatorConfig,
				updateSimulatorTrace,
				resetSimulatorConfig,
			}}
		>
			{children}
		</CalculatorStateContext.Provider>
	);
}

export function CalculatorStateProvider({ children }: { children: ReactNode }) {
	if (isTauri) {
		return <TauriCalculatorStateProvider>{children}</TauriCalculatorStateProvider>;
	}

	return <WebCalculatorStateProvider>{children}</WebCalculatorStateProvider>;
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
