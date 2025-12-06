use pearl_calculator_bridge::inputs::{CalculationInput, PearlTraceInput, RawTraceInput};
use pearl_calculator_bridge::outputs::{
    ClosestApproachOutput, PearlTraceOutput, Space3DOutput, TNTResultOutput,
};
use pearl_calculator_core::calculation::calculation::{
    calculate_pearl_trace, calculate_raw_trace, calculate_tnt_amount,
};
use pearl_calculator_core::calculation::inputs::{Cannon, Pearl};
use pearl_calculator_core::physics::entities::movement::PearlVersion;
use pearl_calculator_core::physics::world::direction::Direction;
use pearl_calculator_core::physics::world::layout_direction::LayoutDirection;
use pearl_calculator_core::physics::world::space::Space3D;

fn parse_layout_direction(s: &str) -> Option<LayoutDirection> {
    match s {
        "NorthWest" => Some(LayoutDirection::NorthWest),
        "NorthEast" => Some(LayoutDirection::NorthEast),
        "SouthWest" => Some(LayoutDirection::SouthWest),
        "SouthEast" => Some(LayoutDirection::SouthEast),
        _ => None,
    }
}

#[tauri::command]
pub fn calculate_tnt_amount_command(input: CalculationInput) -> Result<serde_json::Value, String> {
    let version = match input.version.as_str() {
        "Legacy" => PearlVersion::Legacy,
        "Post1205" => PearlVersion::Post1205,
        "Post1212" => PearlVersion::Post1212,
        _ => return Err("Invalid pearl version".to_string()),
    };

    let default_red_direction = parse_layout_direction(&input.default_red_direction);
    let default_blue_direction = parse_layout_direction(&input.default_blue_direction);

    let y_offset = input.cannon_y - input.pearl_y.floor();

    let cannon = Cannon {
        pearl: Pearl {
            position: Space3D::new(input.pearl_x, input.pearl_y + y_offset, input.pearl_z),
            motion: Space3D::new(
                input.pearl_motion_x,
                input.pearl_motion_y,
                input.pearl_motion_z,
            ),
            offset: Space3D::new(input.offset_x, 0.0, input.offset_z),
        },
        north_west_tnt: Space3D::new(
            input.north_west_tnt.x,
            input.north_west_tnt.y + y_offset,
            input.north_west_tnt.z,
        ),
        north_east_tnt: Space3D::new(
            input.north_east_tnt.x,
            input.north_east_tnt.y + y_offset,
            input.north_east_tnt.z,
        ),
        south_west_tnt: Space3D::new(
            input.south_west_tnt.x,
            input.south_west_tnt.y + y_offset,
            input.south_west_tnt.z,
        ),
        south_east_tnt: Space3D::new(
            input.south_east_tnt.x,
            input.south_east_tnt.y + y_offset,
            input.south_east_tnt.z,
        ),
        default_red_duper: default_red_direction,
        default_blue_duper: default_blue_direction,
    };

    let destination = Space3D::new(input.destination_x, 0.0, input.destination_z);

    let results = calculate_tnt_amount(
        &cannon,
        destination,
        input.max_tnt,
        input.max_ticks,
        input.max_distance,
        version,
    );

    let output_results: Vec<TNTResultOutput> = results
        .into_iter()
        .map(|r| TNTResultOutput {
            distance: r.distance,
            tick: r.tick,
            blue: r.blue,
            red: r.red,
            total: r.total,
            pearl_end_pos: Space3DOutput {
                x: r.pearl_end_pos.x,
                y: r.pearl_end_pos.y,
                z: r.pearl_end_pos.z,
            },
            pearl_end_motion: Space3DOutput {
                x: r.pearl_end_motion.x,
                y: r.pearl_end_motion.y,
                z: r.pearl_end_motion.z,
            },
            direction: format!("{:?}", r.direction),
        })
        .collect();

    match serde_json::to_value(&output_results) {
        Ok(json) => Ok(json),
        Err(e) => Err(format!("Failed to serialize results: {}", e)),
    }
}

fn direction_from_layout(layout: LayoutDirection) -> Direction {
    match layout {
        LayoutDirection::NorthWest => Direction::North,
        LayoutDirection::NorthEast => Direction::East,
        LayoutDirection::SouthWest => Direction::West,
        LayoutDirection::SouthEast => Direction::South,
        _ => Direction::East,
    }
}

