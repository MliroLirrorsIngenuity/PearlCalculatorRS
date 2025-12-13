import { createContext, type ReactNode, useContext, useState } from "react";
import type {
	BitTemplateConfig,
	GeneralConfig,
	PearlVersion,
} from "../types/domain";

interface ConfigContextType {
	hasConfig: boolean;
	setHasConfig: (value: boolean) => void;
	version: PearlVersion;
	setVersion: (version: PearlVersion) => void;
	configData: GeneralConfig;
	setConfigData: (data: GeneralConfig) => void;
	configPath: string;
	setConfigPath: (path: string) => void;
	bitTemplateConfig: BitTemplateConfig | null;
	setBitTemplateConfig: (data: BitTemplateConfig | null) => void;
	resetConfig: () => void;
}

const defaultConfig: GeneralConfig = {
	max_tnt: 0,
	north_west_tnt: { x: 0, y: 0, z: 0 },
	north_east_tnt: { x: 0, y: 0, z: 0 },
	south_west_tnt: { x: 0, y: 0, z: 0 },
	south_east_tnt: { x: 0, y: 0, z: 0 },
	pearl_x_position: 0,
	pearl_y_motion: 0,
	pearl_y_position: 0,
	pearl_z_position: 0,
	default_red_tnt_position: "SouthEast",
	default_blue_tnt_position: "SouthEast",
};

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);
export function ConfigProvider({ children }: { children: ReactNode }) {
	const [hasConfig, setHasConfig] = useState(false);
	const [version, setVersion] = useState<PearlVersion>("Post1212");
	const [configData, setConfigData] = useState<GeneralConfig>(defaultConfig);
	const [configPath, setConfigPath] = useState("");
	const [bitTemplateConfig, setBitTemplateConfig] =
		useState<BitTemplateConfig | null>(null);

	const resetConfig = () => {
		setConfigData(defaultConfig);
		setConfigPath("");
		setBitTemplateConfig(null);
		setHasConfig(false);
	};

	return (
		<ConfigContext.Provider
			value={{
				hasConfig,
				setHasConfig,
				version,
				setVersion,
				configData,
				setConfigData,
				configPath,
				setConfigPath,
				bitTemplateConfig,
				setBitTemplateConfig,
				resetConfig,
			}}
		>
			{children}
		</ConfigContext.Provider>
	);
}
export function useConfig() {
	const context = useContext(ConfigContext);
	if (context === undefined) {
		throw new Error("useConfig must be used within a ConfigProvider");
	}
	return context;
}
