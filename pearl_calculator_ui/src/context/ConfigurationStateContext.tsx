import { createContext, type ReactNode, useContext, useState } from "react";
import type { BitInputState } from "@/types/domain";

export interface DraftConfig {
	max_tnt: string;
	north_west_tnt: { x: string; y: string; z: string };
	north_east_tnt: { x: string; y: string; z: string };
	south_west_tnt: { x: string; y: string; z: string };
	south_east_tnt: { x: string; y: string; z: string };
	pearl_x_position: string;
	pearl_y_motion: string;
	pearl_y_position: string;
	pearl_z_position: string;
}

export const emptyDraftConfig: DraftConfig = {
	max_tnt: "",
	north_west_tnt: { x: "", y: "", z: "" },
	north_east_tnt: { x: "", y: "", z: "" },
	south_west_tnt: { x: "", y: "", z: "" },
	south_east_tnt: { x: "", y: "", z: "" },
	pearl_x_position: "",
	pearl_y_motion: "",
	pearl_y_position: "",
	pearl_z_position: "",
};

interface ConfigurationStateContextType {
	draftConfig: DraftConfig;
	setDraftConfig: (config: DraftConfig) => void;
	cannonCenter: { x: string; z: string };
	setCannonCenter: (center: { x: string; z: string }) => void;
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
	resetDraft: () => void;
}

const ConfigurationStateContext = createContext<
	ConfigurationStateContextType | undefined
>(undefined);

export function ConfigurationStateProvider({
	children,
}: {
	children: ReactNode;
}) {
	const [draftConfig, setDraftConfig] = useState<DraftConfig>(emptyDraftConfig);
	const [cannonCenter, setCannonCenter] = useState({ x: "", z: "" });
	const [pearlMomentum, setPearlMomentum] = useState({ x: "", y: "", z: "" });
	const [redTNTLocation, setRedTNTLocation] = useState<string | undefined>(
		undefined,
	);
	const [bitTemplateState, setBitTemplateState] = useState<
		BitInputState | undefined
	>(undefined);

	const [isWizardActive, setIsWizardActive] = useState(false);
	const [isFinished, setIsFinished] = useState(false);

	const resetDraft = () => {
		setDraftConfig(emptyDraftConfig);
		setCannonCenter({ x: "", z: "" });
		setPearlMomentum({ x: "", y: "", z: "" });
		setRedTNTLocation(undefined);
		setBitTemplateState(undefined);
		setIsWizardActive(false);
		setIsFinished(false);
	};

	return (
		<ConfigurationStateContext.Provider
			value={{
				draftConfig,
				setDraftConfig,
				cannonCenter,
				setCannonCenter,
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
				resetDraft,
			}}
		>
			{children}
		</ConfigurationStateContext.Provider>
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
