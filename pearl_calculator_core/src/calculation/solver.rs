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
    pub version: PearlVersion,
    pub plane_intercept_y: bool,
}

pub fn solve_theoretical_tnt(input: &SolverInput) -> HashMap<(i32, i32, i32), Vec<u32>> {
    let true_distance = input.destination - input.start_pos;

    let mut groups: HashMap<(i32, i32, i32), Vec<u32>> = HashMap::new();
    let drag_multiplier = PEARL_DRAG_MULTIPLIER;
    let denominator_constant = 1.0 - drag_multiplier;

    let denominator = input.red_vec.z * input.blue_vec.x - input.blue_vec.z * input.red_vec.x;
    let is_3d_solve = input.vert_vec.length_sq() > FLOAT_PRECISION_EPSILON;

    if !is_3d_solve && denominator.abs() < FLOAT_PRECISION_EPSILON {
        return HashMap::new();
    }

    let gravity = -crate::physics::constants::constants::PEARL_GRAVITY_ACCELERATION;
    let mut sim_grav_vel = 0.0;
    let mut sim_grav_pos = 0.0;
    let mut sim_motion_vel = input.start_motion;
    let mut sim_motion_pos = Space3D::default();
    let mut previous_divider = 0.0;

    for tick in 1..=input.max_ticks {
        let previous_grav_pos = sim_grav_pos;
        let previous_motion_pos = sim_motion_pos;

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
        let divider = input.version.get_projection_multiplier(drag_multiplier) * numerator
            / denominator_constant;

        if is_3d_solve {
            let target_motion = compensated_distance / divider;
            if let Some((r, b, v)) =
                solve_tnt_system_3d(input.red_vec, input.blue_vec, input.vert_vec, target_motion)
            {
                push_candidate(&mut groups, tick, r, b, v);
            }
        } else if input.plane_intercept_y {
            let previous_base = Space3D::new(
                previous_motion_pos.x,
                previous_grav_pos + previous_motion_pos.y,
                previous_motion_pos.z,
            );
            let current_base = Space3D::new(
                sim_motion_pos.x,
                sim_grav_pos + sim_motion_pos.y,
                sim_motion_pos.z,
            );

            if let Some((red, blue)) = solve_standard_plane_intercept_tnt(
                input.red_vec,
                input.blue_vec,
                true_distance,
                previous_base,
                current_base,
                previous_divider,
                divider,
                denominator,
            ) {
                push_candidate(&mut groups, tick, red, blue, 0.0);
            }
        } else {
            let true_red = (compensated_distance.z * input.blue_vec.x
                - compensated_distance.x * input.blue_vec.z)
                / denominator;
            let true_blue =
                (compensated_distance.x - true_red * input.red_vec.x) / input.blue_vec.x;

            push_candidate(
                &mut groups,
                tick,
                true_red / divider,
                true_blue / divider,
                0.0,
            );
        }

        previous_divider = divider;
    }

    groups
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

fn solve_standard_plane_intercept_tnt(
    red_vec: Space3D,
    blue_vec: Space3D,
    true_distance: Space3D,
    previous_base: Space3D,
    current_base: Space3D,
    previous_divider: f64,
    current_divider: f64,
    denominator: f64,
) -> Option<(f64, f64)> {
    let y_from_x_coeff = (red_vec.z * blue_vec.y - blue_vec.z * red_vec.y) / denominator;
    let y_from_z_coeff = (blue_vec.x * red_vec.y - red_vec.x * blue_vec.y) / denominator;

    let base_delta = current_base - previous_base;
    let numerator = true_distance.y
        - previous_base.y
        - y_from_x_coeff * (true_distance.x - previous_base.x)
        - y_from_z_coeff * (true_distance.z - previous_base.z);
    let denominator_s =
        base_delta.y - y_from_x_coeff * base_delta.x - y_from_z_coeff * base_delta.z;

    let interpolation = if denominator_s.abs() <= FLOAT_PRECISION_EPSILON {
        if numerator.abs() <= FLOAT_PRECISION_EPSILON {
            0.5
        } else {
            return None;
        }
    } else {
        numerator / denominator_s
    };

    if !(-FLOAT_PRECISION_EPSILON..=(1.0 + FLOAT_PRECISION_EPSILON)).contains(&interpolation) {
        return None;
    }

    let interpolation = interpolation.clamp(0.0, 1.0);
    let base_at_intercept = previous_base + (base_delta * interpolation);
    let divider_at_intercept =
        previous_divider + ((current_divider - previous_divider) * interpolation);

    if divider_at_intercept.abs() <= FLOAT_PRECISION_EPSILON {
        return None;
    }

    let intercept_motion_x = (true_distance.x - base_at_intercept.x) / divider_at_intercept;
    let intercept_motion_z = (true_distance.z - base_at_intercept.z) / divider_at_intercept;

    let red = (intercept_motion_z * blue_vec.x - intercept_motion_x * blue_vec.z) / denominator;
    let blue = (intercept_motion_x * red_vec.z - intercept_motion_z * red_vec.x) / denominator;

    Some((red, blue))
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
