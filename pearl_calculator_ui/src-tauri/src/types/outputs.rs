use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct TNTResultOutput {
    pub distance: f64,
    pub tick: u32,
    pub blue: u32,
    pub red: u32,
    pub total: u32,
    pub pearl_end_pos: Space3DOutput,
    pub pearl_end_motion: Space3DOutput,
    pub direction: String,
}

#[derive(Debug, Serialize)]
pub struct PearlTraceOutput {
    pub landing_position: Space3DOutput,
    pub pearl_trace: Vec<Space3DOutput>,
    pub pearl_motion_trace: Vec<Space3DOutput>,
    pub is_successful: bool,
    pub tick: u32,
    pub final_motion: Space3DOutput,
    pub distance: f64,
    pub closest_approach: Option<ClosestApproachOutput>,
}

#[derive(Debug, Serialize)]
pub struct ClosestApproachOutput {
    pub tick: u32,
    pub point: Space3DOutput,
    pub distance: f64,
}

#[derive(Debug, Serialize)]
pub struct Space3DOutput {
    #[serde(rename = "X")]
    pub x: f64,
    #[serde(rename = "Y")]
    pub y: f64,
    #[serde(rename = "Z")]
    pub z: f64,
}
