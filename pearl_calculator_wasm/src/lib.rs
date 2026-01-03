use pearl_calculator_bridge::api;
use pearl_calculator_bridge::inputs::{CalculationInput, PearlTraceInput, RawTraceInput};
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
