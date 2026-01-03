use crate::physics::world::direction::Direction;
use crate::physics::world::space::Space3D;

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct TNTResult {
    pub distance: f64,
    pub tick: u32,
    pub blue: u32,
    pub red: u32,
    pub vertical: u32,
    pub yaw: f64,
    pub pitch: f64,
    pub total: u32,
    pub pearl_end_pos: Space3D,
    pub pearl_end_motion: Space3D,
    pub direction: Direction,
}

#[derive(Debug, Clone, PartialEq)]
pub struct CalculationResult {
    pub landing_position: Space3D,
    pub pearl_trace: Vec<Space3D>,
    pub pearl_motion_trace: Vec<Space3D>,
    pub is_successful: bool,
    pub tick: u32,
    pub final_motion: Space3D,
    pub distance: f64,
}
