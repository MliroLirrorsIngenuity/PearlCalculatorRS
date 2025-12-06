use crate::calculation::inputs::{Cannon, GeneralData};
use crate::calculation::results::{CalculationResult, TNTResult};
use crate::calculation::simulation;
use crate::physics::constants::constants::{FLOAT_PRECISION_EPSILON, PEARL_DRAG_MULTIPLIER};
use crate::physics::entities::movement::PearlVersion;
use crate::physics::world::direction::Direction;
use crate::physics::world::layout_direction::LayoutDirection;
use crate::physics::world::space::Space3D;
use crate::utils::parallel::*;
use std::collections::HashMap;

pub fn calculate_tnt_amount(
    cannon: &Cannon,
    destination: Space3D,
    max_tnt: u32,
    max_ticks: u32,
    max_distance: f64,
    version: PearlVersion,
) -> Vec<TNTResult> {
    let pearl_start_pos = cannon.pearl.position + cannon.pearl.offset;
    let true_distance = destination - pearl_start_pos;

    if true_distance.x == 0.0 && true_distance.z == 0.0 {
        return Vec::new();
    }

    let flight_direction = Direction::from_angle(pearl_start_pos.angle_to_yaw(&destination));

    let (red_tnt_vec, blue_tnt_vec) = match calculate_tnt_vectors(cannon, flight_direction) {
        Some(vectors) => vectors,
        None => return Vec::new(),
    };

    let denominator = red_tnt_vec.z * blue_tnt_vec.x - blue_tnt_vec.z * red_tnt_vec.x;
    if denominator.abs() < FLOAT_PRECISION_EPSILON {
        return Vec::new();
    }

    let mut groups: HashMap<(i32, i32), Vec<u32>> = HashMap::new();

    let m = PEARL_DRAG_MULTIPLIER;
    let denom_const = 1.0 - m;

    for tick in 1..=max_ticks {
        let numerator = 1.0 - m.powi(tick as i32);
        let divider = match version {
            PearlVersion::Legacy | PearlVersion::Post1205 => numerator / denom_const,
            PearlVersion::Post1212 => m * numerator / denom_const,
        };

        let true_red =
            (true_distance.z * blue_tnt_vec.x - true_distance.x * blue_tnt_vec.z) / denominator;
        let true_blue = (true_distance.x - true_red * red_tnt_vec.x) / blue_tnt_vec.x;

        let ideal_red = (true_red / divider).round() as i32;
        let ideal_blue = (true_blue / divider).round() as i32;

        groups
            .entry((ideal_red, ideal_blue))
            .or_insert_with(Vec::new)
            .push(tick);
    }

    let group_list: Vec<((i32, i32), Vec<u32>)> = groups.into_iter().collect();
    let max_distance_sq = max_distance * max_distance;
    let pearl_offset = cannon.pearl.offset;
    let cannon_pearl_pos = cannon.pearl.position;
    let cannon_pearl_motion = cannon.pearl.motion;

    let raw_results: Vec<TNTResult> = group_list
        .into_par_iter()
        .flat_map(|((ideal_red, ideal_blue), valid_ticks)| {
            let mut local_results = Vec::new();

            let max_sim_tick = *valid_ticks.iter().max().unwrap_or(&0);
            if max_sim_tick == 0 {
                return local_results;
            }

            let mut valid_ticks_map = vec![false; (max_sim_tick + 1) as usize];
            for &t in &valid_ticks {
                valid_ticks_map[t as usize] = true;
            }

            for r_adjust in -5..=5 {
                for b_adjust in -5..=5 {
                    let current_red = ideal_red + r_adjust;
                    let current_blue = ideal_blue + b_adjust;

                    if current_red < 0 || current_blue < 0 {
                        continue;
                    }
                    if max_tnt > 0
                        && (current_red as u32 > max_tnt || current_blue as u32 > max_tnt)
                    {
                        continue;
                    }

                    let data = GeneralData {
                        pearl_position: cannon_pearl_pos,
                        pearl_motion: {
                            let mut motion = cannon_pearl_motion;
                            motion += red_tnt_vec * (current_red as f64);
                            motion += blue_tnt_vec * (current_blue as f64);
                            motion
                        },
                        tnt_charges: vec![],
                    };

                    let hits = simulation::scan_trajectory(
                        &data,
                        destination,
                        max_sim_tick,
                        &valid_ticks_map,
                        &[],
                        pearl_offset,
                        version,
                        max_distance_sq,
                    );

                    if let Some(best_hit) = hits.into_iter().min_by(|a, b| {
                        a.distance
                            .partial_cmp(&b.distance)
                            .unwrap_or(std::cmp::Ordering::Equal)
                            .then_with(|| a.tick.cmp(&b.tick))
                    }) {
                        local_results.push(TNTResult {
                            distance: best_hit.distance,
                            tick: best_hit.tick,
                            blue: current_blue as u32,
                            red: current_red as u32,
                            total: (current_red + current_blue) as u32,
                            pearl_end_pos: best_hit.position,
                            pearl_end_motion: best_hit.motion,
                            direction: flight_direction,
                        });
                    }
                }
            }
            local_results
        })
        .collect();

    let mut best_results_map: HashMap<(u32, u32), TNTResult> = HashMap::new();

    for res in raw_results {
        let key = (res.red, res.blue);
        match best_results_map.entry(key) {
            std::collections::hash_map::Entry::Vacant(e) => {
                e.insert(res);
            }
            std::collections::hash_map::Entry::Occupied(mut e) => {
                let current = e.get();
                let is_better = if (res.distance - current.distance).abs() < FLOAT_PRECISION_EPSILON
                {
                    res.tick < current.tick
                } else {
                    res.distance < current.distance
                };
                if is_better {
                    e.insert(res);
                }
            }
        }
    }

    let mut final_results: Vec<TNTResult> = best_results_map.into_values().collect();
    final_results.sort_by(|a, b| {
        a.distance
            .partial_cmp(&b.distance)
            .unwrap_or(std::cmp::Ordering::Equal)
    });

    final_results
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

    let final_motion = cannon.pearl.motion + total_tnt_motion;

    run_trace_internal(
        cannon.pearl.position,
        final_motion,
        Some(cannon.pearl.offset),
        max_ticks,
        world_collisions,
        version,
    )
}

pub fn calculate_raw_trace(
    pearl_position: Space3D,
    pearl_motion: Space3D,
    tnt_charges: Vec<(Space3D, u32)>,
    max_ticks: u32,
    world_collisions: &[crate::physics::aabb::aabb_box::AABBBox],
    version: PearlVersion,
) -> Option<CalculationResult> {
    let total_explosion_motion = tnt_charges
        .iter()
        .filter(|(_, count)| *count > 0)
        .map(|(tnt_pos, count)| {
            simulation::calculate_tnt_motion(pearl_position, *tnt_pos) * (*count as f64)
        })
        .fold(Space3D::default(), |acc, x| acc + x);

    run_trace_internal(
        pearl_position,
        pearl_motion + total_explosion_motion,
        None,
        max_ticks,
        world_collisions,
        version,
    )
}

fn run_trace_internal(
    position: Space3D,
    motion: Space3D,
    offset: Option<Space3D>,
    max_ticks: u32,
    world_collisions: &[crate::physics::aabb::aabb_box::AABBBox],
    version: PearlVersion,
) -> Option<CalculationResult> {
    let general_data = GeneralData {
        pearl_position: position,
        pearl_motion: motion,
        tnt_charges: vec![],
    };

    simulation::run(
        &general_data,
        None,
        max_ticks,
        world_collisions,
        offset,
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
