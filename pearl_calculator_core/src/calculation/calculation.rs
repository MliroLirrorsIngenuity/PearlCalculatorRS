use crate::calculation::inputs::Cannon;
use crate::calculation::results::TNTResult;
use crate::physics::constants::constants::FLOAT_PRECISION_EPSILON;
use crate::physics::entities::movement::PearlVersion;
use crate::physics::world::direction::Direction;
use crate::physics::world::space::Space3D;

pub fn calculate_tnt_amount(
    cannon: &Cannon,
    destination: Space3D,
    max_tnt: u32,
    max_vertical_tnt: Option<u32>,
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
    let (red_vec, blue_vec, vert_vec) =
        super::vectors::resolve_vectors_for_direction(cannon, flight_direction);

    let solver_input = super::solver::SolverInput {
        red_vec,
        blue_vec,
        vert_vec,
        start_pos: pearl_start_absolute_pos,
        destination,
        max_ticks,
        version,
    };
    let theoretical_groups = super::solver::solve_theoretical_tnt(&solver_input);

    let is_valid_3d = vert_vec.length_sq() > FLOAT_PRECISION_EPSILON;

    let search_params = super::optimizer::SearchParams {
        max_tnt,
        max_vertical_tnt,
        search_radius: 5,
        has_vertical: cannon.vertical_tnt.is_some(),
        is_valid_3d,
        cannon_mode: cannon.mode,
    };
    let candidates = super::optimizer::generate_candidates(theoretical_groups, &search_params);

    let max_distance_sq = max_distance * max_distance;
    super::trace::validate_candidates(
        candidates,
        red_vec,
        blue_vec,
        vert_vec,
        cannon.pearl.position,
        cannon.pearl.motion,
        cannon.pearl.offset,
        destination,
        max_distance_sq,
        version,
    )
}

pub use super::trace::{calculate_pearl_trace, calculate_raw_trace};
