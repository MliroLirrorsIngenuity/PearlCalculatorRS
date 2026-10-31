import { useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import {
	PluginConfirmDialog,
	PluginLoadDialog,
} from "@/components/plugins/PluginConfirmDialog";
import { useCalculatorState } from "@/context/CalculatorStateContext";
import { useConfig } from "@/context/ConfigContext";
import { useConfigurationState } from "@/context/ConfigurationStateContext";
import { registerAppBridge } from "@/plugins/app-bridge";
import type { CannonConfig } from "@/plugins/pearlcalc-plugin";
import { setAppContext } from "@/plugins/store";

export function PluginHostBridge() {
	const { hasConfig, configData, version } = useConfig();
	const { calculationMode } = useConfigurationState();
	const { defaultCalculator, updateDefaultInput } = useCalculatorState();
	const navigate = useNavigate();
	const calculator = defaultCalculator.inputs;
	const handlers = useRef({ navigate, updateDefaultInput });
	handlers.current = { navigate, updateDefaultInput };

	useEffect(() => {
		setAppContext({
			version,
			mode: calculationMode,
			config: hasConfig ? (configData as CannonConfig) : null,
			calculator,
		});
	}, [version, calculationMode, hasConfig, configData, calculator]);

	useEffect(() => {
		registerAppBridge({
			navigate: (path) => handlers.current.navigate(path),
			setCalculatorField: (field, value) =>
				handlers.current.updateDefaultInput(field, value as never),
		});
		return () => registerAppBridge(null);
	}, []);

	return (
		<>
			<PluginLoadDialog />
			<PluginConfirmDialog />
		</>
	);
}
