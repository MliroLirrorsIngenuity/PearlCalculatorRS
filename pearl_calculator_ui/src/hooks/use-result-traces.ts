import { useEffect, useRef, useState } from "react";
import { useConfig } from "@/context/ConfigContext";
import { useConfigurationState } from "@/context/ConfigurationStateContext";
import {
	buildPearlTraceInput,
	type PearlTraceInputs,
	type TraceTntSelection,
} from "@/hooks/use-pearl-trace";
import { calculatorService } from "@/services";
import type { PearlTraceResult } from "@/types/domain";

type TraceCache = { context: string; traces: Record<string, PearlTraceResult> };

const EMPTY: Record<string, PearlTraceResult> = {};

const previewTicks = (tick: number) => Math.ceil(tick * 1.25) + 5;

export function traceKey(tnt: TraceTntSelection) {
	return `${tnt.blue}:${tnt.red}:${tnt.vertical ?? 0}:${tnt.direction}`;
}

export function useResultTraces(
	inputs: PearlTraceInputs,
	selections: TraceTntSelection[],
) {
	const { configData, version } = useConfig();
	const { calculationMode } = useConfigurationState();
	const [cache, setCache] = useState<TraceCache>({ context: "", traces: {} });
	const requested = useRef({ context: "", keys: new Set<string>() });
	const contextKey = JSON.stringify([
		inputs.pearlX,
		inputs.pearlZ,
		inputs.cannonY,
		inputs.destX,
		inputs.destY,
		inputs.destZ,
		inputs.planeInterceptY,
		configData,
		version,
		calculationMode,
	]);

	useEffect(() => {
		if (requested.current.context !== contextKey) {
			requested.current = { context: contextKey, keys: new Set() };
		}
		const keys = requested.current.keys;
		const pending = selections.filter((tnt) => !keys.has(traceKey(tnt)));
		for (const tnt of pending) keys.add(traceKey(tnt));

		let cancelled = false;
		(async () => {
			for (const tnt of pending) {
				const key = traceKey(tnt);
				if (cancelled) {
					keys.delete(key);
					continue;
				}
				try {
					const trace = await calculatorService.calculatePearlTrace({
						...buildPearlTraceInput(
							inputs,
							tnt,
							configData,
							version,
							calculationMode,
						),
						maxTicks:
							tnt.tick === undefined ? undefined : previewTicks(tnt.tick),
					});
					if (requested.current.context !== contextKey) return;
					setCache((prev) => ({
						context: contextKey,
						traces: {
							...(prev.context === contextKey ? prev.traces : {}),
							[key]: trace,
						},
					}));
				} catch (error) {
					console.error("Preview trace failed:", error);
				}
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [selections, inputs, configData, version, calculationMode, contextKey]);

	return cache.context === contextKey ? cache.traces : EMPTY;
}
