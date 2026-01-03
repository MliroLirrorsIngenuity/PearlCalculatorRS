use crate::calculation::inputs::{Cannon, GeneralData};
use crate::calculation::results::{CalculationResult, TNTResult};
use crate::calculation::simulation;
use crate::physics::aabb::aabb_box::AABBBox;
use crate::physics::constants::constants::{
    FLOAT_PRECISION_EPSILON, PEARL_DRAG_MULTIPLIER, PEARL_GRAVITY_ACCELERATION,
};
use crate::physics::entities::movement::PearlVersion;
use crate::physics::world::direction::Direction;
use crate::physics::world::layout_direction::LayoutDirection;
use crate::physics::world::space::Space3D;
use crate::settings::types::CannonMode;
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
    let pearl_start_absolute_pos = cannon.pearl.position + cannon.pearl.offset;
    let true_distance = destination - pearl_start_absolute_pos;

    if true_distance.length_sq() < FLOAT_PRECISION_EPSILON {
        return Vec::new();
    }

    let flight_direction =
        Direction::from_angle(pearl_start_absolute_pos.angle_to_yaw(&destination));

    let (red_vec, blue_vec, vert_vec) = resolve_vectors_for_direction(cannon, flight_direction);

    let mut groups: HashMap<(i32, i32, i32), Vec<u32>> = HashMap::new();
    let drag_multiplier = PEARL_DRAG_MULTIPLIER;
    let denominator_constant = 1.0 - drag_multiplier;

    let denominator = red_vec.z * blue_vec.x - blue_vec.z * red_vec.x;
    let is_3d_solve = vert_vec.length_sq() > FLOAT_PRECISION_EPSILON;

    if !is_3d_solve && denominator.abs() < FLOAT_PRECISION_EPSILON {
        return Vec::new();
    }

    let gravity = -PEARL_GRAVITY_ACCELERATION;
    let mut sim_grav_vel = 0.0;
    let mut sim_grav_pos = 0.0;

    for tick in 1..=max_ticks {
        sim_grav_vel = version.apply_grav_drag_tick(sim_grav_vel, gravity, drag_multiplier);
        sim_grav_pos += sim_grav_vel;

        let mut compensated_distance = true_distance;
        compensated_distance.y -= sim_grav_pos;

        let numerator = 1.0 - drag_multiplier.powi(tick as i32);
        let divider =
            version.get_projection_multiplier(drag_multiplier) * numerator / denominator_constant;

        if is_3d_solve {
            let target_motion = compensated_distance / divider;
            if let Some((r, b, v)) = solve_tnt_system_3d(red_vec, blue_vec, vert_vec, target_motion)
            {
                let cr = r.round() as i32;
                let cb = b.round() as i32;
                let cv = v.round() as i32;
                if cr >= 0 && cb >= 0 && cv >= 0 {
                    groups.entry((cr, cb, cv)).or_default().push(tick);
                }
            }
        } else {
            let true_red = (compensated_distance.z * blue_vec.x
                - compensated_distance.x * blue_vec.z)
                / denominator;
            let true_blue = (compensated_distance.x - true_red * red_vec.x) / blue_vec.x;

            let ideal_red = (true_red / divider).round() as i32;
            let ideal_blue = (true_blue / divider).round() as i32;

            if ideal_red >= 0 && ideal_blue >= 0 {
                groups
                    .entry((ideal_red, ideal_blue, 0))
                    .or_default()
                    .push(tick);
            }
        }
    }

    let max_distance_sq = max_distance * max_distance;

    let (search_radius, v_range) = if cannon.vertical_tnt.is_some() {
        (5, -1..=1)
    } else {
        (5, 0..=0)
    };

    let mut unique_candidates: HashMap<(u32, u32, u32), Vec<u32>> = HashMap::new();

    for ((center_red, center_blue, center_vert), valid_ticks) in groups {
        for r_offset in -search_radius..=search_radius {
            for b_offset in -search_radius..=search_radius {
                for v_offset in v_range.clone() {
                    let current_red = center_red + r_offset;
                    let current_blue = center_blue + b_offset;
                    let current_vert = center_vert + v_offset;

                    if current_red < 0 || current_blue < 0 || current_vert < 0 {
                        continue;
                    }

                    let r_u32 = current_red as u32;
                    let b_u32 = current_blue as u32;
                    let v_u32 = current_vert as u32;

                    let max_single_side = r_u32.max(b_u32);
                    if max_tnt > 0
                        && cannon.mode != CannonMode::Accumulation
                        && max_single_side > max_tnt
                    {
                        continue;
                    }

                    unique_candidates
                        .entry((r_u32, b_u32, v_u32))
                        .or_default()
                        .extend(valid_ticks.iter().cloned());
                }
            }
        }
    }

    let candidate_list: Vec<((u32, u32, u32), Vec<u32>)> = unique_candidates.into_iter().collect();

    let raw_results: Vec<TNTResult> = candidate_list
        .into_par_iter()
        .flat_map(|((r_u32, b_u32, v_u32), mut ticks)| {
            ticks.sort_unstable();
            ticks.dedup();

            let max_sim_tick = *ticks.last().unwrap_or(&0);
            if max_sim_tick == 0 {
                return Vec::new();
            }

            let mut valid_ticks_map = vec![false; (max_sim_tick + 1) as usize];
            for &t in &ticks {
                valid_ticks_map[t as usize] = true;
            }

            let total = r_u32 + b_u32 + v_u32;

            let tnt_impact =
                red_vec * (r_u32 as f64) + blue_vec * (b_u32 as f64) + vert_vec * (v_u32 as f64);

            let data = GeneralData {
                pearl_position: cannon.pearl.position,
                pearl_motion: cannon.pearl.motion + tnt_impact,
                tnt_charges: vec![],
            };

            let check_3d = vert_vec.length_sq() > FLOAT_PRECISION_EPSILON;

            let hits = simulation::scan_trajectory(
                &data,
                destination,
                max_sim_tick,
                &valid_ticks_map,
                &[],
                cannon.pearl.offset,
                version,
                max_distance_sq,
                check_3d,
            );

            let mut results = Vec::new();

            if let Some(best_hit) = hits.into_iter().min_by(|a, b| {
                a.distance
                    .partial_cmp(&b.distance)
                    .unwrap()
                    .then_with(|| a.tick.cmp(&b.tick))
            }) {
                let flight = best_hit.position - pearl_start_absolute_pos;
                let h_dist = (flight.x.powi(2) + flight.z.powi(2)).sqrt();
                let yaw = (-flight.x).atan2(flight.z).to_degrees();
                let pitch = (-flight.y).atan2(h_dist).to_degrees();

                let out_dir = Direction::from_angle(yaw);

                results.push(TNTResult {
                    distance: best_hit.distance,
                    tick: best_hit.tick,
                    blue: b_u32,
                    red: r_u32,
                    vertical: v_u32,
                    total,
                    pearl_end_pos: best_hit.position,
                    pearl_end_motion: best_hit.motion,
                    direction: out_dir,
                    yaw,
                    pitch,
                });
            }
            results
        })
        .collect();

    let mut best_map: HashMap<(u32, u32, u32), TNTResult> = HashMap::new();
    for res in raw_results {
        let key = (res.red, res.blue, res.vertical);
        match best_map.entry(key) {
            std::collections::hash_map::Entry::Vacant(e) => {
                e.insert(res);
            }
            std::collections::hash_map::Entry::Occupied(mut e) => {
                let curr = e.get();
                if (res.distance - curr.distance).abs() < FLOAT_PRECISION_EPSILON {
                    if res.tick < curr.tick {
                        e.insert(res);
                    }
                } else if res.distance < curr.distance {
                    e.insert(res);
                }
            }
        }
    }

    let mut final_results: Vec<TNTResult> = best_map.into_values().collect();
    final_results.sort_by(|a, b| a.distance.partial_cmp(&b.distance).unwrap());
    final_results
}

