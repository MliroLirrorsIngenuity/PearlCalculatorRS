import type { CalculatorFields } from "@/plugins/pearlcalc-plugin";

export interface AppBridge {
	navigate(path: string): void;
	setCalculatorField<K extends keyof CalculatorFields>(
		field: K,
		value: CalculatorFields[K],
	): void;
}

let bridge: AppBridge | null = null;

export function registerAppBridge(next: AppBridge | null) {
	bridge = next;
}

export function appBridge() {
	if (!bridge) throw new Error("The app is not ready");
	return bridge;
}
