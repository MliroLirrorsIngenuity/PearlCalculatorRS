use pearl_calculator_core::calculation::calculation::{
    calculate_pearl_trace, calculate_tnt_amount,
};
use pearl_calculator_core::physics::entities::movement::PearlVersion;
use pearl_calculator_core::physics::world::direction::Direction;
use pearl_calculator_core::physics::world::space::Space3D;
use serde::Deserialize;
use std::fs::File;
use std::io::BufReader;

mod common;

#[derive(Deserialize, Debug)]
#[allow(dead_code)]
struct SnapshotCase {
    id: usize,
    source_file: String,
    case_name: String,
    version: PearlVersion,
    input_red: u32,
    input_blue: u32,
    input_vertical: u32,
    input_direction: Direction,
    expected_landing_pos: Space3D,
    expected_ticks: u32,
    tick_10_checkpoint: Option<Space3D>,
}

#[test]
fn test_regression_against_snapshot() {
    let file_path = "tests/fixtures/snapshot.json";

    let file = match File::open(file_path) {
        Ok(f) => f,
        Err(_) => {
            println!("Snapshot file not found, skipping regression test");
            println!("  Run first: cargo test --test gen_snapshot -- --ignored");
            return;
        }
    };

    let reader = BufReader::new(file);
    let cases: Vec<SnapshotCase> = serde_json::from_reader(reader).expect("Invalid JSON format");

    let input_cases = common::load_all_input_cases();

    println!(
        "Starting regression test, {} snapshot cases...\n",
        cases.len()
    );

    let mut passed = 0;
    let mut failed = 0;
    let max_ticks = 120;

    for case in cases {
        print!("[{}] {} ... ", case.id, case.case_name);

        let input_case = input_cases.iter().find(|ic| ic.name == case.source_file);

        let cannon = match input_case {
            Some(ic) => ic.cannon.to_cannon(),
            None => {
                println!("SKIP (config '{}' not found)", case.source_file);
                continue;
            }
        };

        let trace_result = calculate_pearl_trace(
            &cannon,
            case.input_red,
            case.input_blue,
            case.input_vertical,
            case.input_direction,
            max_ticks,
            &[],
            case.version,
        );

        let trace = match trace_result {
            Some(t) => t,
            None => {
                println!("FAIL (trace calculation failed)");
                failed += 1;
                continue;
            }
        };

        let pos_diff = trace.landing_position.distance(&case.expected_landing_pos);

        if pos_diff >= 1e-8 {
            println!(
                "FAIL (position mismatch)\n  Expected: {:?}\n  Actual:   {:?}\n  Diff: {:.10e}",
                case.expected_landing_pos, trace.landing_position, pos_diff
            );
            failed += 1;
            continue;
        }

        if let Some(expected_tick_10) = case.tick_10_checkpoint {
            if trace.pearl_trace.len() > 10 {
                let actual_tick_10 = trace.pearl_trace[10];
                let tick_10_diff = actual_tick_10.distance(&expected_tick_10);

                if tick_10_diff >= 1e-6 {
                    println!(
                        "FAIL (Tick 10 mismatch)\n  Expected: {:?}\n  Actual:   {:?}\n  Diff: {:.10e}",
                        expected_tick_10, actual_tick_10, tick_10_diff
                    );
                    failed += 1;
                    continue;
                }
            }
        }

        if case.input_red < 100_000 && case.input_blue < 10_000 {
            let solver_results = calculate_tnt_amount(
                &cannon,
                case.expected_landing_pos,
                100_000,
                None,
                max_ticks,
                50.0,
                case.version,
            );

            let found_original = solver_results
                .iter()
                .any(|r| r.red == case.input_red && r.blue == case.input_blue);

            if !found_original {
                println!(
                    "FAIL (solver cannot recover)\n  Target: {:?}\n  Expected: R={}, B={}\n  Found {} results",
                    case.expected_landing_pos,
                    case.input_red,
                    case.input_blue,
                    solver_results.len()
                );
                failed += 1;
                continue;
            }
        }

        println!("OK");
        passed += 1;
    }

    println!("\n========================================");
    println!(
        "Regression test complete: {} passed, {} failed",
        passed, failed
    );
    println!("========================================");

    assert_eq!(failed, 0, "Regression test failed! {} cases mismatch", failed);
}
