declare module "pearl_calculator_wasm" {
	export function calculate_tnt_amount(input: unknown): unknown[];
	export function calculate_pearl_trace(input: unknown): unknown;
	export function calculate_raw_trace(input: unknown): unknown;
	export function parse_configuration_content(
		content: string,
		path: string,
	): unknown;
	export function convert_draft_to_config(
		draft: unknown,
		cannonCenter: unknown,
		redTntLocation: unknown,
		mode: unknown,
	): unknown;
	export function convert_config_to_draft(config: unknown): unknown;
	export function build_export_config(
		draft: unknown,
		cannonCenter: unknown,
		redTntLocation: unknown,
		bitTemplateState: unknown,
		mode: unknown,
		multiplierBitState: unknown,
	): unknown;
	export function build_encodable_config(
		config: unknown,
		bitTemplate: unknown,
	): unknown;
	export function encode_config(config: unknown): string;
	export function decode_config(code: string): unknown;
	export function config_to_input_state(config: unknown): unknown;
	export function input_state_to_config(state: unknown): unknown;
	export function config_to_multiplier_input_state(config: unknown): unknown;
	export function input_state_to_multiplier_config(state: unknown): unknown;
	export function validate_bit_template(values: unknown): unknown;
	export function decode_bit_value(values: unknown, targetValue: number): unknown;
	export function decode_with_multiplier(
		values: unknown,
		multiplier: number,
		targetValue: number,
	): unknown;
	export function get_direction_bits(masks: unknown, direction: string): unknown;
	export function parse_template_values(state: unknown): unknown;
	export function calculate_bits(
		state: unknown,
		blueTnt: number,
		redTnt: number,
		direction: string,
	): unknown;
}
