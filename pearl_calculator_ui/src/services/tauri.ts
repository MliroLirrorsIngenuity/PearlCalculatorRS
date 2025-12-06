import { invoke } from "@tauri-apps/api/core";
import { PearlTraceResult, TNTResult } from "@/types/domain";
import {
    CalculationInput,
    ICalculatorService,
    PearlTraceInput,
    RawTraceInput,
} from "./interface";

export class TauriCalculatorService implements ICalculatorService {
    async calculateTNTAmount(input: CalculationInput): Promise<TNTResult[]> {
        return invoke<TNTResult[]>("calculate_tnt_amount_command", { input });
    }

    async calculatePearlTrace(input: PearlTraceInput): Promise<PearlTraceResult> {
        return invoke<PearlTraceResult>("calculate_pearl_trace_command", { input });
    }

    async calculateRawTrace(input: RawTraceInput): Promise<PearlTraceResult> {
        return invoke<PearlTraceResult>("calculate_raw_trace_command", { input });
    }
}
