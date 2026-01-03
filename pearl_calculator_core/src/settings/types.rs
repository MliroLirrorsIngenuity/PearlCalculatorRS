use crate::physics::world::layout_direction::LayoutDirection;
use crate::physics::world::space::Space3D;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(rename_all = "PascalCase")]
pub struct AppSettings {
    pub cannon_settings: Vec<CannonSettings>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum CannonMode {
    Standard,
    Accumulation,
}

impl Default for CannonMode {
    fn default() -> Self {
        Self::Standard
    }
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(rename_all = "PascalCase")]
pub struct CannonSettings {
    #[serde(rename = "MaxTNT")]
    pub max_tnt: u32,
    #[serde(default)]
    pub red_tnt: Option<Space3D>,
    #[serde(default)]
    pub blue_tnt: Option<Space3D>,
    #[serde(default)]
    pub vertical_tnt: Option<Space3D>,
    #[serde(default)]
    pub mode: CannonMode,
    #[serde(default)]
    pub default_red_direction: Option<LayoutDirection>,
    #[serde(default)]
    pub default_blue_direction: Option<LayoutDirection>,
    #[serde(rename = "NorthWestTNT")]
    pub north_west_tnt: Space3D,
    #[serde(rename = "NorthEastTNT")]
    pub north_east_tnt: Space3D,
    #[serde(rename = "SouthWestTNT")]
    pub south_west_tnt: Space3D,
    #[serde(rename = "SouthEastTNT")]
    pub south_east_tnt: Space3D,
    pub offset: Surface2D,
    pub pearl: PearlInfo,
}

#[derive(Debug, Clone, Copy, PartialEq, Deserialize, Serialize)]
#[serde(rename_all = "PascalCase")]
pub struct PearlInfo {
    pub motion: Space3D,
    pub position: Space3D,
}

#[derive(Debug, Clone, Copy, PartialEq, Deserialize, Serialize)]
#[serde(rename_all = "PascalCase")]
pub struct Surface2D {
    pub x: f64,
    pub z: f64,
}
