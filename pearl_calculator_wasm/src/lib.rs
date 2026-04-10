use pearl_calculator_bridge::api;
use pearl_calculator_bridge::inputs::{CalculationInput, PearlTraceInput, RawTraceInput};
use pearl_calculator_utils as utils;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn calculate_tnt_amount(val: JsValue) -> Result<JsValue, JsError> {
    let input: CalculationInput = serde_wasm_bindgen::from_value(val)?;
    let results = api::calculate_tnt_amount(input).map_err(|e| JsError::new(&e))?;
    Ok(serde_wasm_bindgen::to_value(&results)?)
}

#[wasm_bindgen]
pub fn calculate_pearl_trace(val: JsValue) -> Result<JsValue, JsError> {
    let input: PearlTraceInput = serde_wasm_bindgen::from_value(val)?;
    let result = api::calculate_pearl_trace(input).map_err(|e| JsError::new(&e))?;
    Ok(serde_wasm_bindgen::to_value(&result)?)
}

#[wasm_bindgen]
pub fn calculate_raw_trace(val: JsValue) -> Result<JsValue, JsError> {
    let input: RawTraceInput = serde_wasm_bindgen::from_value(val)?;
    let result = api::calculate_raw_trace(input).map_err(|e| JsError::new(&e))?;
    Ok(serde_wasm_bindgen::to_value(&result)?)
}

#[wasm_bindgen]
pub fn parse_configuration_content(content: &str, path: &str) -> Result<JsValue, JsError> {
    let result =
        utils::parse_configuration_content(content, path).map_err(|error| JsError::new(&error))?;
    Ok(serde_wasm_bindgen::to_value(&result)?)
}

#[wasm_bindgen]
pub fn convert_draft_to_config(
    draft: JsValue,
    cannon_center: JsValue,
    red_tnt_location: JsValue,
    mode: JsValue,
) -> Result<JsValue, JsError> {
    let draft = serde_wasm_bindgen::from_value(draft)?;
    let cannon_center = serde_wasm_bindgen::from_value(cannon_center)?;
    let red_tnt_location = serde_wasm_bindgen::from_value(red_tnt_location).ok();
    let mode = serde_wasm_bindgen::from_value(mode).ok();
    let result = utils::convert_draft_to_config(&draft, &cannon_center, red_tnt_location, mode);
    Ok(serde_wasm_bindgen::to_value(&result)?)
}

#[wasm_bindgen]
pub fn convert_config_to_draft(config: JsValue) -> Result<JsValue, JsError> {
    let config = serde_wasm_bindgen::from_value(config)?;
    let result = utils::convert_config_to_draft(&config);
    Ok(serde_wasm_bindgen::to_value(&result)?)
}

#[wasm_bindgen]
pub fn build_export_config(
    draft: JsValue,
    cannon_center: JsValue,
    red_tnt_location: JsValue,
    bit_template_state: JsValue,
    mode: JsValue,
    multiplier_bit_state: JsValue,
) -> Result<JsValue, JsError> {
    let draft = serde_wasm_bindgen::from_value(draft)?;
    let cannon_center = serde_wasm_bindgen::from_value(cannon_center)?;
    let red_tnt_location = serde_wasm_bindgen::from_value(red_tnt_location).ok();
    let bit_template_state = serde_wasm_bindgen::from_value(bit_template_state).ok();
    let mode = serde_wasm_bindgen::from_value(mode).ok();
    let multiplier_bit_state = serde_wasm_bindgen::from_value(multiplier_bit_state).ok();

    let result = utils::build_export_config(
        &draft,
        &cannon_center,
        red_tnt_location,
        bit_template_state.as_ref(),
        mode,
        multiplier_bit_state.as_ref(),
    );
    Ok(serde_wasm_bindgen::to_value(&result)?)
}

#[wasm_bindgen]
pub fn build_encodable_config(config: JsValue, bit_template: JsValue) -> Result<JsValue, JsError> {
    let config = serde_wasm_bindgen::from_value(config)?;
    let bit_template = serde_wasm_bindgen::from_value(bit_template).ok();
    let result = utils::build_encodable_config(&config, bit_template.as_ref());
    Ok(serde_wasm_bindgen::to_value(&result)?)
}

