use crate::physics::constants::constants::{FLOAT_PRECISION_EPSILON, PEARL_DRAG_MULTIPLIER};
use crate::physics::entities::movement::PearlVersion;
use crate::physics::world::space::Space3D;
use std::collections::HashMap;

pub struct SolverInput {
    pub red_vec: Space3D,
    pub blue_vec: Space3D,
    pub vert_vec: Space3D,
    pub start_pos: Space3D,
    pub start_motion: Space3D,
    pub destination: Space3D,
    pub max_ticks: u32,
    pub max_distance: f64,
    pub search_radius: i32,
    pub check_3d: bool,
    pub version: PearlVersion,
}

pub struct SolverOutput {
    pub groups: HashMap<(i32, i32, i32), Vec<u32>>,
    pub apex_y: Option<f64>,
}

pub fn solve_theoretical_tnt(input: &SolverInput) -> SolverOutput {
    let true_distance = input.destination - input.start_pos;

    let mut groups: HashMap<(i32, i32, i32), Vec<u32>> = HashMap::new();
    let drag_multiplier = PEARL_DRAG_MULTIPLIER;
    let denominator_constant = 1.0 - drag_multiplier;

    let denominator = input.red_vec.z * input.blue_vec.x - input.blue_vec.z * input.red_vec.x;
    let is_3d_solve = input.vert_vec.length_sq() > FLOAT_PRECISION_EPSILON;

    if !is_3d_solve && denominator.abs() < FLOAT_PRECISION_EPSILON {
        return SolverOutput {
            groups,
            apex_y: None,
        };
    }

    let projection = input.version.get_projection_multiplier(drag_multiplier);
    let y_spread =
        (input.search_radius as f64 + 0.5) * (input.red_vec.y.abs() + input.blue_vec.y.abs());
    let y_spread_supremum = y_spread * projection / denominator_constant;
    let prune_y = input.check_3d && !is_3d_solve;
    let can_terminate = prune_y
        && input.start_motion.x.abs() < FLOAT_PRECISION_EPSILON
        && input.start_motion.z.abs() < FLOAT_PRECISION_EPSILON;
    let mut apex_y: Option<f64> = None;

    let gravity = -crate::physics::constants::constants::PEARL_GRAVITY_ACCELERATION;
    let mut sim_grav_vel = 0.0;
    let mut sim_grav_pos = 0.0;
    let mut sim_motion_vel = input.start_motion;
    let mut sim_motion_pos = Space3D::default();

    for tick in 1..=input.max_ticks {
        sim_grav_vel = input
            .version
            .apply_grav_drag_tick(sim_grav_vel, gravity, drag_multiplier);
        sim_grav_pos += sim_grav_vel;

        let (new_vx, dx) = input
            .version
            .apply_motion_tick(sim_motion_vel.x, drag_multiplier);
        let (new_vy, dy) = input
            .version
            .apply_motion_tick(sim_motion_vel.y, drag_multiplier);
        let (new_vz, dz) = input
            .version
            .apply_motion_tick(sim_motion_vel.z, drag_multiplier);
        sim_motion_vel = Space3D::new(new_vx, new_vy, new_vz);
        sim_motion_pos += Space3D::new(dx, dy, dz);

        let mut compensated_distance = true_distance;
        compensated_distance.y -= sim_grav_pos + sim_motion_pos.y;
        compensated_distance.x -= sim_motion_pos.x;
        compensated_distance.z -= sim_motion_pos.z;

        let numerator = 1.0 - drag_multiplier.powi(tick as i32);
        let divider = projection * numerator / denominator_constant;

        if is_3d_solve {
            let target_motion = compensated_distance / divider;
            if let Some((r, b, v)) =
                solve_tnt_system_3d(input.red_vec, input.blue_vec, input.vert_vec, target_motion)
            {
                push_candidate(&mut groups, tick, r, b, v);
            }
        } else {
            let true_red = (compensated_distance.z * input.blue_vec.x
                - compensated_distance.x * input.blue_vec.z)
                / denominator;
            let true_blue =
                (compensated_distance.x - true_red * input.red_vec.x) / input.blue_vec.x;

            let predicted_y = input.start_pos.y
                + sim_grav_pos
                + sim_motion_pos.y
                + true_red * input.red_vec.y
                + true_blue * input.blue_vec.y;
            apex_y = Some(apex_y.map_or(predicted_y, |current: f64| current.max(predicted_y)));

            if prune_y
                && (predicted_y - input.destination.y).abs() - y_spread * divider.abs()
                    > input.max_distance
            {
                if can_terminate
                    && sim_grav_vel + sim_motion_vel.y < 0.0
                    && predicted_y + y_spread_supremum < input.destination.y - input.max_distance
                {
                    break;
                }
                continue;
            }

            push_candidate(
                &mut groups,
                tick,
                true_red / divider,
                true_blue / divider,
                0.0,
            );
        }
    }

    SolverOutput { groups, apex_y }
}

fn push_candidate(
    groups: &mut HashMap<(i32, i32, i32), Vec<u32>>,
    tick: u32,
    red: f64,
    blue: f64,
    vertical: f64,
) {
    let rounded_red = red.round() as i32;
    let rounded_blue = blue.round() as i32;
    let rounded_vertical = vertical.round() as i32;

    if rounded_red >= 0 && rounded_blue >= 0 && rounded_vertical >= 0 {
        groups
            .entry((rounded_red, rounded_blue, rounded_vertical))
            .or_default()
            .push(tick);
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
