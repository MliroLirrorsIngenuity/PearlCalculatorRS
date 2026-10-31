import { useEffect, useRef } from "react";
import { useCalculatorState } from "@/context/CalculatorStateContext";
import { useConfig } from "@/context/ConfigContext";
import { useConfigurationState } from "@/context/ConfigurationStateContext";
import {
	defaultDistanceRange,
	defaultTickRange,
	sameRange,
} from "@/lib/calculator-defaults";

export function useCalculatorSync() {
	const { calculationMode } = useConfigurationState();
	const { configData } = useConfig();
	const {
		defaultCalculator,
		updateDefaultInput,
		setDefaultResults,
		updateDefaultTrace,
		updateBitCalculation,
	} = useCalculatorState();
	const { inputs, results, trace } = defaultCalculator;
	const previousMode = useRef(calculationMode);
	const geometry = JSON.stringify([
		calculationMode,
		configData,
		inputs.cannonY,
		inputs.pearlX,
		inputs.pearlZ,
	]);
	const previousGeometry = useRef(geometry);

	useEffect(() => {
		const previous = previousMode.current;
		if (previous === calculationMode) return;
		previousMode.current = calculationMode;
		if (sameRange(inputs.tickRange, defaultTickRange(previous))) {
			updateDefaultInput("tickRange", defaultTickRange(calculationMode));
		}
		if (sameRange(inputs.distanceRange, defaultDistanceRange(previous))) {
			updateDefaultInput(
				"distanceRange",
				defaultDistanceRange(calculationMode),
			);
		}
	}, [
		calculationMode,
		inputs.tickRange,
		inputs.distanceRange,
		updateDefaultInput,
	]);

	useEffect(() => {
		if (previousGeometry.current === geometry) return;
		previousGeometry.current = geometry;
		if (results.length > 0) setDefaultResults([]);
		if (trace.show) {
			updateBitCalculation({ show: false });
			updateDefaultTrace({ show: false });
		}
	}, [
		geometry,
		results.length,
		trace.show,
		setDefaultResults,
		updateBitCalculation,
		updateDefaultTrace,
	]);
}
