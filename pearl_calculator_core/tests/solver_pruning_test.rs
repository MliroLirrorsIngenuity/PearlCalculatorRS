use pearl_calculator_core::calculation::calculation::{calculate_tnt_amount, max_reachable_y};
use pearl_calculator_core::calculation::inputs::{Cannon, Pearl};
use pearl_calculator_core::physics::entities::movement::PearlVersion;
use pearl_calculator_core::physics::world::layout_direction::LayoutDirection;
use pearl_calculator_core::physics::world::space::Space3D;
use pearl_calculator_core::settings::CannonMode;

const MAX_DISTANCE: f64 = 50.0;
const MAX_TICKS: u32 = 150;
const MAX_TNT: u32 = 2000;

fn cannon(spread: f64, tnt_y: f64, motion: Space3D, vertical: Option<Space3D>) -> Cannon {
    Cannon {
        pearl: Pearl {
            position: Space3D::new(0.0, 256.56834822789864, 0.0),
            motion,
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

fn scenarios() -> Vec<(&'static str, Cannon)> {
    let flat = 0.009999990463256836;
    vec![
        (
            "flat",
            cannon(
                flat,
                256.7195982426378,
                Space3D::new(0.0, 0.5932108267862408, 0.0),
                None,
            ),
        ),
        (
            "tilted_below",
            cannon(3.0, 253.0, Space3D::new(0.0, 0.0, 0.0), None),
        ),
        (
            "tilted_above",
            cannon(2.5, 259.5, Space3D::new(0.0, 0.4, 0.0), None),
        ),
        (
            "drifting",
            cannon(1.5, 252.5, Space3D::new(0.03, 0.2, -0.04), None),
        ),
    ]
}

fn signatures(results: Vec<pearl_calculator_core::calculation::results::TNTResult>) -> Vec<String> {
    let mut keys: Vec<String> = results
        .into_iter()
        .map(|r| format!("{} {} {} {:.9}", r.red, r.blue, r.tick, r.distance))
        .collect();
    keys.sort();
    keys
}

#[test]
fn pruning_never_drops_a_valid_solution() {
    let destinations = [
        Space3D::new(16405.0, 256.0, 17445.0),
        Space3D::new(-8000.0, 180.0, 3000.0),
        Space3D::new(500.0, 261.0, -500.0),
    ];
    let versions = [
        PearlVersion::Legacy,
        PearlVersion::Post1205,
        PearlVersion::Post1212,
    ];

    for (name, cannon) in scenarios() {
        for version in versions {
            for destination in destinations {
                for plane_intercept_y in [true, false] {
                    let pruned = signatures(calculate_tnt_amount(
                        &cannon,
                        destination,
                        MAX_TNT,
                        None,
                        MAX_TICKS,
                        MAX_DISTANCE,
                        version,
                        plane_intercept_y,
                    ));

                    let exhaustive = signatures(
                        calculate_tnt_amount(
                            &cannon,
                            destination,
                            MAX_TNT,
                            None,
                            MAX_TICKS,
                            f64::INFINITY,
                            version,
                            plane_intercept_y,
                        )
                        .into_iter()
                        .filter(|r| r.distance <= MAX_DISTANCE)
                        .collect(),
                    );

                    assert_eq!(
                        pruned, exhaustive,
                        "{name} {version:?} dest={destination:?} plane={plane_intercept_y}"
                    );
                }
            }
        }
    }
}

#[test]
fn reachable_apex_bounds_every_solution() {
    let destination = Space3D::new(16405.0, 256.0, 17445.0);

    for (name, cannon) in scenarios() {
        for version in [
            PearlVersion::Legacy,
            PearlVersion::Post1205,
            PearlVersion::Post1212,
        ] {
            let apex = max_reachable_y(&cannon, destination, MAX_TICKS, version)
                .unwrap_or_else(|| panic!("{name} {version:?} 没有可达顶点"));

            let results = calculate_tnt_amount(
                &cannon,
                destination,
                MAX_TNT,
                None,
                MAX_TICKS,
                MAX_DISTANCE,
                version,
                true,
            );

            for result in results {
                assert!(
                    result.pearl_end_pos.y <= apex + MAX_DISTANCE,
                    "{name} {version:?} 落点 {} 超出顶点 {apex}",
                    result.pearl_end_pos.y
                );
            }
        }
    }
}

#[test]
fn unreachable_target_yields_no_solution() {
    let (_, cannon) = scenarios().remove(0);
    let destination = Space3D::new(16405.0, 400.0, 17445.0);
    let apex = max_reachable_y(&cannon, destination, MAX_TICKS, PearlVersion::Post1212).unwrap();

    assert!(apex < destination.y);
    assert!(
        calculate_tnt_amount(
            &cannon,
            destination,
            MAX_TNT,
            None,
            MAX_TICKS,
            MAX_DISTANCE,
            PearlVersion::Post1212,
            true,
        )
        .is_empty()
    );
}