#[tauri::command]
pub fn calculate_pearl_trace_command(input: PearlTraceInput) -> Result<PearlTraceOutput, String> {
    let version = match input.version.as_str() {
        "Legacy" => PearlVersion::Legacy,
        "Post1205" => PearlVersion::Post1205,
        "Post1212" => PearlVersion::Post1212,
        _ => return Err("Invalid pearl version".to_string()),
    };

    let default_red_direction = parse_layout_direction(&input.default_red_direction)
        .ok_or_else(|| "Invalid red direction".to_string())?;
    let default_blue_direction = parse_layout_direction(&input.default_blue_direction);

    let y_offset = input.cannon_y - input.pearl_y.floor();

    let cannon = Cannon {
        pearl: Pearl {
            position: Space3D::new(input.pearl_x, input.pearl_y + y_offset, input.pearl_z),
            motion: Space3D::new(
                input.pearl_motion_x,
                input.pearl_motion_y,
                input.pearl_motion_z,
            ),
            offset: Space3D::new(input.offset_x, 0.0, input.offset_z),
        },
        north_west_tnt: Space3D::new(
            input.north_west_tnt.x,
            input.north_west_tnt.y + y_offset,
            input.north_west_tnt.z,
        ),
        north_east_tnt: Space3D::new(
            input.north_east_tnt.x,
            input.north_east_tnt.y + y_offset,
            input.north_east_tnt.z,
        ),
        south_west_tnt: Space3D::new(
            input.south_west_tnt.x,
            input.south_west_tnt.y + y_offset,
            input.south_west_tnt.z,
        ),
        south_east_tnt: Space3D::new(
            input.south_east_tnt.x,
            input.south_east_tnt.y + y_offset,
            input.south_east_tnt.z,
        ),
        default_red_duper: Some(default_red_direction),
        default_blue_duper: default_blue_direction,
    };

    let flight_direction = if let Some(dir_str) = &input.direction {
        match dir_str.as_str() {
            "North" => Direction::North,
            "South" => Direction::South,
            "West" => Direction::West,
            "East" => Direction::East,
            _ => direction_from_layout(default_red_direction),
        }
    } else {
        direction_from_layout(default_red_direction)
    };

    let result = calculate_pearl_trace(
        &cannon,
        input.red_tnt,
        input.blue_tnt,
        flight_direction,
        10000,
        &[],
        version,
    )
    .ok_or_else(|| "Pearl trace calculation failed".to_string())?;

    let mut min_distance = f64::INFINITY;
    let mut closest_tick = 0;
    let mut closest_point = Space3DOutput {
        x: 0.0,
        y: 0.0,
        z: 0.0,
    };

    let pearl_trace_output: Vec<Space3DOutput> = result
        .pearl_trace
        .iter()
        .enumerate()
        .map(|(index, pos)| {
            let dx = pos.x - input.destination_x;
            let dz = pos.z - input.destination_z;
            let distance = (dx * dx + dz * dz).sqrt();

            if distance < min_distance {
                min_distance = distance;
                closest_tick = index as u32;
                closest_point = Space3DOutput {
                    x: pos.x,
                    y: pos.y,
                    z: pos.z,
                };
            }

            Space3DOutput {
                x: pos.x,
                y: pos.y,
                z: pos.z,
            }
        })
        .collect();

    let pearl_motion_trace_output: Vec<Space3DOutput> = result
        .pearl_motion_trace
        .iter()
        .map(|pos| Space3DOutput {
            x: pos.x,
            y: pos.y,
            z: pos.z,
        })
        .collect();

    let output = PearlTraceOutput {
        landing_position: Space3DOutput {
            x: result.landing_position.x,
            y: result.landing_position.y,
            z: result.landing_position.z,
        },
        pearl_trace: pearl_trace_output,
        pearl_motion_trace: pearl_motion_trace_output,
        is_successful: result.is_successful,
        tick: result.tick,
        final_motion: Space3DOutput {
            x: result.final_motion.x,
            y: result.final_motion.y,
            z: result.final_motion.z,
        },
        distance: result.distance,
        closest_approach: Some(ClosestApproachOutput {
            tick: closest_tick,
            point: closest_point,
            distance: min_distance,
        }),
    };

    Ok(output)
}

#[tauri::command]
pub fn calculate_raw_trace_command(input: RawTraceInput) -> Result<PearlTraceOutput, String> {
    let version = match input.version.as_str() {
        "Legacy" => PearlVersion::Legacy,
        "Post1205" => PearlVersion::Post1205,
        "Post1212" => PearlVersion::Post1212,
        _ => return Err("Invalid pearl version".to_string()),
    };

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

    let result = calculate_raw_trace(pearl_pos, pearl_motion, tnt_charges, 10000, &[], version)
        .ok_or_else(|| "Raw trace calculation failed".to_string())?;

    let pearl_trace_output: Vec<Space3DOutput> = result
        .pearl_trace
        .iter()
        .map(|pos| Space3DOutput {
            x: pos.x,
            y: pos.y,
            z: pos.z,
        })
        .collect();

    let pearl_motion_trace_output: Vec<Space3DOutput> = result
        .pearl_motion_trace
        .iter()
        .map(|pos| Space3DOutput {
            x: pos.x,
            y: pos.y,
            z: pos.z,
        })
        .collect();

    let output = PearlTraceOutput {
        landing_position: Space3DOutput {
            x: result.landing_position.x,
            y: result.landing_position.y,
            z: result.landing_position.z,
        },
        pearl_trace: pearl_trace_output,
        pearl_motion_trace: pearl_motion_trace_output,
        is_successful: result.is_successful,
        tick: result.tick,
        final_motion: Space3DOutput {
            x: result.final_motion.x,
            y: result.final_motion.y,
            z: result.final_motion.z,
        },
        distance: 0.0,
        closest_approach: None,
    };

    Ok(output)
}
