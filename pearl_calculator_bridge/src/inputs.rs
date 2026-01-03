use pearl_calculator_core::calculation::inputs::{Cannon, Pearl};

use pearl_calculator_core::physics::entities::movement::PearlVersion;
use pearl_calculator_core::physics::world::direction::Direction;
use pearl_calculator_core::physics::world::layout_direction::LayoutDirection;
use pearl_calculator_core::physics::world::space::Space3D;
use pearl_calculator_core::settings::CannonMode;
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
    pub destination_y: Option<f64>,
    pub destination_z: f64,

    pub max_tnt: u32,
    pub max_ticks: u32,
    pub max_distance: f64,
    pub version: String,

    pub vertical_tnt: Option<Space3DInput>,
    pub mode: Option<String>,
}

impl CalculationInput {
    pub fn get_version(&self) -> Result<PearlVersion, String> {
        parse_version(&self.version)
    }

    pub fn get_cannon(&self) -> Result<Cannon, String> {
        build_cannon(
            self.pearl_x,
            self.pearl_y,
            self.pearl_z,
            self.pearl_motion_x,
            self.pearl_motion_y,
            self.pearl_motion_z,
            self.offset_x,
            self.offset_z,
            self.cannon_y,
            &self.north_west_tnt,
            &self.north_east_tnt,
            &self.south_west_tnt,
            &self.south_east_tnt,
            &self.default_red_direction,
            &self.default_blue_direction,
            self.vertical_tnt,
            self.mode.clone(),
        )
    }

    pub fn get_destination(&self) -> Space3D {
        Space3D::new(
            self.destination_x,
            self.destination_y.unwrap_or(0.0),
            self.destination_z,
        )
    }
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PearlTraceInput {
    pub red_tnt: u32,
    pub blue_tnt: u32,
    pub vertical_tnt_amount: Option<u32>,
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
    pub destination_y: Option<f64>,
    pub destination_z: f64,
    pub direction: Option<String>,
    pub version: String,
    pub vertical_tnt: Option<Space3DInput>,
    pub mode: Option<String>,
}

impl PearlTraceInput {
    pub fn get_version(&self) -> Result<PearlVersion, String> {
        parse_version(&self.version)
    }

    pub fn get_cannon(&self) -> Result<Cannon, String> {
        build_cannon(
            self.pearl_x,
            self.pearl_y,
            self.pearl_z,
            self.pearl_motion_x,
            self.pearl_motion_y,
            self.pearl_motion_z,
            self.offset_x,
            self.offset_z,
            self.cannon_y,
            &self.north_west_tnt,
            &self.north_east_tnt,
            &self.south_west_tnt,
            &self.south_east_tnt,
            &self.default_red_direction,
            &self.default_blue_direction,
            self.vertical_tnt,
            self.mode.clone(),
        )
    }

    pub fn get_flight_direction(&self) -> Result<Direction, String> {
        let default_red = parse_layout_direction(&self.default_red_direction)
            .ok_or_else(|| "Invalid red direction".to_string())?;

        if let Some(dir_str) = &self.direction {
            Ok(match dir_str.as_str() {
                "North" => Direction::North,
                "South" => Direction::South,
                "West" => Direction::West,
                "East" => Direction::East,
                _ => direction_from_layout(default_red),
            })
        } else {
            Ok(direction_from_layout(default_red))
        }
    }
}

#[derive(Debug, Deserialize, Clone, Copy)]
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

impl RawTraceInput {
    pub fn get_version(&self) -> Result<PearlVersion, String> {
        parse_version(&self.version)
    }
}

fn parse_version(s: &str) -> Result<PearlVersion, String> {
    match s {
        "Legacy" => Ok(PearlVersion::Legacy),
        "Post1205" => Ok(PearlVersion::Post1205),
        "Post1212" => Ok(PearlVersion::Post1212),
        _ => Err("Invalid pearl version".to_string()),
    }
}

fn parse_layout_direction(s: &str) -> Option<LayoutDirection> {
    match s {
        "NorthWest" => Some(LayoutDirection::NorthWest),
        "NorthEast" => Some(LayoutDirection::NorthEast),
        "SouthWest" => Some(LayoutDirection::SouthWest),
        "SouthEast" => Some(LayoutDirection::SouthEast),
        _ => None,
    }
}

fn direction_from_layout(layout: LayoutDirection) -> Direction {
    match layout {
        LayoutDirection::NorthWest => Direction::North,
        LayoutDirection::NorthEast => Direction::East,
        LayoutDirection::SouthWest => Direction::West,
        LayoutDirection::SouthEast => Direction::South,
        _ => unreachable!(),
    }
}

fn build_cannon(
    px: f64,
    py: f64,
    pz: f64,
    pmx: f64,
    pmy: f64,
    pmz: f64,
    ox: f64,
    oz: f64,
    cy: f64,
    nw: &Space3DInput,
    ne: &Space3DInput,
    sw: &Space3DInput,
    se: &Space3DInput,
    red_dir: &str,
    blue_dir: &str,
    vert: Option<Space3DInput>,
    mode_str: Option<String>,
) -> Result<Cannon, String> {
    let y_offset = cy - py.floor();
    let default_red_direction = parse_layout_direction(red_dir);
    let default_blue_direction = parse_layout_direction(blue_dir);

    let mode = match mode_str.as_deref() {
        Some("Accumulation") => CannonMode::Accumulation,
        _ => CannonMode::Standard,
    };

    let vertical_tnt = vert.map(|v| Space3D::new(v.x, v.y + y_offset, v.z));
    let nw_pos = Space3D::new(nw.x, nw.y + y_offset, nw.z);
    let ne_pos = Space3D::new(ne.x, ne.y + y_offset, ne.z);

    let (red_override, blue_override) = (None, None);

    Ok(Cannon {
        pearl: Pearl {
            position: Space3D::new(px, py + y_offset, pz),
            motion: Space3D::new(pmx, pmy, pmz),
            offset: Space3D::new(ox, 0.0, oz),
        },
        vertical_tnt,
        red_tnt_override: red_override,
        blue_tnt_override: blue_override,
        mode,
        north_west_tnt: nw_pos,
        north_east_tnt: ne_pos,
        south_west_tnt: Space3D::new(sw.x, sw.y + y_offset, sw.z),
        south_east_tnt: Space3D::new(se.x, se.y + y_offset, se.z),
        default_red_duper: default_red_direction,
        default_blue_duper: default_blue_direction,
    })
}
