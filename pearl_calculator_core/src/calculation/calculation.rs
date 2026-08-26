use crate::calculation::inputs::Cannon;
use crate::calculation::results::TNTResult;
use crate::physics::constants::constants::FLOAT_PRECISION_EPSILON;
use crate::physics::entities::movement::PearlVersion;
use crate::physics::world::direction::Direction;
use crate::physics::world::space::Space3D;

const SEARCH_RADIUS: i32 = 5;

pub fn calculate_tnt_amount(
    cannon: &Cannon,
    destination: Space3D,
    max_tnt: u32,
    max_vertical_tnt: Option<u32>,
    max_ticks: u32,
    max_distance: f64,
    version: PearlVersion,
    plane_intercept_y: bool,
) -> Vec<TNTResult> {
    let pearl_start_pos = cannon.pearl.position;
    let true_distance = destination - pearl_start_pos;

    if true_distance.length_sq() < FLOAT_PRECISION_EPSILON {
        return Vec::new();
    }

    let yaw = pearl_start_pos.angle_to_yaw(&destination);
    let flight_directions = Direction::from_angle_with_fallbacks(yaw);

    let max_distance_sq = max_distance * max_distance;
    let mut all_results: Vec<TNTResult> = Vec::new();

    for flight_direction in flight_directions {
        let (red_vec, blue_vec, vert_vec) =
            super::vectors::resolve_vectors_for_direction(cannon, flight_direction);

        let is_valid_3d = vert_vec.length_sq() > FLOAT_PRECISION_EPSILON;

        let solver_input = super::solver::SolverInput {
            red_vec,
            blue_vec,
            vert_vec,
            start_pos: pearl_start_pos,
            start_motion: cannon.pearl.motion,
            destination,
            max_ticks,
            max_distance,
            search_radius: SEARCH_RADIUS,
            check_3d: plane_intercept_y || is_valid_3d,
            version,
        };
        let theoretical_groups = super::solver::solve_theoretical_tnt(&solver_input).groups;

        let search_params = super::optimizer::SearchParams {
            max_tnt,
            max_vertical_tnt,
            search_radius: SEARCH_RADIUS,
            has_vertical: cannon.vertical_tnt.is_some(),
            is_valid_3d,
            cannon_mode: cannon.mode,
        };
        let candidates = super::optimizer::generate_candidates(theoretical_groups, &search_params);

        let results = super::trace::validate_candidates(
            candidates,
            red_vec,
            blue_vec,
            vert_vec,
            cannon.pearl.position,
            cannon.pearl.motion,
            destination,
            max_distance_sq,
            plane_intercept_y,
            version,
            flight_direction,
        );

        all_results.extend(results);
    }

    all_results
}

pub fn max_reachable_y(
    cannon: &Cannon,
    destination: Space3D,
    max_ticks: u32,
    version: PearlVersion,
) -> Option<f64> {
    let pearl_start_pos = cannon.pearl.position;
    let yaw = pearl_start_pos.angle_to_yaw(&destination);

    Direction::from_angle_with_fallbacks(yaw)
        .into_iter()
        .filter_map(|flight_direction| {
            let (red_vec, blue_vec, vert_vec) =
                super::vectors::resolve_vectors_for_direction(cannon, flight_direction);

            super::solver::solve_theoretical_tnt(&super::solver::SolverInput {
                red_vec,
                blue_vec,
                vert_vec,
                start_pos: pearl_start_pos,
                start_motion: cannon.pearl.motion,
                destination,
                max_ticks,
                max_distance: f64::INFINITY,
                search_radius: SEARCH_RADIUS,
                check_3d: false,
                version,
            })
            .apex_y
        })
        .fold(None, |best: Option<f64>, apex| {
            Some(best.map_or(apex, |current| current.max(apex)))
        })
}

pub use super::trace::{calculate_pearl_trace, calculate_raw_trace};
