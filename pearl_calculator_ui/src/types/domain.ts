import { z } from "zod";
import {
	BitCalculationResultSchema,
	BitDirectionSchema,
	BitInputStateSchema,
	BitTemplateConfigSchema,
	CalculatorInputsSchema,
	CannonModeSchema,
	GeneralConfigSchema,
	MaskGroupSchema,
	MultiplierBitInputStateSchema,
	MultiplierConfigSchema,
	PearlTraceResultSchema,
	PearlVersionSchema,
	SimulatorConfigSchema,
	TNTResultSchema,
	TraceTNTSchema,
} from "@/lib/schemas";

export type PearlVersion = z.infer<typeof PearlVersionSchema>;

export type CannonMode = z.infer<typeof CannonModeSchema>;

export type TNTResult = z.infer<typeof TNTResultSchema>;

export type PearlTraceResult = z.infer<typeof PearlTraceResultSchema>;

export type TraceTNT = z.infer<typeof TraceTNTSchema>;

export type GeneralConfig = z.infer<typeof GeneralConfigSchema>;

export type SimulatorConfig = z.infer<typeof SimulatorConfigSchema>;

export type CalculatorInputs = z.infer<typeof CalculatorInputsSchema>;

export type MaskGroup = z.infer<typeof MaskGroupSchema>;

export type BitCalculationResult = z.infer<typeof BitCalculationResultSchema>;

export type BitDirection = z.infer<typeof BitDirectionSchema>;

export type BitTemplateConfig = z.infer<typeof BitTemplateConfigSchema>;

export type BitInputState = z.infer<typeof BitInputStateSchema>;

export type MultiplierBitInputState = z.infer<
	typeof MultiplierBitInputStateSchema
>;

export type MultiplierConfig = z.infer<typeof MultiplierConfigSchema>;
