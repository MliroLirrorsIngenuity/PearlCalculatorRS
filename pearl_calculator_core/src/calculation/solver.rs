use crate::physics::constants::constants::{FLOAT_PRECISION_EPSILON, PEARL_DRAG_MULTIPLIER};
use crate::physics::entities::movement::PearlVersion;
use crate::physics::world::space::Space3D;
use std::collections::HashMap;

pub struct SolverInput {
    pub red_vec: Space3D,
    pub blue_vec: Space3D,
    pub vert_vec: Space3D,
    pub start_pos: Space3D,
    pub destination: Space3D,
    pub max_ticks: u32,
    pub version: PearlVersion,
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

    for tick in 1..=input.max_ticks {
        sim_grav_vel = input
            .version
            .apply_grav_drag_tick(sim_grav_vel, gravity, drag_multiplier);
        sim_grav_pos += sim_grav_vel;

        let mut compensated_distance = true_distance;
        compensated_distance.y -= sim_grav_pos;

        let numerator = 1.0 - drag_multiplier.powi(tick as i32);
        let divider = input.version.get_projection_multiplier(drag_multiplier) * numerator
            / denominator_constant;

        if is_3d_solve {
            let target_motion = compensated_distance / divider;
            if let Some((r, b, v)) =
                solve_tnt_system_3d(input.red_vec, input.blue_vec, input.vert_vec, target_motion)
            {
                let cr = r.round() as i32;
                let cb = b.round() as i32;
                let cv = v.round() as i32;
                if cr >= 0 && cb >= 0 && cv >= 0 {
                    groups.entry((cr, cb, cv)).or_default().push(tick);
                }
            }
        } else {
            let true_red = (compensated_distance.z * input.blue_vec.x
                - compensated_distance.x * input.blue_vec.z)
                / denominator;
            let true_blue =
                (compensated_distance.x - true_red * input.red_vec.x) / input.blue_vec.x;

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

    groups
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
