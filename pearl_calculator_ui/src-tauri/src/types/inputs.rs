use pearl_calculator_core::physics::world::space::Space3D;
use serde::Deserialize;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CalculationInput {
    pub pearl_x: f64,
    pub pearl_y: f64,
    pub pearl_z: f64,
    pub pearl_motion_x: f64,
    pub pearl_motion_y: f64,
    pub pearl_motion_z: f64,
    pub offset_x: f64,
    pub offset_z: f64,
    pub cannon_y: f64,

    pub north_west_tnt: Space3DInput,
    pub north_east_tnt: Space3DInput,
    pub south_west_tnt: Space3DInput,
    pub south_east_tnt: Space3DInput,

    pub default_red_direction: String,
    pub default_blue_direction: String,

    pub destination_x: f64,
    pub destination_z: f64,

    pub max_tnt: u32,
    pub max_ticks: u32,
    pub max_distance: f64,
    pub version: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PearlTraceInput {
    pub red_tnt: u32,
    pub blue_tnt: u32,
    pub pearl_x: f64,
    pub pearl_y: f64,
    pub pearl_z: f64,
    pub pearl_motion_x: f64,
    pub pearl_motion_y: f64,
    pub pearl_motion_z: f64,
    pub offset_x: f64,
    pub offset_z: f64,
    pub cannon_y: f64,
    pub north_west_tnt: Space3DInput,
    pub north_east_tnt: Space3DInput,
    pub south_west_tnt: Space3DInput,
    pub south_east_tnt: Space3DInput,
    pub default_red_direction: String,
    pub default_blue_direction: String,
    pub destination_x: f64,
    pub destination_z: f64,
    pub direction: Option<String>,
    pub version: String,
}

#[derive(Debug, Deserialize)]
pub struct Space3DInput {
    pub x: f64,
    pub y: f64,
    pub z: f64,
}

impl From<Space3DInput> for Space3D {
    fn from(input: Space3DInput) -> Self {
        Space3D::new(input.x, input.y, input.z)
    }
}

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TntGroupInput {
    pub x: f64,
    pub y: f64,
    pub z: f64,
    pub amount: u32,
}

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RawTraceInput {
    pub pearl_x: f64,
    pub pearl_y: f64,
    pub pearl_z: f64,
    pub pearl_motion_x: f64,
    pub pearl_motion_y: f64,
    pub pearl_motion_z: f64,
    pub tnt_groups: Vec<TntGroupInput>,
    pub version: String,
}
