import type { DraftConfig } from "@/context/ConfigurationStateContext";
import type {
	BitInputState,
	BitTemplateConfig,
	CannonMode,
	GeneralConfig,
	MultiplierBitInputState,
	MultiplierConfig,
} from "@/types/domain";

interface ImportedConfiguration {
	config: GeneralConfig;
	bitTemplate: BitTemplateConfig | null;
	multiplierTemplate: MultiplierConfig | null;
	path: string;
}

interface ConvertedConfigDraft {
	draft: DraftConfig;
	center: { x: string; z: string };
	momentum: { x: string; y: string; z: string };
	redLocation: string | undefined;
}

interface EncodableConfig {
	NorthEastTNT: { X: number; Y: number; Z: number };
	NorthWestTNT: { X: number; Y: number; Z: number };
	SouthEastTNT: { X: number; Y: number; Z: number };
	SouthWestTNT: { X: number; Y: number; Z: number };
	Offset: { X: number; Z: number };
	Pearl: {
		Position: { X: number; Y: number; Z: number };
		Motion: { X: number; Y: number; Z: number };
	};
	MaxTNT: number;
	DefaultRedTNTDirection: string;
	DefaultBlueTNTDirection: string;
	SideMode: number;
	DirectionMasks: Record<string, string>;
	RedValues: number[];
	IsRedArrowCenter: boolean;
}

interface DecodedConfig {
	generalConfig: GeneralConfig;
	bitTemplate: BitTemplateConfig | null;
}

interface UtilsRustBridge {
	parse_configuration_content(
		content: string,
		path: string,
	): ImportedConfiguration;
	convert_draft_to_config(
		draft: DraftConfig,
		cannonCenter: { x: string; z: string },
		redTntLocation: string | undefined,
		mode: CannonMode | undefined,
	): GeneralConfig;
	convert_config_to_draft(config: GeneralConfig): ConvertedConfigDraft;
	build_export_config(
		draft: DraftConfig,
		cannonCenter: { x: string; z: string },
		redTntLocation: string | undefined,
		bitTemplateState: BitInputState | undefined,
		mode: CannonMode | undefined,
		multiplierBitState: MultiplierBitInputState | undefined,
	): Record<string, unknown>;
	build_encodable_config(
		config: GeneralConfig,
		bitTemplate: BitTemplateConfig | null,
	): EncodableConfig;
	encode_config(config: EncodableConfig): string;
	decode_config(code: string): DecodedConfig;
	config_to_input_state(
		config: BitTemplateConfig | null,
	): BitInputState | undefined;
	input_state_to_config(state: BitInputState): BitTemplateConfig;
	config_to_multiplier_input_state(
		config: MultiplierConfig | null,
	): MultiplierBitInputState | undefined;
	input_state_to_multiplier_config(
		state: MultiplierBitInputState,
	): MultiplierConfig;
	validate_bit_template(values: number[]): {
		isValid: boolean;
		errorKey?: string;
		errorParams?: Record<string, string | number>;
	};
	decode_bit_value(
		values: number[],
		targetValue: number,
	): { activatedBits: number[]; activatedIndices: number[] };
	decode_with_multiplier(
		values: number[],
		multiplier: number,
		targetValue: number,
	): { activatedIndices: number[]; remainder: number };
	get_direction_bits(
		masks: BitInputState["masks"],
		direction: string,
	): [boolean, boolean];
	parse_template_values(state: BitInputState): number[] | null;
	calculate_bits(
		state: BitInputState,
		blueTnt: number,
		redTnt: number,
		direction: string,
	):
		| { result: { blue: number[]; red: number[]; direction: [boolean, boolean] } }
		| {
				error: {
					isValid: boolean;
					errorKey?: string;
					errorParams?: Record<string, string | number>;
				};
		  };
}

export const utilsRust = (await import(
	"pearl_calculator_wasm"
)) as unknown as UtilsRustBridge;

export type {
	ConvertedConfigDraft,
	DecodedConfig,
	EncodableConfig,
	ImportedConfiguration,
};
