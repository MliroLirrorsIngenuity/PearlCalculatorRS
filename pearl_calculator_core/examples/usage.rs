//! # PearlCalculatorCore API Usage Example
//!
//! This example demonstrates:
//! 1. Loading configuration using the library's built-in serialization
//! 2. Inverse Calculation: Find TNT amounts to reach a destination
//! 3. Forward Calculation: Simulate pearl trajectory with given TNT
//!
//! Run with: `cargo run --example usage`

use std::path::Path;
use std::time::Instant;

use pearl_calculator_core::calculation::calculation::{
    calculate_pearl_trace, calculate_tnt_amount,
};
use pearl_calculator_core::calculation::inputs::Cannon;
use pearl_calculator_core::physics::entities::movement::PearlVersion;
use pearl_calculator_core::physics::world::space::Space3D;
// The library provides built-in serialization types:
use pearl_calculator_core::settings::AppSettings;

// =============================================================================
// Configuration Constants
// =============================================================================

/// Maximum simulation ticks for trajectory calculation
const MAX_SIMULATION_TICKS: u32 = 10000;

/// Search tolerance in blocks - solutions within this 2D distance are accepted
const SEARCH_TOLERANCE_BLOCKS: f64 = 50.0;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("=== PearlCalculator Core API Example ===\n");

    // =========================================================================
    // Step 1: Load Configuration Using Library's Built-in Serialization
    // =========================================================================
    // The library provides `AppSettings` with `load()` and `Cannon::from_settings()`
    // so you don't need to write your own JSON parsing code!
    //
    // Config path: Relative to current working directory (cwd).
    // Expected cwd: Workspace root (PearlCalculatorRS/)
    // Run: cargo run --example usage

    let config_path = Path::new("pearl_calculator_core/examples/config.example.json");

    if !config_path.exists() {
        eprintln!("Error: Config file not found at {:?}", config_path);
        eprintln!("This path is relative to cwd. Run from workspace root:");
        eprintln!("  cd PearlCalculatorRS && cargo run --example usage");
        return Ok(());
    }

    // AppSettings::load() handles all JSON deserialization
    let settings = AppSettings::load(config_path)?;

    // Get the first cannon configuration
    let cannon_settings = &settings.cannon_settings[0];

    // Convert CannonSettings -> Cannon using the provided method
    let cannon = Cannon::from_settings(cannon_settings);
    let max_tnt = cannon_settings.max_tnt;

    println!("1. Configuration Loaded (using library serialization)");
    println!("   Config Path: {:?}", config_path);
    println!(
        "   Pearl Position: ({:.4}, {:.4}, {:.4})",
        cannon.pearl.position.x, cannon.pearl.position.y, cannon.pearl.position.z
    );
    println!(
        "   Pearl Motion:   ({:.4}, {:.4}, {:.4})",
        cannon.pearl.motion.x, cannon.pearl.motion.y, cannon.pearl.motion.z
    );
    println!("   Max TNT/Side:   {}", max_tnt);
    println!("   Mode:           {:?}", cannon.mode);
    println!();

    // =========================================================================
    // Step 2: Inverse Calculation (Find TNT for Destination)
    // =========================================================================
    // Given a target destination, find the optimal TNT configuration.
    // Returns Vec<TNTResult> sorted by distance to target.

    println!("2. Inverse Calculation (Target Solving)");

    let destination = Space3D::new(1145.0, 0.0, 1419.0);
    println!(
        "   Target: ({:.2}, {:.2}, {:.2})",
        destination.x, destination.y, destination.z
    );

    let start_time = Instant::now();

    // calculate_tnt_amount returns Vec<TNTResult>
    // Each result contains: red, blue, vertical, tick, distance, direction
    let mut results = calculate_tnt_amount(
        &cannon,
        destination,
        max_tnt,
        None, // max_vertical_tnt: None = no limit (only used in 3D mode)
        MAX_SIMULATION_TICKS,
        SEARCH_TOLERANCE_BLOCKS,
        PearlVersion::Post1212, // Minecraft 1.21.2+ physics
    );

    println!("   Time: {:.2?}", start_time.elapsed());

    if results.is_empty() {
        println!("   Result: No solution found.");
        return Ok(());
    }

    // Sort by distance (ascending) to get the best solution first
    results.sort_by(|a, b| {
        a.distance
            .partial_cmp(&b.distance)
            .unwrap_or(std::cmp::Ordering::Equal)
    });

    println!("   Solutions Found: {}", results.len());
    println!();

    // Display the best solution
    let best = &results[0];
    println!("   Best Solution (TNTResult):");
    println!("     red:       {} TNT", best.red);
    println!("     blue:      {} TNT", best.blue);
    println!("     vertical:  {} TNT", best.vertical);
    println!(
        "     tick:      {} (tick when pearl reaches target)",
        best.tick
    );
    println!(
        "     distance:  {:.4} blocks (2D distance to target)",
        best.distance
    );
    println!("     direction: {:?}", best.direction);
    println!();

    // =========================================================================
    // Step 3: Forward Calculation (Simulate Trajectory)
    // =========================================================================
    // Given TNT amounts, simulate the pearl's flight path.
    // Returns CalculationResult with tick-by-tick positions.

    println!("3. Forward Calculation (Trajectory Simulation)");

    // Simulate a few ticks past the solution tick
    let sim_ticks = best.tick + 5;

    let start_time = Instant::now();

    // calculate_pearl_trace returns Option<CalculationResult>
    // CalculationResult contains:
    //   - pearl_trace: Vec<Space3D> (position at each tick)
    //   - pearl_motion_trace: Vec<Space3D> (motion at each tick)
    //   - landing_position: Space3D
    //   - final_motion: Space3D
    //   - tick: u32
    let trace = calculate_pearl_trace(
        &cannon,
        best.red,
        best.blue,
        best.vertical,
        best.direction,
        sim_ticks,
        &[], // world_collisions: empty = no obstacles
        PearlVersion::Post1212,
    );

    println!("   Time: {:.2?}", start_time.elapsed());
    println!("   Simulated Ticks: {}", sim_ticks);
    println!();

    match trace {
        Some(result) => {
            println!("   CalculationResult:");
            println!("     trace_points: {}", result.pearl_trace.len());
            println!(
                "     landing_pos:  ({:.4}, {:.4}, {:.4})",
                result.landing_position.x, result.landing_position.y, result.landing_position.z
            );
            println!();

            // Print tick-by-tick trajectory
            println!("   Pearl Trajectory (pearl_trace):");
            println!("   {:>4}  {:>12}  {:>10}  {:>12}", "Tick", "X", "Y", "Z");
            println!("   {}", "-".repeat(44));

            for (tick, pos) in result.pearl_trace.iter().enumerate() {
                println!(
                    "   {:>4}  {:>12.4}  {:>10.4}  {:>12.4}",
                    tick, pos.x, pos.y, pos.z
                );
            }
            println!();

            // Verify the solution tick matches expected distance
            if let Some(pos) = result.pearl_trace.get(best.tick as usize) {
                let dist_2d =
                    ((pos.x - destination.x).powi(2) + (pos.z - destination.z).powi(2)).sqrt();
                println!("   Verification at tick {}:", best.tick);
                println!("     Position: ({:.4}, {:.4}, {:.4})", pos.x, pos.y, pos.z);
                println!("     2D Distance to Target: {:.4} blocks", dist_2d);
            }
        }
        None => {
            println!("   Result: Simulation failed (returned None)");
        }
    }

    println!("\n=== Example Complete ===");
    Ok(())
}
