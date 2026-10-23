import { useSyncExternalStore } from "react";

export type CalculatorTab = "general" | "config";

let current: CalculatorTab = "general";
const listeners = new Set<() => void>();

export function setCalculatorTab(tab: CalculatorTab) {
	current = tab;
	for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
	listeners.add(listener);
	return () => listeners.delete(listener);
}

export function useCalculatorTab() {
	return useSyncExternalStore(subscribe, () => current);
}
