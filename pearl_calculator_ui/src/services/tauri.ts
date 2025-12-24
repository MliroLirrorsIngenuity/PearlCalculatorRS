import { invoke } from "@tauri-apps/api/core";
import { writeText, readText } from "@tauri-apps/plugin-clipboard-manager";
import type { PearlTraceResult, TNTResult } from "@/types/domain";
import { PearlTraceResultSchema, TNTResultSchema } from "@/lib/schemas";
import { z } from "zod";
import type {
	CalculationInput,
	ICalculatorService,
	PearlTraceInput,
	RawTraceInput,
} from "./interface";

export class TauriCalculatorService implements ICalculatorService {
	async calculateTNTAmount(input: CalculationInput): Promise<TNTResult[]> {
		const result = await invoke("calculate_tnt_amount_command", { input });
		return z.array(TNTResultSchema).parse(result);
	}

	async calculatePearlTrace(input: PearlTraceInput): Promise<PearlTraceResult> {
		const result = await invoke("calculate_pearl_trace_command", { input });
		return PearlTraceResultSchema.parse(result);
	}

	async calculateRawTrace(input: RawTraceInput): Promise<PearlTraceResult> {
		const result = await invoke("calculate_raw_trace_command", { input });
		return PearlTraceResultSchema.parse(result);
	}

	async copyToClipboard(text: string): Promise<void> {
		await writeText(text);
	}

	async readFromClipboard(): Promise<string> {
		return await readText();
	}
}
