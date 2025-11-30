use crate::calculation::inputs::{Cannon, GeneralData};
use crate::calculation::results::{CalculationResult, TNTResult};
use crate::calculation::simulation;
use crate::physics::constants::constants::{FLOAT_PRECISION_EPSILON, PEARL_DRAG_MULTIPLIER};
use crate::physics::entities::movement::PearlVersion;
use crate::physics::world::direction::Direction;
use crate::physics::world::layout_direction::LayoutDirection;
use crate::physics::world::space::Space3D;

pub fn calculate_tnt_amount(
    cannon: &Cannon,
    destination: Space3D,
    max_tnt: u32,
    max_ticks: u32,
    max_distance: f64,
    version: PearlVersion,
) -> Vec<TNTResult> {
    let mut results = Vec::new();

    let pearl_start_pos = cannon.pearl.position + cannon.pearl.offset;
    let true_distance = destination - pearl_start_pos;

    if true_distance.x == 0.0 && true_distance.z == 0.0 {
        return results;
    }

    let flight_direction = Direction::from_angle(pearl_start_pos.angle_to_yaw(&destination));

    let (red_tnt_vec, blue_tnt_vec) = match calculate_tnt_vectors(cannon, flight_direction) {
        Some(vectors) => vectors,
        None => return Vec::new(),
    };

    let denominator = red_tnt_vec.z * blue_tnt_vec.x - blue_tnt_vec.z * red_tnt_vec.x;
    if denominator.abs() < FLOAT_PRECISION_EPSILON {
        return results;
    }

    let true_red =
        (true_distance.z * blue_tnt_vec.x - true_distance.x * blue_tnt_vec.z) / denominator;
    let true_blue = (true_distance.x - true_red * red_tnt_vec.x) / blue_tnt_vec.x;

    let mut divider = 0.0;
    for tick in 1..=max_ticks {
        let tick_exponent = match version {
            PearlVersion::Legacy => tick - 1,
            PearlVersion::Post1212 => tick,
        };
        divider += PEARL_DRAG_MULTIPLIER.powi(tick_exponent as i32);

        let ideal_red = (true_red / divider).round() as i32;
        let ideal_blue = (true_blue / divider).round() as i32;

        for r_adjust in -5..=5 {
            for b_adjust in -5..=5 {
                let current_red = ideal_red + r_adjust;
                let current_blue = ideal_blue + b_adjust;

                if current_red < 0 || current_blue < 0 {
                    continue;
                }
                if max_tnt > 0 && (current_red as u32 > max_tnt || current_blue as u32 > max_tnt) {
                    continue;
                }

                let data = GeneralData {
                    pearl_position: cannon.pearl.position,
                    pearl_motion: {
                        let mut motion = cannon.pearl.motion;
                        motion += red_tnt_vec * (current_red as f64);
                        motion += blue_tnt_vec * (current_blue as f64);
                        motion
                    },
                    tnt_charges: vec![],
                };

                if let Some(sim_result) = simulation::run(
                    &data,
                    Some(destination),
                    tick,
                    &[],
                    Some(cannon.pearl.offset),
                    version,
                ) {
                    let landing_pos = sim_result.landing_position;
                    if landing_pos.distance_2d(&destination) <= max_distance {
                        results.push(TNTResult {
                            distance: sim_result.distance,
                            tick,
                            blue: current_blue as u32,
                            red: current_red as u32,
                            total: (current_red + current_blue) as u32,
                            pearl_end_pos: sim_result.landing_position,
                            pearl_end_motion: sim_result.final_motion,
                            direction: flight_direction,
                        });
                    }
                }
            }
        }
    }
    results
}

