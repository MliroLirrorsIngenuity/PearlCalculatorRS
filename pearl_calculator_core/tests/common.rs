use pearl_calculator_core::calculation::inputs::{Cannon, Pearl};
use pearl_calculator_core::physics::world::layout_direction::LayoutDirection;
use pearl_calculator_core::physics::world::space::Space3D;
use pearl_calculator_core::settings::types::CannonMode;
use serde::Deserialize;
use std::fs;
use std::path::Path;

#[derive(Debug, Clone, Deserialize)]
#[allow(dead_code)]
pub struct InputCase {
    pub name: String,
    pub cannon: CannonConfig,
    pub test_cases: Vec<TestCaseInput>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct CannonConfig {
    pub pearl: PearlConfig,
    #[serde(rename = "north_west_tnt")]
    pub north_west_tnt: Space3D,
    #[serde(rename = "north_east_tnt")]
    pub north_east_tnt: Space3D,
    #[serde(rename = "south_west_tnt")]
    pub south_west_tnt: Space3D,
    #[serde(rename = "south_east_tnt")]
    pub south_east_tnt: Space3D,
    pub vertical_tnt: Option<Space3D>,
    pub default_red_duper: Option<LayoutDirection>,
    pub default_blue_duper: Option<LayoutDirection>,
    pub mode: CannonMode,
}

#[derive(Debug, Clone, Deserialize)]
pub struct PearlConfig {
    pub position: Space3D,
    pub motion: Space3D,
    pub offset: Space3D,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(dead_code)]
pub struct TestCaseInput {
    pub version: pearl_calculator_core::physics::entities::movement::PearlVersion,
    pub red: u32,
    pub blue: u32,
    #[serde(default)]
    pub vertical: u32,
    pub direction: pearl_calculator_core::physics::world::direction::Direction,
}

impl CannonConfig {
    pub fn to_cannon(&self) -> Cannon {
        Cannon {
            pearl: Pearl {
                position: self.pearl.position,
                motion: self.pearl.motion,
                offset: self.pearl.offset,
            },
            north_west_tnt: self.north_west_tnt,
            north_east_tnt: self.north_east_tnt,
            south_west_tnt: self.south_west_tnt,
            south_east_tnt: self.south_east_tnt,
            vertical_tnt: self.vertical_tnt,
            default_red_duper: self.default_red_duper,
            default_blue_duper: self.default_blue_duper,
            red_tnt_override: None,
            blue_tnt_override: None,
            mode: self.mode,
        }
    }
}

pub fn load_all_input_cases() -> Vec<InputCase> {
    let cases_dir = Path::new("tests/input_cases");
    let mut cases = Vec::new();

    if let Ok(entries) = fs::read_dir(cases_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.extension().is_some_and(|ext| ext == "json") {
                if let Ok(content) = fs::read_to_string(&path) {
                    match serde_json::from_str::<InputCase>(&content) {
                        Ok(case) => cases.push(case),
                        Err(e) => eprintln!("Failed to parse {:?}: {}", path, e),
                    }
                }
            }
        }
    }

    cases
}
