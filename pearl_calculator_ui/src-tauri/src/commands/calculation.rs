use pearl_calculator_bridge::api;
use pearl_calculator_bridge::inputs::{CalculationInput, PearlTraceInput, RawTraceInput};
use pearl_calculator_bridge::outputs::PearlTraceOutput;

#[tauri::command]
pub fn calculate_tnt_amount_command(input: CalculationInput) -> Result<serde_json::Value, String> {
    let results = api::calculate_tnt_amount(input)?;
    serde_json::to_value(&results).map_err(|e| format!("Serialization error: {}", e))
}

#[tauri::command]
pub fn calculate_pearl_trace_command(input: PearlTraceInput) -> Result<PearlTraceOutput, String> {
    api::calculate_pearl_trace(input)
}

#[tauri::command]
pub fn calculate_raw_trace_command(input: RawTraceInput) -> Result<PearlTraceOutput, String> {
    api::calculate_raw_trace(input)
}
