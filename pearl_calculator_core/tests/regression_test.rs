use pearl_calculator_core::calculation::calculation::calculate_pearl_trace;
use pearl_calculator_core::calculation::inputs::Cannon;
use pearl_calculator_core::physics::entities::movement::PearlVersion;
use pearl_calculator_core::physics::world::direction::Direction;
use pearl_calculator_core::physics::world::space::Space3D;
use pearl_calculator_core::settings::{CannonSettings, Surface2D};
use serde::Deserialize;
use std::fs::File;
use std::io::BufReader;
use std::path::PathBuf;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "PascalCase")]
struct RegressionConfig {
    cannon_settings: Vec<CannonSettings>,
    regression_cases: Vec<RegressionCase>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "PascalCase")]
struct RegressionCase {
    name: String,
    cannon_index: usize,
    #[serde(rename = "RedTNT")]
    red_tnt: u32,
    #[serde(rename = "BlueTNT")]
    blue_tnt: u32,
    #[serde(rename = "VerticalTNT")]
    vertical_tnt: u32,
    direction: Direction,
    max_ticks: u32,
    version: PearlVersion,
    world_origin: Space3D,
    expected: ExpectedTrace,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "PascalCase")]
struct ExpectedTrace {
    world_landing_position: Surface2D,
    final_motion: Space3D,
    tolerances: TraceTolerances,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "PascalCase")]
struct TraceTolerances {
    world_landing_position: Surface2D,
    final_motion: Space3D,
}

#[test]
fn regression_cases_match_game_trace() {
    let config = load_regression_config();

    assert!(
        !config.regression_cases.is_empty(),
        "regression config should contain at least one case"
    );

    for case in &config.regression_cases {
        let cannon_settings = config
            .cannon_settings
            .get(case.cannon_index)
            .unwrap_or_else(|| {
                panic!(
                    "{} references missing cannon index {}",
                    case.name, case.cannon_index
                )
            });
        let cannon = Cannon::from_settings(cannon_settings);

        let trace = calculate_pearl_trace(
            &cannon,
            case.red_tnt,
            case.blue_tnt,
            case.vertical_tnt,
            case.direction,
            case.max_ticks,
            &[],
            case.version,
        )
        .unwrap_or_else(|| panic!("{} trace should be calculable", case.name));

        let pos = trace.landing_position + case.world_origin;
        let motion = trace.final_motion;

        assert_close(
            &format!("{} world x", case.name),
            pos.x,
            case.expected.world_landing_position.x,
            case.expected.tolerances.world_landing_position.x,
        );
        assert_close(
            &format!("{} world z", case.name),
            pos.z,
            case.expected.world_landing_position.z,
            case.expected.tolerances.world_landing_position.z,
        );
        assert_close(
            &format!("{} motion x", case.name),
            motion.x,
            case.expected.final_motion.x,
            case.expected.tolerances.final_motion.x,
        );
        assert_close(
            &format!("{} motion y", case.name),
            motion.y,
            case.expected.final_motion.y,
            case.expected.tolerances.final_motion.y,
        );
        assert_close(
            &format!("{} motion z", case.name),
            motion.z,
            case.expected.final_motion.z,
            case.expected.tolerances.final_motion.z,
        );
    }
}

fn load_regression_config() -> RegressionConfig {
    let path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("tests")
        .join("fixtures")
        .join("regression_cases.json");
    let file = File::open(&path)
        .unwrap_or_else(|err| panic!("failed to open regression config {path:?}: {err}"));
    let reader = BufReader::new(file);

    serde_json::from_reader(reader)
        .unwrap_or_else(|err| panic!("failed to parse regression config {path:?}: {err}"))
}

fn assert_close(label: &str, actual: f64, expected: f64, tolerance: f64) {
    let diff = (actual - expected).abs();
    assert!(
        diff < tolerance,
        "{label} mismatch: actual={actual}, expected={expected}, diff={diff}, tolerance={tolerance}"
    );
}
