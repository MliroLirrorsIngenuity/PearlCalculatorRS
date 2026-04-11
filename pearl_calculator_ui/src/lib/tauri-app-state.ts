import { invoke } from "@tauri-apps/api/core";
import { useEffect, useSyncExternalStore } from "react";
import type {
	BitInputState,
	BitTemplateConfig,
	CalculatorInputs,
	CannonMode,
	GeneralConfig,
	MultiplierBitInputState,
	MultiplierConfig,
	PearlTraceResult,
	PearlVersion,
	SimulatorConfig,
	TNTResult,
	TraceTNT,
} from "@/types/domain";

interface DraftVector3 {
	x: string;
	y: string;
	z: string;
}

interface DraftConfigState {
	max_tnt: string;
	north_west_tnt: DraftVector3;
	north_east_tnt: DraftVector3;
	south_west_tnt: DraftVector3;
	south_east_tnt: DraftVector3;
	vertical_tnt: DraftVector3;
	max_vertical_tnt: string;
	pearl_x_position: string;
	pearl_x_motion: string;
	pearl_y_motion: string;
	pearl_z_motion: string;
	pearl_y_position: string;
	pearl_z_position: string;
}

interface ConfigStateSnapshot {
	hasConfig: boolean;
	version: PearlVersion;
	configData: GeneralConfig;
	configPath: string;
	bitTemplateConfig: BitTemplateConfig | null;
	multiplierConfig: MultiplierConfig | null;
}

interface ConfigurationStateSnapshot {
	draftConfig: DraftConfigState;
	cannonCenter: { x: string; z: string };
	pearlMomentum: { x: string; y: string; z: string };
	redTntLocation: string | undefined;
	bitTemplateState: BitInputState | undefined;
	isWizardActive: boolean;
	isFinished: boolean;
	isBitConfigSkipped: boolean;
	savedPath: string | null;
	calculationMode: CannonMode;
	wizardMode: CannonMode;
	multiplierBitState: MultiplierBitInputState | undefined;
	isMultiplierConfigSkipped: boolean;
}

interface CalculatorTraceState {
	data: PearlTraceResult | null;
	direction: string;
	tnt: TraceTNT | null;
	show: boolean;
	bitCalculation: {
		show: boolean;
	};
}

interface DefaultCalculatorStateSnapshot {
	inputs: CalculatorInputs;
	results: TNTResult[];
	trace: CalculatorTraceState;
}

interface SimulatorStateSnapshot {
	inputs: CalculatorInputs;
	config: SimulatorConfig;
	trace: {
		data: PearlTraceResult | null;
		direction: string;
		tnt: TraceTNT | null;
		show: boolean;
	};
}

interface CalculatorStoreSnapshot {
	defaultCalculator: DefaultCalculatorStateSnapshot;
	simulator: SimulatorStateSnapshot;
}

export interface AppStateSnapshot {
	config: ConfigStateSnapshot;
	configuration: ConfigurationStateSnapshot;
	calculator: CalculatorStoreSnapshot;
}

const defaultGeneralConfig: GeneralConfig = {
	max_tnt: 0,
	north_west_tnt: { x: 0, y: 0, z: 0 },
	north_east_tnt: { x: 0, y: 0, z: 0 },
	south_west_tnt: { x: 0, y: 0, z: 0 },
	south_east_tnt: { x: 0, y: 0, z: 0 },
	pearl_x_position: 0,
	pearl_x_motion: 0,
	pearl_y_motion: 0,
	pearl_z_motion: 0,
	pearl_y_position: 0,
	pearl_z_position: 0,
	default_red_tnt_position: "SouthEast",
	default_blue_tnt_position: "SouthEast",
};

const defaultDraftConfig: DraftConfigState = {
	max_tnt: "",
	north_west_tnt: { x: "", y: "", z: "" },
	north_east_tnt: { x: "", y: "", z: "" },
	south_west_tnt: { x: "", y: "", z: "" },
	south_east_tnt: { x: "", y: "", z: "" },
	vertical_tnt: { x: "", y: "", z: "" },
	max_vertical_tnt: "",
	pearl_x_position: "",
	pearl_x_motion: "",
	pearl_y_motion: "",
	pearl_z_motion: "",
	pearl_y_position: "",
	pearl_z_position: "",
};

const defaultCalculatorInputs: CalculatorInputs = {
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

const defaultSimulatorConfig: SimulatorConfig = {
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

const defaultSnapshot: AppStateSnapshot = {
	config: {
		hasConfig: false,
		version: "Post1212",
		configData: defaultGeneralConfig,
		configPath: "",
		bitTemplateConfig: null,
		multiplierConfig: null,
	},
	configuration: {
		draftConfig: defaultDraftConfig,
		cannonCenter: { x: "", z: "" },
		pearlMomentum: { x: "", y: "", z: "" },
		redTntLocation: undefined,
		bitTemplateState: undefined,
		isWizardActive: false,
		isFinished: false,
		isBitConfigSkipped: false,
		savedPath: null,
		calculationMode: "Standard",
		wizardMode: "Standard",
		multiplierBitState: undefined,
		isMultiplierConfigSkipped: false,
	},
	calculator: {
		defaultCalculator: {
			inputs: defaultCalculatorInputs,
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
		},
		simulator: {
			inputs: defaultCalculatorInputs,
			config: defaultSimulatorConfig,
			trace: {
				data: null,
				direction: "",
				tnt: null,
				show: false,
			},
		},
	},
};

let currentSnapshot = defaultSnapshot;
let initializePromise: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emit() {
	for (const listener of listeners) {
		listener();
	}
}

export function subscribeTauriAppState(listener: () => void) {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
}

export function getTauriAppStateSnapshot() {
	return currentSnapshot;
}

export async function ensureTauriAppStateLoaded() {
	if (!initializePromise) {
		initializePromise = invoke<AppStateSnapshot>("get_app_state")
			.then((snapshot) => {
				currentSnapshot = snapshot;
				emit();
			})
			.catch((error) => {
				initializePromise = null;
				throw error;
			});
	}
	return initializePromise;
}

export async function dispatchTauriAppStateAction(action: unknown) {
	const snapshot = await invoke<AppStateSnapshot>("dispatch_app_state_action", {
		action,
	});
	currentSnapshot = snapshot;
	emit();
	return snapshot;
}

export function useTauriAppStateSlice<T>(
	selector: (snapshot: AppStateSnapshot) => T,
) {
	const slice = useSyncExternalStore(
		subscribeTauriAppState,
		() => selector(currentSnapshot),
		() => selector(defaultSnapshot),
	);

	useEffect(() => {
		void ensureTauriAppStateLoaded();
	}, []);

	return slice;
}
