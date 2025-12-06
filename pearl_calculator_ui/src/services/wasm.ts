import { PearlTraceResult, TNTResult } from "@/types/domain";
import {
    CalculationInput,
    ICalculatorService,
    PearlTraceInput,
    RawTraceInput,
} from "./interface";

export class WebCalculatorService implements ICalculatorService {
    async calculateTNTAmount(input: CalculationInput): Promise<TNTResult[]> {
        const wasm = await import("pearl_calculator_wasm");
        return wasm.calculate_tnt_amount(input) as unknown as TNTResult[];
    }

    async calculatePearlTrace(input: PearlTraceInput): Promise<PearlTraceResult> {
        const wasm = await import("pearl_calculator_wasm");
        return wasm.calculate_pearl_trace(input) as unknown as PearlTraceResult;
    }

    async calculateRawTrace(input: RawTraceInput): Promise<PearlTraceResult> {
        const wasm = await import("pearl_calculator_wasm");
        return wasm.calculate_raw_trace(input) as unknown as PearlTraceResult;
    }
}