fn resolve_vectors_for_direction(
    cannon: &Cannon,
    direction: Direction,
) -> (Space3D, Space3D, Space3D) {
    let mut pearl_calc_pos = cannon.pearl.offset;
    pearl_calc_pos.y = cannon.pearl.position.y;

    let blue_duper = cannon
        .default_blue_duper
        .unwrap_or(LayoutDirection::NorthEast);
    let red_duper = cannon
        .default_red_duper
        .unwrap_or(LayoutDirection::NorthWest);

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

    let red_vec = simulation::calculate_tnt_motion(pearl_calc_pos, red_tnt_loc);
    let blue_vec = simulation::calculate_tnt_motion(pearl_calc_pos, blue_tnt_loc);

    let vert_vec = if let Some(v_pos) = cannon.vertical_tnt {
        simulation::calculate_tnt_motion(pearl_calc_pos, v_pos)
    } else {
        Space3D::default()
    };

    (red_vec, blue_vec, vert_vec)
}

impl Space3D {
    #[inline]
    fn dot(&self, other: Space3D) -> f64 {
        self.x * other.x + self.y * other.y + self.z * other.z
    }

    #[inline]
    fn cross(&self, other: Space3D) -> Space3D {
        Space3D {
            x: self.y * other.z - self.z * other.y,
            y: self.z * other.x - self.x * other.z,
            z: self.x * other.y - self.y * other.x,
        }
    }
}

fn solve_tnt_system_3d(
    red: Space3D,
    blue: Space3D,
    vert: Space3D,
    target: Space3D,
) -> Option<(f64, f64, f64)> {
    let det = red.dot(blue.cross(vert));

    if det.abs() < FLOAT_PRECISION_EPSILON {
        return None;
    }

    let dr = target.dot(blue.cross(vert));
    let db = red.dot(target.cross(vert));
    let dv = red.dot(blue.cross(target));

    Some((dr / det, db / det, dv / det))
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
    let n = Direction::North as u8;
    let s = Direction::South as u8;
    let w = Direction::West as u8;
    let e = Direction::East as u8;

    if (bits & (n | w)) == (n | w) {
        LayoutDirection::NorthWest
    } else if (bits & (n | e)) == (n | e) {
        LayoutDirection::NorthEast
    } else if (bits & (s | w)) == (s | w) {
        LayoutDirection::SouthWest
    } else {
        LayoutDirection::SouthEast
    }
}

pub fn calculate_pearl_trace(
    cannon: &Cannon,
    red_tnt: u32,
    blue_tnt: u32,
    vertical_tnt: u32,
    direction: Direction,
    max_ticks: u32,
    world_collisions: &[AABBBox],
    version: PearlVersion,
) -> Option<CalculationResult> {
    let (red_vec, blue_vec, vert_vec) = resolve_vectors_for_direction(cannon, direction);

    let total_tnt_motion = (red_vec * red_tnt as f64)
        + (blue_vec * blue_tnt as f64)
        + (vert_vec * vertical_tnt as f64);
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
    world_collisions: &[AABBBox],
    version: PearlVersion,
) -> Option<CalculationResult> {
    let total_explosion_motion = tnt_charges
        .iter()
        .filter(|(_, count)| *count > 0)
        .map(|(tnt_pos, count)| {
            simulation::calculate_tnt_motion(pearl_position, *tnt_pos) * (*count as f64)
        })
        .fold(
            Space3D::default(),
            |accumulated_motion, motion_component| accumulated_motion + motion_component,
        );

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
    world_collisions: &[AABBBox],
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
