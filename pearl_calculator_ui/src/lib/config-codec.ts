import { utilsRust } from "@/lib/utils-rust";
import type { BitTemplateConfig, GeneralConfig } from "@/types/domain";

export interface EncodableConfig {
	NorthEastTNT: { X: number; Y: number; Z: number };
	NorthWestTNT: { X: number; Y: number; Z: number };
	SouthEastTNT: { X: number; Y: number; Z: number };
	SouthWestTNT: { X: number; Y: number; Z: number };
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

export interface DecodedConfig {
	generalConfig: GeneralConfig;
	bitTemplate: BitTemplateConfig | null;
}

export function encodeConfig(data: EncodableConfig): string {
	return utilsRust.encode_config(data);
}

export function decodeConfig(input: string): DecodedConfig {
	return utilsRust.decode_config(input);
}

export function buildEncodableConfig(
	config: GeneralConfig,
	bitTemplate: BitTemplateConfig | null,
): EncodableConfig {
	return utilsRust.build_encodable_config(config, bitTemplate);
}
