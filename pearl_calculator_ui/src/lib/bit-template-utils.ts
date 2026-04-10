import { utilsRust } from "@/lib/utils-rust";
import type {
	BitInputState,
	BitTemplateConfig,
	MultiplierBitInputState,
	MultiplierConfig,
} from "@/types/domain";

export function configToInputState(
	config: BitTemplateConfig | null,
): BitInputState | undefined {
	return utilsRust.config_to_input_state(config);
}

export function inputStateToConfig(state: BitInputState): BitTemplateConfig {
	return utilsRust.input_state_to_config(state);
}

export function configToMultiplierInputState(
	config: MultiplierConfig | null,
): MultiplierBitInputState | undefined {
	return utilsRust.config_to_multiplier_input_state(config);
}

export function inputStateToMultiplierConfig(
	state: MultiplierBitInputState,
): MultiplierConfig {
	return utilsRust.input_state_to_multiplier_config(state);
}
