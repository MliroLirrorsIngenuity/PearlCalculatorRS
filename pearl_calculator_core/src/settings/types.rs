use crate::physics::world::layout_direction::LayoutDirection;
use crate::physics::world::space::Space3D;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(rename_all = "PascalCase")]
pub struct AppSettings {
    pub version: String,
    #[serde(rename = "SelectedCannon")]
    pub selected_cannon_name: String,
    pub cannon_settings: Vec<CannonSettings>,
}

impl AppSettings {
    pub fn get_selected_cannon_settings(&self) -> Option<&CannonSettings> {
        self.cannon_settings
            .iter()
            .find(|c| c.cannon_name == self.selected_cannon_name)
            .or_else(|| self.cannon_settings.first())
    }
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(rename_all = "PascalCase")]
pub struct CannonSettings {
    pub cannon_name: String,
    #[serde(rename = "MaxTNT")]
    pub max_tnt: u32,
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
    #[serde(default, rename = "RedTNTConfiguration")]
    pub red_tnt_configuration: Vec<Space3D>,
    #[serde(default, rename = "BlueTNTConfiguration")]
    pub blue_tnt_configuration: Vec<Space3D>,
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
