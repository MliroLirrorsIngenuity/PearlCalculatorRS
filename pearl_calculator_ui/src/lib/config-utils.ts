import { utilsRust } from "@/lib/utils-rust";
import type {
	BitInputState,
	CannonMode,
	GeneralConfig,
	MultiplierBitInputState,
} from "@/types/domain";
import type { DraftConfig } from "@/context/ConfigurationStateContext";

type TNTDirection = "SouthEast" | "NorthWest" | "SouthWest" | "NorthEast";

export function toBackendMode(mode: CannonMode): "Standard" | "Accumulation" {
	return mode === "Accumulation" ? "Accumulation" : "Standard";
}

const OPPOSITE_PAIRS: Record<TNTDirection, TNTDirection> = {
	NorthWest: "SouthEast",
	SouthEast: "NorthWest",
	NorthEast: "SouthWest",
	SouthWest: "NorthEast",
};

export function getOppositeDirection(dir: string | undefined): TNTDirection {
	if (dir && dir in OPPOSITE_PAIRS) {
		return OPPOSITE_PAIRS[dir as TNTDirection];
	}
	return "SouthEast";
}

export interface CannonCenter {
	x: string;
	z: string;
}

export interface PearlMomentum {
	x: string;
	y: string;
	z: string;
}

export function convertDraftToConfig(
	draftConfig: DraftConfig,
	cannonCenter: CannonCenter,
	redTNTLocation: string | undefined,
	mode?: CannonMode,
): GeneralConfig {
	return utilsRust.convert_draft_to_config(
		draftConfig,
		cannonCenter,
		redTNTLocation,
		mode,
	);
}

export function buildExportConfig(
	draftConfig: DraftConfig,
	cannonCenter: CannonCenter,
	redTNTLocation: string | undefined,
	bitTemplateState: BitInputState | undefined,
	mode?: CannonMode,
	multiplierBitState?: MultiplierBitInputState,
): Record<string, unknown> {
	return utilsRust.build_export_config(
		draftConfig,
		cannonCenter,
		redTNTLocation,
		bitTemplateState,
		mode,
		multiplierBitState,
	);
}

export function convertConfigToDraft(config: GeneralConfig): {
	draft: DraftConfig;
	center: CannonCenter;
	momentum: PearlMomentum;
	redLocation: string | undefined;
} {
	return utilsRust.convert_config_to_draft(config);
}
