use pearl_calculator_core::calculation::calculation::calculate_pearl_trace;
use pearl_calculator_core::physics::entities::movement::PearlVersion;
use pearl_calculator_core::physics::world::direction::Direction;
use pearl_calculator_core::physics::world::space::Space3D;
use serde::Serialize;
use std::fs::{self, File};
use std::io::Write;

mod common;

#[derive(Serialize)]
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
    #[serde(skip_serializing_if = "Option::is_none")]
    tick_10_checkpoint: Option<Space3D>,
}

#[test]
#[ignore]
fn gen_snapshot_data() {
    let input_cases = common::load_all_input_cases();

    if input_cases.is_empty() {
        panic!("No input cases found! Add JSON files to tests/input_cases/");
    }

    let mut snapshots = Vec::new();
    let mut case_id = 0;
    let max_ticks = 120;

    println!("Generating snapshot data...");
    println!("Found {} config files", input_cases.len());

    for input_case in &input_cases {
        println!("\nProcessing: {}", input_case.name);
        let cannon = input_case.cannon.to_cannon();

        for test_input in &input_case.test_cases {
            print!(
                "  - Version: {:?}, R={}, B={}, Dir={:?} ... ",
                test_input.version, test_input.red, test_input.blue, test_input.direction
            );

            if let Some(result) = calculate_pearl_trace(
                &cannon,
                test_input.red,
                test_input.blue,
                test_input.vertical,
                test_input.direction,
                max_ticks,
                &[],
                test_input.version,
            ) {
                let tick_10_checkpoint = if result.pearl_trace.len() > 10 {
                    Some(result.pearl_trace[10])
                } else {
                    None
                };

                snapshots.push(SnapshotCase {
                    id: case_id,
                    source_file: input_case.name.clone(),
                    case_name: format!(
                        "{:?}_R{}_B{}_V{}",
                        test_input.version, test_input.red, test_input.blue, test_input.vertical
                    ),
                    version: test_input.version,
                    input_red: test_input.red,
                    input_blue: test_input.blue,
                    input_vertical: test_input.vertical,
                    input_direction: test_input.direction,
                    expected_landing_pos: result.landing_position,
                    expected_ticks: result.tick,
                    tick_10_checkpoint,
                });

                println!(
                    "OK (Tick={}, Pos={:?})",
                    result.tick, result.landing_position
                );
                case_id += 1;
            } else {
                println!("SKIP (no result)");
            }
        }
    }

    let dir_path = "tests/fixtures";
    fs::create_dir_all(dir_path).unwrap();

    let file_path = format!("{}/snapshot.json", dir_path);
    let json = serde_json::to_string_pretty(&snapshots).unwrap();
    let mut file = File::create(&file_path).unwrap();
    file.write_all(json.as_bytes()).unwrap();

    println!("\n========================================");
    println!("Generated {} snapshots to {}", snapshots.len(), file_path);
    println!("========================================");
}
