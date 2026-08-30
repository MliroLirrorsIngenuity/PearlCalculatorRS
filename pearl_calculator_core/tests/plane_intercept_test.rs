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
const VERSIONS: [PearlVersion; 3] = [
    PearlVersion::Legacy,
    PearlVersion::Post1205,
    PearlVersion::Post1212,
];

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

fn best_discrete_crossing(
    cannon: &Cannon,
    result: &TNTResult,
    destination: Space3D,
    version: PearlVersion,
) -> Option<(u32, Space3D, f64)> {
    let trace = calculate_pearl_trace(
        cannon,
        result.red,
        result.blue,
        result.vertical,
        result.direction,
        MAX_TICKS,
        &[],
        version,
    )?
    .pearl_trace;
    assert_eq!(trace.len(), MAX_TICKS as usize + 1);

    trace
        .windows(2)
        .enumerate()
        .filter_map(|(tick, window)| {
            let upper = window[0];
            let lower = window[1];
            (upper.y >= destination.y && lower.y < destination.y).then_some((
                tick as u32,
                upper,
                plane_distance(upper, destination),
            ))
        })
        .min_by(|a, b| a.2.partial_cmp(&b.2).unwrap().then_with(|| a.0.cmp(&b.0)))
}

fn plane_distance(point: Space3D, destination: Space3D) -> f64 {
    (point.x - destination.x)
        .abs()
        .max((point.z - destination.z).abs())
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

fn solve(
    cannon: &Cannon,
    destination: Space3D,
    plane_intercept_y: bool,
    version: PearlVersion,
) -> Vec<TNTResult> {
    calculate_tnt_amount(
        cannon,
        destination,
        MAX_TNT,
        None,
        MAX_TICKS,
        MAX_DISTANCE,
        version,
        plane_intercept_y,
    )
}

#[test]
fn plane_intercept_reports_the_upper_integer_tick() {
    for version in VERSIONS {
        for vertical in [None, Some(Space3D::new(0.0, 254.5, 0.0))] {
            let cannon = cannon(vertical);

            for destination in destinations() {
                let results = solve(&cannon, destination, true, version);
                assert!(
                    !results.is_empty(),
                    "no plane intercept solution for {destination:?} vertical={vertical:?} version={version:?}"
                );

                for result in &results {
                    let (expected_tick, expected_position, expected_distance) =
                        best_discrete_crossing(&cannon, result, destination, version)
                            .expect("traced trajectory must cross the plane");

                    assert_eq!(
                        result.tick, expected_tick,
                        "result tick does not identify the best upper tick at {destination:?} vertical={vertical:?} version={version:?}"
                    );
                    assert!(
                        (result.pearl_end_pos.x - expected_position.x).abs() < 1e-9
                            && (result.pearl_end_pos.y - expected_position.y).abs() < 1e-9
                            && (result.pearl_end_pos.z - expected_position.z).abs() < 1e-9,
                        "result point is not the trajectory point at tick {}: {:?} vs {:?}",
                        expected_tick,
                        result.pearl_end_pos,
                        expected_position
                    );
                    assert!(
                        (result.distance - expected_distance).abs() < 1e-9,
                        "distance is not the horizontal miss at the upper tick: {} vs {expected_distance}",
                        result.distance
                    );
                    assert!(
                        result.pearl_end_pos.y >= destination.y,
                        "upper tick is below target Y: {} < {}",
                        result.pearl_end_pos.y,
                        destination.y
                    );
                }
            }
        }
    }
}

#[test]
fn plane_intercept_applies_max_distance_per_horizontal_axis() {
    let cannon = cannon(None);
    let destination = Space3D::new(4700.0, 129.0, 3700.0);
    let results = calculate_tnt_amount(
        &cannon,
        destination,
        800,
        None,
        MAX_TICKS,
        MAX_DISTANCE,
        PearlVersion::Post1212,
        true,
    );

    assert_eq!(results.len(), 2);
    assert!(results.iter().all(|result| {
        (result.pearl_end_pos.x - destination.x).abs() <= MAX_DISTANCE
            && (result.pearl_end_pos.z - destination.z).abs() <= MAX_DISTANCE
    }));

    let diagonal = results
        .iter()
        .find(|result| result.red == 10 && result.blue == 84)
        .expect("axis-aligned bounds must retain the diagonal solution");
    assert!((diagonal.distance - 46.582587).abs() < 1e-6);
    assert!(diagonal.pearl_end_pos.distance_2d(&destination) > MAX_DISTANCE);
}
