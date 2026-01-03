use crate::physics::world::layout_direction::LayoutDirection;
use crate::physics::world::space::Space3D;
use crate::settings::{CannonMode, CannonSettings};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct GeneralData {
    pub pearl_position: Space3D,
    pub pearl_motion: Space3D,
    pub tnt_charges: Vec<TNT>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct TNT {
    pub position: Space3D,
    pub fuse: u32,
}

#[derive(Debug, Clone, Copy, PartialEq, Default)]
pub struct Pearl {
    pub position: Space3D,
    pub motion: Space3D,
    pub offset: Space3D,
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Cannon {
    pub pearl: Pearl,
    pub red_tnt_override: Option<Space3D>,
    pub blue_tnt_override: Option<Space3D>,
    pub vertical_tnt: Option<Space3D>,
    pub mode: CannonMode,
    pub north_west_tnt: Space3D,
    pub north_east_tnt: Space3D,
    pub south_west_tnt: Space3D,
    pub south_east_tnt: Space3D,
    pub default_red_duper: Option<LayoutDirection>,
    pub default_blue_duper: Option<LayoutDirection>,
}

impl Cannon {
    pub fn from_settings(settings: &CannonSettings) -> Self {
        Self {
            pearl: Pearl {
                position: settings.pearl.position,
                motion: settings.pearl.motion,
                offset: Space3D::new(settings.offset.x, 0.0, settings.offset.z),
            },
            red_tnt_override: settings.red_tnt,
            blue_tnt_override: settings.blue_tnt,
            vertical_tnt: settings.vertical_tnt,
            mode: settings.mode,
            north_west_tnt: settings.north_west_tnt,
            north_east_tnt: settings.north_east_tnt,
            south_west_tnt: settings.south_west_tnt,
            south_east_tnt: settings.south_east_tnt,
            default_red_duper: settings.default_red_direction,
            default_blue_duper: settings.default_blue_direction,
        }
    }
}
