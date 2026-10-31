import { useEffect, useRef, useState } from "react";
import { useConfig } from "@/context/ConfigContext";
import { useConfigurationState } from "@/context/ConfigurationStateContext";
import {
	buildPearlTraceInput,
	type PearlTraceInputs,
	type TraceTntSelection,
	tracePearl,
} from "@/hooks/use-pearl-trace";
import { slotSignature, usePluginState } from "@/plugins/store";
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
	const pluginSignature = usePluginState(() => slotSignature("trace"));
	const contextKey = JSON.stringify([
		pluginSignature,
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

		const remaining = new Set(pending.map(traceKey));
		let cancelled = false;
		(async () => {
			for (const tnt of pending) {
				if (cancelled) return;
				const key = traceKey(tnt);
				remaining.delete(key);
				try {
					const trace = await tracePearl({
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
			for (const key of remaining) keys.delete(key);
		};
	}, [selections, inputs, configData, version, calculationMode, contextKey]);

	return cache.context === contextKey ? cache.traces : EMPTY;
}
