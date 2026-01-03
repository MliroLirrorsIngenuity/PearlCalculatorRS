use super::types::*;
use crate::calculation::inputs::GeneralData;
use crate::physics::world::space::Space3D;

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            cannon_settings: vec![CannonSettings::default()],
        }
    }
}

impl Default for CannonSettings {
    fn default() -> Self {
        Self {
            max_tnt: 0,
            red_tnt: None,
            blue_tnt: None,
            vertical_tnt: None,
            mode: CannonMode::Standard,
            default_red_direction: None,
            default_blue_direction: None,
            north_west_tnt: Space3D::default(),
            north_east_tnt: Space3D::default(),
            south_west_tnt: Space3D::default(),
            south_east_tnt: Space3D::default(),
            offset: Surface2D { x: 0.0, z: 0.0 },
            pearl: PearlInfo {
                motion: Space3D::default(),
                position: Space3D::default(),
            },
        }
    }
}

impl Default for GeneralData {
    fn default() -> Self {
        Self {
            pearl_position: Space3D::new(0.5, 4.0625, 0.5),
            pearl_motion: Space3D::new(0.0, 0.0, 0.0),
            tnt_charges: vec![],
        }
    }
}
