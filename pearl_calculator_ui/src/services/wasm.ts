import { PearlTraceResult, TNTResult } from "@/types/domain";
import {
    CalculationInput,
    ICalculatorService,
    PearlTraceInput,
    RawTraceInput,
} from "./interface";

// Define the WASM module interface for type safety
interface PearlCalculatorWasm {
    calculate_tnt_amount(input: CalculationInput): TNTResult[];
    calculate_pearl_trace(input: PearlTraceInput): PearlTraceResult;
    calculate_raw_trace(input: RawTraceInput): PearlTraceResult;
}

export class WebCalculatorService implements ICalculatorService {
    async calculateTNTAmount(input: CalculationInput): Promise<TNTResult[]> {
        const wasm = await import("pearl_calculator_wasm") as Promise<PearlCalculatorWasm>;
        return (await wasm).calculate_tnt_amount(input);
    }

    async calculatePearlTrace(input: PearlTraceInput): Promise<PearlTraceResult> {
        const wasm = await import("pearl_calculator_wasm");
        return wasm.calculate_pearl_trace(input) as unknown as PearlTraceResult;
    }

    async calculateRawTrace(input: RawTraceInput): Promise<PearlTraceResult> {
        const wasm = await import("pearl_calculator_wasm");
        return wasm.calculate_raw_trace(input) as PearlTraceResult;
    }
}
