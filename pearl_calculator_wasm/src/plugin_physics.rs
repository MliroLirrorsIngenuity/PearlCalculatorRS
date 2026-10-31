use pearl_calculator_core::calculation::simulation::{calculate_tnt_motion, fly};
use pearl_calculator_core::physics::entities::movement::PearlVersion;
use pearl_calculator_core::physics::world::space::Space3D;
use std::cell::RefCell;

const MAX_FLIGHT_TICKS: u32 = 100_000;

thread_local! {
    static BUFFER: RefCell<Vec<f64>> = const { RefCell::new(Vec::new()) };
}

fn version_from_code(code: u32) -> PearlVersion {
    match code {
        0 => PearlVersion::Legacy,
        1 => PearlVersion::Post1205,
        _ => PearlVersion::Post1212,
    }
}

fn fill(write: impl FnOnce(&mut Vec<f64>)) -> *const f64 {
    BUFFER.with_borrow_mut(|buffer| {
        buffer.clear();
        write(buffer);
        buffer.as_ptr()
    })
}

#[unsafe(no_mangle)]
pub extern "C" fn pc_tnt_impulse(
    pearl_x: f64,
    pearl_y: f64,
    pearl_z: f64,
    tnt_x: f64,
    tnt_y: f64,
    tnt_z: f64,
) -> *const f64 {
    let impulse = calculate_tnt_motion(
        Space3D::new(pearl_x, pearl_y, pearl_z),
        Space3D::new(tnt_x, tnt_y, tnt_z),
    );
    fill(|buffer| buffer.extend_from_slice(&[impulse.x, impulse.y, impulse.z]))
}

#[unsafe(no_mangle)]
pub extern "C" fn pc_flight(
    version: u32,
    position_x: f64,
    position_y: f64,
    position_z: f64,
    motion_x: f64,
    motion_y: f64,
    motion_z: f64,
    ticks: u32,
) -> *const f64 {
    fill(|buffer| {
        fly(
            Space3D::new(position_x, position_y, position_z),
            Space3D::new(motion_x, motion_y, motion_z),
            ticks.min(MAX_FLIGHT_TICKS),
            version_from_code(version),
            |position, motion| {
                buffer.extend_from_slice(&[
                    position.x, position.y, position.z, motion.x, motion.y, motion.z,
                ])
            },
        )
    })
}
