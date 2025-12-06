import { TauriCalculatorService } from "./tauri";
import { WebCalculatorService } from "./wasm";
import { ICalculatorService } from "./interface";

const isTauriCheck = !!(window as any).__TAURI_INTERNALS__;

export const calculatorService: ICalculatorService = isTauriCheck
    ? new TauriCalculatorService()
    : new WebCalculatorService();

export * from "./interface";