#[wasm_bindgen]
pub fn encode_config(config: JsValue) -> Result<String, JsError> {
    let config = serde_wasm_bindgen::from_value(config)?;
    utils::encode_config(&config).map_err(|error| JsError::new(&error))
}

#[wasm_bindgen]
pub fn decode_config(code: &str) -> Result<JsValue, JsError> {
    let result = utils::decode_config(code).map_err(|error| JsError::new(&error))?;
    Ok(serde_wasm_bindgen::to_value(&result)?)
}

#[wasm_bindgen]
pub fn config_to_input_state(config: JsValue) -> Result<JsValue, JsError> {
    let config = serde_wasm_bindgen::from_value(config).ok();
    let result = utils::config_to_input_state(config.as_ref());
    Ok(serde_wasm_bindgen::to_value(&result)?)
}

#[wasm_bindgen]
pub fn input_state_to_config(state: JsValue) -> Result<JsValue, JsError> {
    let state = serde_wasm_bindgen::from_value(state)?;
    let result = utils::input_state_to_config(&state);
    Ok(serde_wasm_bindgen::to_value(&result)?)
}

#[wasm_bindgen]
pub fn config_to_multiplier_input_state(config: JsValue) -> Result<JsValue, JsError> {
    let config = serde_wasm_bindgen::from_value(config).ok();
    let result = utils::config_to_multiplier_input_state(config.as_ref());
    Ok(serde_wasm_bindgen::to_value(&result)?)
}

#[wasm_bindgen]
pub fn input_state_to_multiplier_config(state: JsValue) -> Result<JsValue, JsError> {
    let state = serde_wasm_bindgen::from_value(state)?;
    let result = utils::input_state_to_multiplier_config(&state);
    Ok(serde_wasm_bindgen::to_value(&result)?)
}

#[wasm_bindgen]
pub fn validate_bit_template(values: JsValue) -> Result<JsValue, JsError> {
    let values: Vec<u32> = serde_wasm_bindgen::from_value(values)?;
    let result = utils::validate_bit_template(&values);
    Ok(serde_wasm_bindgen::to_value(&result)?)
}

#[wasm_bindgen]
pub fn decode_bit_value(values: JsValue, target_value: u32) -> Result<JsValue, JsError> {
    let values: Vec<u32> = serde_wasm_bindgen::from_value(values)?;
    let result = utils::decode_bit_value(&values, target_value);
    Ok(serde_wasm_bindgen::to_value(&result)?)
}

#[wasm_bindgen]
pub fn decode_with_multiplier(
    values: JsValue,
    multiplier: u32,
    target_value: u32,
) -> Result<JsValue, JsError> {
    let values: Vec<u32> = serde_wasm_bindgen::from_value(values)?;
    let result = utils::decode_with_multiplier(&values, multiplier, target_value);
    Ok(serde_wasm_bindgen::to_value(&result)?)
}

#[wasm_bindgen]
pub fn get_direction_bits(masks: JsValue, direction: &str) -> Result<JsValue, JsError> {
    let masks: Vec<utils::MaskGroup> = serde_wasm_bindgen::from_value(masks)?;
    let result = utils::get_direction_bits(&masks, direction);
    Ok(serde_wasm_bindgen::to_value(&result)?)
}

#[wasm_bindgen]
pub fn parse_template_values(state: JsValue) -> Result<JsValue, JsError> {
    let state = serde_wasm_bindgen::from_value(state)?;
    let result = utils::parse_template_values(&state);
    Ok(serde_wasm_bindgen::to_value(&result)?)
}

#[wasm_bindgen]
pub fn calculate_bits(
    state: JsValue,
    blue_tnt: u32,
    red_tnt: u32,
    direction: &str,
) -> Result<JsValue, JsError> {
    let state = serde_wasm_bindgen::from_value(state)?;
    let result = utils::calculate_bits(&state, blue_tnt, red_tnt, direction);
    Ok(serde_wasm_bindgen::to_value(&result)?)
}
