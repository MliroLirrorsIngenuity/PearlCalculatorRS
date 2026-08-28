use pearl_calculator_core::calculation::calculation::{
    calculate_pearl_trace, calculate_tnt_amount,
};
use pearl_calculator_core::calculation::inputs::{Cannon, Pearl};
use pearl_calculator_core::calculation::results::TNTResult;
use pearl_calculator_core::physics::entities::movement::PearlVersion;
use pearl_calculator_core::physics::world::layout_direction::LayoutDirection;
use pearl_calculator_core::physics::world::space::Space3D;
use pearl_calculator_core::settings::CannonMode;

const MAX_DISTANCE: f64 = 50.0;
const MAX_TICKS: u32 = 2000;
const MAX_TNT: u32 = 2000;
const VERSION: PearlVersion = PearlVersion::Post1212;

fn cannon(vertical: Option<Space3D>) -> Cannon {
    let spread = 0.009999990463256836;
    let tnt_y = 256.7195982426378;
    Cannon {
        pearl: Pearl {
            position: Space3D::new(0.0, 256.56834822789864, 0.0),
            motion: Space3D::new(0.0, 0.5932108267862408, 0.0),
        },
        red_tnt_override: None,
        blue_tnt_override: None,
        vertical_tnt: vertical,
        mode: CannonMode::Standard,
        north_west_tnt: Space3D::new(-spread, tnt_y, -spread),
        north_east_tnt: Space3D::new(spread, tnt_y, -spread),
        south_west_tnt: Space3D::new(-spread, tnt_y, spread),
        south_east_tnt: Space3D::new(spread, tnt_y, spread),
        default_red_duper: Some(LayoutDirection::SouthEast),
        default_blue_duper: Some(LayoutDirection::NorthWest),
    }
}

fn crossing_miss(cannon: &Cannon, result: &TNTResult, destination: Space3D) -> Option<f64> {
    let trace = calculate_pearl_trace(
        cannon,
        result.red,
        result.blue,
        result.vertical,
        result.direction,
        MAX_TICKS,
        &[],
        VERSION,
    )?
    .pearl_trace;

    let mut best: Option<f64> = None;
    for window in trace.windows(2) {
        let (prev, curr) = (window[0], window[1]);
        if let Some(point) = prev.horizontal_plane_intersection(curr, destination.y) {
            let miss =
                ((point.x - destination.x).powi(2) + (point.z - destination.z).powi(2)).sqrt();
            best = Some(best.map_or(miss, |current: f64| current.min(miss)));
        }
    }
    best
}

fn destinations() -> Vec<Space3D> {
    let mut targets = Vec::new();
    for (x, z) in [
        (5981.0, 3700.0),
        (12000.0, 400.0),
        (-3000.0, -3000.0),
        (800.0, 60000.0),
    ] {
        for y in [64.0, 128.0, 200.0] {
            targets.push(Space3D::new(x, y, z));
        }
    }
    targets
}

fn solve(cannon: &Cannon, destination: Space3D, plane_intercept_y: bool) -> Vec<TNTResult> {
    calculate_tnt_amount(
        cannon,
        destination,
        MAX_TNT,
        None,
        MAX_TICKS,
        MAX_DISTANCE,
        VERSION,
        plane_intercept_y,
    )
}

#[test]
fn plane_intercept_reports_the_crossing_not_the_closest_tick() {
    for vertical in [None, Some(Space3D::new(0.0, 254.5, 0.0))] {
        let cannon = cannon(vertical);

        for destination in destinations() {
            let results = solve(&cannon, destination, true);
            assert!(
                !results.is_empty(),
                "no plane intercept solution for {destination:?} vertical={vertical:?}"
            );

            for result in &results {
                assert!(
                    (result.pearl_end_pos.y - destination.y).abs() < 1e-6,
                    "landing not on the plane: {} vs {}",
                    result.pearl_end_pos.y,
                    destination.y
                );

                let reported_horizontal = ((result.pearl_end_pos.x - destination.x).powi(2)
                    + (result.pearl_end_pos.z - destination.z).powi(2))
                .sqrt();
                assert!(
                    (result.distance - reported_horizontal).abs() < 1e-6,
                    "distance is not the horizontal miss on the plane: {} vs {reported_horizontal}",
                    result.distance
                );

                let simulated = crossing_miss(&cannon, result, destination)
                    .expect("traced trajectory must cross the plane");
                assert!(
                    (simulated - result.distance).abs() < 1e-6,
                    "reported miss {} disagrees with the traced crossing {simulated}",
                    result.distance
                );
            }
        }
    }
}

#[test]
fn plane_intercept_beats_point_targeting_on_the_plane() {
    for vertical in [None, Some(Space3D::new(0.0, 254.5, 0.0))] {
        let cannon = cannon(vertical);

        for destination in destinations() {
            let plane_best = solve(&cannon, destination, true)
                .first()
                .map(|result| result.distance)
                .expect("plane intercept must produce a solution");

            let point_best = solve(&cannon, destination, false)
                .iter()
                .filter_map(|result| crossing_miss(&cannon, result, destination))
                .fold(f64::INFINITY, f64::min);

            assert!(
                plane_best <= point_best + 1e-9,
                "plane intercept miss {plane_best} is worse than point targeting {point_best} at {destination:?} (vertical={vertical:?})"
            );
        }
    }
}
