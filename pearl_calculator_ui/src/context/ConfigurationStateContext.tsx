import { createContext, type ReactNode, useContext, useState } from "react";
import {
	dispatchTauriAppStateAction,
	useTauriAppStateSlice,
} from "@/lib/tauri-app-state";
import { isTauri } from "@/services";
import type {
	BitInputState,
	CannonMode,
	MultiplierBitInputState,
} from "@/types/domain";

export interface DraftConfig {
	max_tnt: string;
	north_west_tnt: { x: string; y: string; z: string };
	north_east_tnt: { x: string; y: string; z: string };
	south_west_tnt: { x: string; y: string; z: string };
	south_east_tnt: { x: string; y: string; z: string };
	vertical_tnt: { x: string; y: string; z: string };
	max_vertical_tnt: string;
	pearl_x_position: string;
	pearl_x_motion: string;
	pearl_y_motion: string;
	pearl_z_motion: string;
	pearl_y_position: string;
	pearl_z_position: string;
}

export const emptyDraftConfig: DraftConfig = {
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

interface ConfigurationStateContextType {
	draftConfig: DraftConfig;
	setDraftConfig: (config: DraftConfig) => void;
	pearlMomentum: { x: string; y: string; z: string };
	setPearlMomentum: (momentum: { x: string; y: string; z: string }) => void;
	redTNTLocation: string | undefined;
	setRedTNTLocation: (location: string | undefined) => void;
	bitTemplateState: BitInputState | undefined;
	setBitTemplateState: (state: BitInputState | undefined) => void;
	isWizardActive: boolean;
	setIsWizardActive: (active: boolean) => void;
	isFinished: boolean;
	setIsFinished: (finished: boolean) => void;
	isBitConfigSkipped: boolean;
	setIsBitConfigSkipped: (skipped: boolean) => void;
	savedPath: string | null;
	setSavedPath: (path: string | null) => void;
	calculationMode: CannonMode;
	setCalculationMode: (mode: CannonMode) => void;
	wizardMode: CannonMode;
	setWizardMode: (mode: CannonMode) => void;
	multiplierBitState: MultiplierBitInputState | undefined;
	setMultiplierBitState: (state: MultiplierBitInputState | undefined) => void;
	isMultiplierConfigSkipped: boolean;
	setIsMultiplierConfigSkipped: (skipped: boolean) => void;
	resetDraft: () => void;
}

const ConfigurationStateContext = createContext<
	ConfigurationStateContextType | undefined
>(undefined);

function TauriConfigurationStateProvider({
	children,
}: {
	children: ReactNode;
}) {
	const configuration = useTauriAppStateSlice(
		(snapshot) => snapshot.configuration,
	);

	return (
		<ConfigurationStateContext.Provider
			value={{
				draftConfig: configuration.draftConfig,
				setDraftConfig: (config) => {
					void dispatchTauriAppStateAction({
						type: "setDraftConfig",
						config,
					});
				},
				pearlMomentum: configuration.pearlMomentum,
				setPearlMomentum: (momentum) => {
					void dispatchTauriAppStateAction({
						type: "setPearlMomentum",
						momentum,
					});
				},
				redTNTLocation: configuration.redTntLocation,
				setRedTNTLocation: (location) => {
					void dispatchTauriAppStateAction({
						type: "setRedTntLocation",
						location,
					});
				},
				bitTemplateState: configuration.bitTemplateState,
				setBitTemplateState: (state) => {
					void dispatchTauriAppStateAction({
						type: "setBitTemplateState",
						state,
					});
				},
				isWizardActive: configuration.isWizardActive,
				setIsWizardActive: (active) => {
					void dispatchTauriAppStateAction({
						type: "setIsWizardActive",
						active,
					});
				},
				isFinished: configuration.isFinished,
				setIsFinished: (finished) => {
					void dispatchTauriAppStateAction({
						type: "setIsFinished",
						finished,
					});
				},
				isBitConfigSkipped: configuration.isBitConfigSkipped,
				setIsBitConfigSkipped: (skipped) => {
					void dispatchTauriAppStateAction({
						type: "setIsBitConfigSkipped",
						skipped,
					});
				},
				savedPath: configuration.savedPath,
				setSavedPath: (path) => {
					void dispatchTauriAppStateAction({
						type: "setSavedPath",
						path,
					});
				},
				calculationMode: configuration.calculationMode,
				setCalculationMode: (mode) => {
					void dispatchTauriAppStateAction({
						type: "setCalculationMode",
						mode,
					});
				},
				wizardMode: configuration.wizardMode,
				setWizardMode: (mode) => {
					void dispatchTauriAppStateAction({
						type: "setWizardMode",
						mode,
					});
				},
				multiplierBitState: configuration.multiplierBitState,
				setMultiplierBitState: (state) => {
					void dispatchTauriAppStateAction({
						type: "setMultiplierBitState",
						state,
					});
				},
				isMultiplierConfigSkipped: configuration.isMultiplierConfigSkipped,
				setIsMultiplierConfigSkipped: (skipped) => {
					void dispatchTauriAppStateAction({
						type: "setIsMultiplierConfigSkipped",
						skipped,
					});
				},
				resetDraft: () => {
					void dispatchTauriAppStateAction({
						type: "resetDraft",
					});
				},
			}}
		>
			{children}
		</ConfigurationStateContext.Provider>
	);
}

function WebConfigurationStateProvider({ children }: { children: ReactNode }) {
	const [draftConfig, setDraftConfig] = useState<DraftConfig>(emptyDraftConfig);
	const [pearlMomentum, setPearlMomentum] = useState({ x: "", y: "", z: "" });
	const [redTNTLocation, setRedTNTLocation] = useState<string | undefined>(
		undefined,
	);
	const [bitTemplateState, setBitTemplateState] = useState<
		BitInputState | undefined
	>(undefined);
	const [isWizardActive, setIsWizardActive] = useState(false);
	const [isFinished, setIsFinished] = useState(false);
	const [savedPath, setSavedPath] = useState<string | null>(null);
	const [isBitConfigSkipped, setIsBitConfigSkipped] = useState(false);
	const [calculationMode, setCalculationMode] =
		useState<CannonMode>("Standard");
	const [wizardMode, setWizardMode] = useState<CannonMode>("Standard");
	const [multiplierBitState, setMultiplierBitState] = useState<
		MultiplierBitInputState | undefined
	>(undefined);
	const [isMultiplierConfigSkipped, setIsMultiplierConfigSkipped] =
		useState(false);

	const resetDraft = () => {
		setDraftConfig(emptyDraftConfig);
		setPearlMomentum({ x: "", y: "", z: "" });
		setRedTNTLocation(undefined);
		setBitTemplateState(undefined);
		setIsBitConfigSkipped(false);
		setSavedPath(null);
		setIsWizardActive(false);
		setIsFinished(false);
		setWizardMode("Standard");
		setMultiplierBitState(undefined);
		setIsMultiplierConfigSkipped(false);
	};

	return (
		<ConfigurationStateContext.Provider
			value={{
				draftConfig,
				setDraftConfig,
				pearlMomentum,
				setPearlMomentum,
				redTNTLocation,
				setRedTNTLocation,
				bitTemplateState,
				setBitTemplateState,
				isWizardActive,
				setIsWizardActive,
				isFinished,
				setIsFinished,
				isBitConfigSkipped,
				setIsBitConfigSkipped,
				savedPath,
				setSavedPath,
				calculationMode,
				setCalculationMode,
				wizardMode,
				setWizardMode,
				multiplierBitState,
				setMultiplierBitState,
				isMultiplierConfigSkipped,
				setIsMultiplierConfigSkipped,
				resetDraft,
			}}
		>
			{children}
		</ConfigurationStateContext.Provider>
	);
}

export function ConfigurationStateProvider({
	children,
}: {
	children: ReactNode;
}) {
	if (isTauri) {
		return (
			<TauriConfigurationStateProvider>
				{children}
			</TauriConfigurationStateProvider>
		);
	}

	return (
		<WebConfigurationStateProvider>{children}</WebConfigurationStateProvider>
	);
}

export function useConfigurationState() {
	const context = useContext(ConfigurationStateContext);
	if (context === undefined) {
		throw new Error(
			"useConfigurationState must be used within a ConfigurationStateProvider",
		);
	}
	return context;
}
