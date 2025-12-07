import { TauriCalculatorService } from "./tauri";
import { WebCalculatorService } from "./wasm";
import { ICalculatorService } from "./interface";

interface TauriWindow extends Window {
    __TAURI_INTERNALS__?: unknown;
}

function hasTauriInternals(win: Window): win is TauriWindow {
    return '__TAURI_INTERNALS__' in win;
}

const isTauriCheck = hasTauriInternals(window) && !!window.__TAURI_INTERNALS__;
export const calculatorService: ICalculatorService = isTauriCheck
    ? new TauriCalculatorService()
    : new WebCalculatorService();

export * from "./interface";