pub fn calculate_pearl_trace(
    cannon: &Cannon,
    red_tnt: u32,
    blue_tnt: u32,
    direction: Direction,
    max_ticks: u32,
    world_collisions: &[crate::physics::aabb::aabb_box::AABBBox],
    version: PearlVersion,
) -> Option<CalculationResult> {
    let (red_tnt_vec, blue_tnt_vec) = calculate_tnt_vectors(cannon, direction)?;

    let total_tnt_motion = (red_tnt_vec * red_tnt as f64) + (blue_tnt_vec * blue_tnt as f64);

    let general_data = GeneralData {
        pearl_position: cannon.pearl.position,
        pearl_motion: cannon.pearl.motion + total_tnt_motion,
        tnt_charges: vec![],
    };

    simulation::run(
        &general_data,
        None,
        max_ticks,
        world_collisions,
        Some(cannon.pearl.offset),
        version,
    )
}

fn calculate_tnt_vectors(cannon: &Cannon, direction: Direction) -> Option<(Space3D, Space3D)> {
    let mut pearl_pos_for_vec_calc = cannon.pearl.offset;
    pearl_pos_for_vec_calc.y = cannon.pearl.position.y;

    let blue_duper = cannon.default_blue_duper?;
    let red_duper = cannon.default_red_duper?;

    let red_tnt_loc;
    let blue_tnt_loc;

    let blue_duper_bits = layout_direction_to_cardinal_bits(blue_duper);
    if (direction as u8 & blue_duper_bits) == 0 {
        blue_tnt_loc = tnt_loc_from_layout(cannon, blue_duper);

        let inverted_dir = direction.invert() as u8;
        let other_bits = (!((direction as u8) | blue_duper_bits)) & 0b1111;
        let final_bits = other_bits | inverted_dir;
        red_tnt_loc = tnt_loc_from_layout(cannon, cardinal_bits_to_layout_direction(final_bits));
    } else {
        red_tnt_loc = tnt_loc_from_layout(cannon, red_duper);

        let red_duper_bits = layout_direction_to_cardinal_bits(red_duper);
        let inverted_dir = direction.invert() as u8;
        let other_bits = (!((direction as u8) | red_duper_bits)) & 0b1111;
        let final_bits = other_bits | inverted_dir;
        blue_tnt_loc = tnt_loc_from_layout(cannon, cardinal_bits_to_layout_direction(final_bits));
    }

    let red_tnt_vec = simulation::calculate_tnt_motion(pearl_pos_for_vec_calc, red_tnt_loc);
    let blue_tnt_vec = simulation::calculate_tnt_motion(pearl_pos_for_vec_calc, blue_tnt_loc);

    Some((red_tnt_vec, blue_tnt_vec))
}

fn tnt_loc_from_layout(cannon: &Cannon, dir: LayoutDirection) -> Space3D {
    match dir {
        LayoutDirection::NorthWest => cannon.north_west_tnt,
        LayoutDirection::NorthEast => cannon.north_east_tnt,
        LayoutDirection::SouthWest => cannon.south_west_tnt,
        LayoutDirection::SouthEast => cannon.south_east_tnt,
        _ => Space3D::default(),
    }
}

fn layout_direction_to_cardinal_bits(dir: LayoutDirection) -> u8 {
    match dir {
        LayoutDirection::NorthWest => (Direction::North as u8) | (Direction::West as u8),
        LayoutDirection::NorthEast => (Direction::North as u8) | (Direction::East as u8),
        LayoutDirection::SouthWest => (Direction::South as u8) | (Direction::West as u8),
        LayoutDirection::SouthEast => (Direction::South as u8) | (Direction::East as u8),
        _ => 0,
    }
}

fn cardinal_bits_to_layout_direction(bits: u8) -> LayoutDirection {
    if (bits & ((Direction::North as u8) | (Direction::West as u8)))
        == ((Direction::North as u8) | (Direction::West as u8))
    {
        LayoutDirection::NorthWest
    } else if (bits & ((Direction::North as u8) | (Direction::East as u8)))
        == ((Direction::North as u8) | (Direction::East as u8))
    {
        LayoutDirection::NorthEast
    } else if (bits & ((Direction::South as u8) | (Direction::West as u8)))
        == ((Direction::South as u8) | (Direction::West as u8))
    {
        LayoutDirection::SouthWest
    } else {
        LayoutDirection::SouthEast
    }
}
