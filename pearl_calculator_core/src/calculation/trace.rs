use crate::calculation::inputs::{Cannon, GeneralData};
use crate::calculation::results::{CalculationResult, TNTResult};
use crate::calculation::simulation;
use crate::physics::aabb::aabb_box::AABBBox;
use crate::physics::constants::constants::FLOAT_PRECISION_EPSILON;
use crate::physics::entities::movement::PearlVersion;
use crate::physics::world::direction::Direction;
use crate::physics::world::space::Space3D;
use crate::utils::parallel::*;
use std::collections::HashMap;

pub fn validate_candidates(
    candidates: Vec<((u32, u32, u32), Vec<u32>)>,
    red_vec: Space3D,
    blue_vec: Space3D,
    vert_vec: Space3D,
    pearl_position: Space3D,
    pearl_motion: Space3D,
    pearl_offset: Space3D,
    destination: Space3D,
    max_distance_sq: f64,
    version: PearlVersion,
) -> Vec<TNTResult> {
    let pearl_start_absolute_pos = pearl_position + pearl_offset;
    let check_3d = vert_vec.length_sq() > FLOAT_PRECISION_EPSILON;

    let raw_results: Vec<TNTResult> = candidates
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
                pearl_position,
                pearl_motion: pearl_motion + tnt_impact,
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
    let (red_vec, blue_vec, vert_vec) =
        super::vectors::resolve_vectors_for_direction(cannon, direction);

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
