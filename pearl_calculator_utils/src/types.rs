use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Default)]
pub enum PearlVersion {
    Legacy,
    Post1205,
    #[default]
    Post1212,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Default)]
pub enum CannonMode {
    #[default]
    Standard,
    Accumulation,
    Vector3D,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Default)]
pub enum TntDirection {
    #[default]
    SouthEast,
    NorthWest,
    SouthWest,
    NorthEast,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum BitDirection {
    North,
    East,
    West,
    South,
}

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize, Default)]
pub struct Vector3 {
    pub x: f64,
    pub y: f64,
    pub z: f64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct GeneralConfig {
    pub max_tnt: u32,
    pub north_west_tnt: Vector3,
    pub north_east_tnt: Vector3,
    pub south_west_tnt: Vector3,
    pub south_east_tnt: Vector3,
    pub pearl_x_position: f64,
    #[serde(default)]
    pub pearl_x_motion: f64,
    pub pearl_y_motion: f64,
    #[serde(default)]
    pub pearl_z_motion: f64,
    pub pearl_y_position: f64,
    pub pearl_z_position: f64,
    pub default_red_tnt_position: TntDirection,
    pub default_blue_tnt_position: TntDirection,
    #[serde(default)]
    pub vertical_tnt: Option<Vector3>,
    #[serde(default)]
    pub max_vertical_tnt: Option<u32>,
    #[serde(default)]
    pub mode: Option<CannonMode>,
}

impl Default for GeneralConfig {
    fn default() -> Self {
        Self {
            max_tnt: 0,
            north_west_tnt: Vector3::default(),
            north_east_tnt: Vector3::default(),
            south_west_tnt: Vector3::default(),
            south_east_tnt: Vector3::default(),
            pearl_x_position: 0.0,
            pearl_x_motion: 0.0,
            pearl_y_motion: 0.0,
            pearl_z_motion: 0.0,
            pearl_y_position: 0.0,
            pearl_z_position: 0.0,
            default_red_tnt_position: TntDirection::SouthEast,
            default_blue_tnt_position: TntDirection::SouthEast,
            vertical_tnt: None,
            max_vertical_tnt: None,
            mode: None,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Default)]
pub struct BitTemplateConfig {
    #[serde(rename = "SideMode")]
    pub side_mode: u32,
    #[serde(rename = "DirectionMasks", default)]
    pub direction_masks: BTreeMap<String, BitDirection>,
    #[serde(rename = "RedValues", default)]
    pub red_values: Vec<u32>,
    #[serde(rename = "IsRedArrowCenter", default)]
    pub is_red_arrow_center: bool,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct MultiplierConfig {
    #[serde(rename = "MultiplierSideMode")]
    pub multiplier_side_mode: u32,
    #[serde(rename = "MultiplierValues", default)]
    pub multiplier_values: Vec<u32>,
    #[serde(rename = "Multiplier")]
    pub multiplier: u32,
    #[serde(rename = "MultiplierIsSwapped", default)]
    pub multiplier_is_swapped: bool,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct MaskGroup {
    pub bits: [String; 2],
    pub direction: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct BitInputState {
    pub side_count: u32,
    #[serde(default)]
    pub masks: Vec<MaskGroup>,
    #[serde(default)]
    pub side_values: Vec<String>,
    #[serde(default)]
    pub is_swapped: bool,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MultiplierBitInputState {
    pub side_count: u32,
    #[serde(default)]
    pub side_values: Vec<String>,
    pub multiplier: u32,
    #[serde(default)]
    pub is_swapped: bool,
}

impl Default for MultiplierBitInputState {
    fn default() -> Self {
        Self {
            side_count: 13,
            side_values: vec![String::new(); 13],
            multiplier: 200,
            is_swapped: false,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Default)]
pub struct DraftVector3 {
    pub x: String,
    pub y: String,
    pub z: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Default)]
pub struct DraftConfig {
    pub max_tnt: String,
    pub north_west_tnt: DraftVector3,
    pub north_east_tnt: DraftVector3,
    pub south_west_tnt: DraftVector3,
    pub south_east_tnt: DraftVector3,
    pub vertical_tnt: DraftVector3,
    pub max_vertical_tnt: String,
    pub pearl_x_position: String,
    pub pearl_x_motion: String,
    pub pearl_y_motion: String,
    pub pearl_z_motion: String,
    pub pearl_y_position: String,
    pub pearl_z_position: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Default)]
pub struct PearlMomentum {
    pub x: String,
    pub y: String,
    pub z: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CalculatorInputs {
    pub pearl_x: String,
    pub pearl_z: String,
    pub dest_x: String,
    #[serde(default)]
    pub dest_y: Option<String>,
    #[serde(default)]
    pub plane_intercept_y: bool,
    pub dest_z: String,
    pub cannon_y: String,
    #[serde(default = "default_tick_range")]
    pub tick_range: [u32; 2],
    #[serde(default = "default_distance_range")]
    pub distance_range: [u32; 2],
}

impl Default for CalculatorInputs {
    fn default() -> Self {
        Self {
            pearl_x: String::new(),
            pearl_z: String::new(),
            dest_x: String::new(),
            dest_y: None,
            plane_intercept_y: false,
            dest_z: String::new(),
            cannon_y: "36".to_string(),
            tick_range: default_tick_range(),
            distance_range: default_distance_range(),
        }
    }
}

pub const fn default_tick_range() -> [u32; 2] {
    [0, 20]
}

pub const fn default_distance_range() -> [u32; 2] {
    [0, 20]
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct SimulatorTntGroup {
    pub pos: Vector3,
    pub amount: u32,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct SimulatorPearlState {
    pub pos: Vector3,
    pub momentum: Vector3,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct SimulatorConfig {
    pub pearl: SimulatorPearlState,
    pub tnt_a: SimulatorTntGroup,
    pub tnt_b: SimulatorTntGroup,
    pub tnt_c: SimulatorTntGroup,
    pub tnt_d: SimulatorTntGroup,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportedConfiguration {
    pub config: GeneralConfig,
    pub bit_template: Option<BitTemplateConfig>,
    pub multiplier_template: Option<MultiplierConfig>,
    pub path: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConvertedConfigDraft {
    pub draft: DraftConfig,
    pub momentum: PearlMomentum,
    pub red_location: Option<TntDirection>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DecodedConfig {
    pub general_config: GeneralConfig,
    pub bit_template: Option<BitTemplateConfig>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "PascalCase")]
pub struct EncodableVector3 {
    pub x: f64,
    pub y: f64,
    pub z: f64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "PascalCase")]
pub struct EncodablePearl {
    pub position: EncodableVector3,
    pub motion: EncodableVector3,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct EncodableConfig {
    #[serde(rename = "NorthEastTNT")]
    pub north_east_tnt: EncodableVector3,
    #[serde(rename = "NorthWestTNT")]
    pub north_west_tnt: EncodableVector3,
    #[serde(rename = "SouthEastTNT")]
    pub south_east_tnt: EncodableVector3,
    #[serde(rename = "SouthWestTNT")]
    pub south_west_tnt: EncodableVector3,
    #[serde(rename = "Pearl")]
    pub pearl: EncodablePearl,
    #[serde(rename = "MaxTNT")]
    pub max_tnt: u32,
    #[serde(rename = "DefaultRedTNTDirection")]
    pub default_red_tnt_direction: TntDirection,
    #[serde(rename = "DefaultBlueTNTDirection")]
    pub default_blue_tnt_direction: TntDirection,
    #[serde(rename = "SideMode")]
    pub side_mode: u32,
    #[serde(rename = "DirectionMasks", default)]
    pub direction_masks: BTreeMap<String, String>,
    #[serde(rename = "RedValues", default)]
    pub red_values: Vec<u32>,
    #[serde(rename = "IsRedArrowCenter")]
    pub is_red_arrow_center: bool,
}
