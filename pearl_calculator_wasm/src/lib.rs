use pearl_calculator_core::calculation::calculation::{
    calculate_pearl_trace as core_calculate_pearl_trace,
    calculate_raw_trace as core_calculate_raw_trace,
    calculate_tnt_amount as core_calculate_tnt_amount,
};
use pearl_calculator_core::physics::world::space::Space3D;
use wasm_bindgen::prelude::*;

use pearl_calculator_bridge::inputs::{CalculationInput, PearlTraceInput, RawTraceInput};
use pearl_calculator_bridge::outputs::{PearlTraceOutput, TNTResultOutput};

#[wasm_bindgen]
pub fn calculate_tnt_amount(val: JsValue) -> Result<JsValue, JsError> {
    let input: CalculationInput = serde_wasm_bindgen::from_value(val)?;

    let version = input.get_version().map_err(|e| JsError::new(&e))?;
    let cannon = input.get_cannon().map_err(|e| JsError::new(&e))?;
    let destination = input.get_destination();

    let results = core_calculate_tnt_amount(
        &cannon,
        destination,
        input.max_tnt,
        input.max_ticks,
        input.max_distance,
        version,
    );

    let output_results: Vec<TNTResultOutput> = results.into_iter().map(Into::into).collect();

    Ok(serde_wasm_bindgen::to_value(&output_results)?)
}

#[wasm_bindgen]
pub fn calculate_pearl_trace(val: JsValue) -> Result<JsValue, JsError> {
    let input: PearlTraceInput = serde_wasm_bindgen::from_value(val)?;

    let version = input.get_version().map_err(|e| JsError::new(&e))?;
    let cannon = input.get_cannon().map_err(|e| JsError::new(&e))?;
    let flight_direction = input.get_flight_direction().map_err(|e| JsError::new(&e))?;

    let result = core_calculate_pearl_trace(
        &cannon,
        input.red_tnt,
        input.blue_tnt,
        flight_direction,
        10000,
        &[],
        version,
    )
    .ok_or_else(|| JsError::new("Pearl trace calculation failed"))?;

    let output =
        PearlTraceOutput::from_core(result, Some((input.destination_x, input.destination_z)));

    Ok(serde_wasm_bindgen::to_value(&output)?)
}

#[wasm_bindgen]
pub fn calculate_raw_trace(val: JsValue) -> Result<JsValue, JsError> {
    let input: RawTraceInput = serde_wasm_bindgen::from_value(val)?;

    let version = input.get_version().map_err(|e| JsError::new(&e))?;

    let pearl_pos = Space3D::new(input.pearl_x, input.pearl_y, input.pearl_z);
    let pearl_motion = Space3D::new(
        input.pearl_motion_x,
        input.pearl_motion_y,
        input.pearl_motion_z,
    );

    let tnt_charges: Vec<(Space3D, u32)> = input
        .tnt_groups
        .iter()
        .map(|g| (Space3D::new(g.x, g.y, g.z), g.amount))
        .collect();

    let result =
        core_calculate_raw_trace(pearl_pos, pearl_motion, tnt_charges, 10000, &[], version)
            .ok_or_else(|| JsError::new("Raw trace calculation failed"))?;

    let output = PearlTraceOutput::from_core(result, None);

    Ok(serde_wasm_bindgen::to_value(&output)?)
}
