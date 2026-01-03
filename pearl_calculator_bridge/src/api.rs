use crate::inputs::{CalculationInput, PearlTraceInput, RawTraceInput};
use crate::outputs::{PearlTraceOutput, TNTResultOutput};

use pearl_calculator_core::calculation::calculation::{
    calculate_pearl_trace as core_calculate_pearl_trace,
    calculate_raw_trace as core_calculate_raw_trace,
    calculate_tnt_amount as core_calculate_tnt_amount,
};
use pearl_calculator_core::physics::world::space::Space3D;

pub fn calculate_tnt_amount(input: CalculationInput) -> Result<Vec<TNTResultOutput>, String> {
    let version = input.get_version()?;
    let cannon = input.get_cannon()?;
    let destination = input.get_destination();

    let results = core_calculate_tnt_amount(
        &cannon,
        destination,
        input.max_tnt,
        input.max_ticks,
        input.max_distance,
        version,
    );

    Ok(results.into_iter().map(Into::into).collect())
}

pub fn calculate_pearl_trace(input: PearlTraceInput) -> Result<PearlTraceOutput, String> {
    let version = input.get_version()?;
    let cannon = input.get_cannon()?;
    let flight_direction = input.get_flight_direction()?;

    let result = core_calculate_pearl_trace(
        &cannon,
        input.red_tnt,
        input.blue_tnt,
        input.vertical_tnt_amount.unwrap_or(0),
        flight_direction,
        10000,
        &[],
        version,
    )
    .ok_or_else(|| "Pearl trace calculation failed".to_string())?;

    Ok(PearlTraceOutput::from_core(
        result,
        Some((input.destination_x, input.destination_z)),
    ))
}

pub fn calculate_raw_trace(input: RawTraceInput) -> Result<PearlTraceOutput, String> {
    let version = input.get_version()?;

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
            .ok_or_else(|| "Raw trace calculation failed".to_string())?;

    Ok(PearlTraceOutput::from_core(result, None))
}
