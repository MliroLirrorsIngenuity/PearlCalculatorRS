use crate::types::{
    BitDirection, BitInputState, BitTemplateConfig, CannonCenter, CannonMode, ConvertedConfigDraft,
    DecodedConfig, DraftConfig, DraftVector3, EncodableConfig, EncodableOffset, EncodablePearl,
    EncodableVector3, GeneralConfig, ImportedConfiguration, MaskGroup, MultiplierBitInputState,
    MultiplierConfig, PearlMomentum, TntDirection, Vector3,
};
use base64::{Engine as _, engine::general_purpose::STANDARD};
use serde_json::{Map, Value, json};
use std::collections::BTreeMap;

const SCALE: f64 = 1e12;
const PREFIX: &str = "#";

type FloatPath = &'static [&'static str];

const FLOAT_KEYS_ORDER: [FloatPath; 20] = [
    &["NorthEastTNT", "X"],
    &["NorthEastTNT", "Y"],
    &["NorthEastTNT", "Z"],
    &["NorthWestTNT", "X"],
    &["NorthWestTNT", "Y"],
    &["NorthWestTNT", "Z"],
    &["SouthEastTNT", "X"],
    &["SouthEastTNT", "Y"],
    &["SouthEastTNT", "Z"],
    &["SouthWestTNT", "X"],
    &["SouthWestTNT", "Y"],
    &["SouthWestTNT", "Z"],
    &["Offset", "X"],
    &["Offset", "Z"],
    &["Pearl", "Position", "X"],
    &["Pearl", "Position", "Y"],
    &["Pearl", "Position", "Z"],
    &["Pearl", "Motion", "X"],
    &["Pearl", "Motion", "Y"],
    &["Pearl", "Motion", "Z"],
];

pub fn to_backend_mode(mode: CannonMode) -> &'static str {
    match mode {
        CannonMode::Accumulation => "Accumulation",
        _ => "Standard",
    }
}

pub fn get_opposite_direction(direction: Option<TntDirection>) -> TntDirection {
    match direction.unwrap_or(TntDirection::SouthEast) {
        TntDirection::NorthWest => TntDirection::SouthEast,
        TntDirection::SouthEast => TntDirection::NorthWest,
        TntDirection::NorthEast => TntDirection::SouthWest,
        TntDirection::SouthWest => TntDirection::NorthEast,
    }
}

pub fn convert_draft_to_config(
    draft_config: &DraftConfig,
    cannon_center: &CannonCenter,
    red_tnt_location: Option<TntDirection>,
    mode: Option<CannonMode>,
) -> GeneralConfig {
    let cx = parse_number_string(&cannon_center.x);
    let cz = parse_number_string(&cannon_center.z);
    let red_dir = red_tnt_location.unwrap_or(TntDirection::SouthEast);

    let mut config = GeneralConfig {
        north_east_tnt: get_relative_tnt(&draft_config.north_east_tnt, cx, cz),
        north_west_tnt: get_relative_tnt(&draft_config.north_west_tnt, cx, cz),
        south_east_tnt: get_relative_tnt(&draft_config.south_east_tnt, cx, cz),
        south_west_tnt: get_relative_tnt(&draft_config.south_west_tnt, cx, cz),
        pearl_x_position: 0.0,
        pearl_x_motion: parse_number_string(&draft_config.pearl_x_motion),
        pearl_y_motion: parse_number_string(&draft_config.pearl_y_motion),
        pearl_z_motion: parse_number_string(&draft_config.pearl_z_motion),
        pearl_y_position: parse_number_string(&draft_config.pearl_y_position),
        pearl_z_position: 0.0,
        max_tnt: parse_u32_string(&draft_config.max_tnt),
        default_red_tnt_position: red_dir,
        default_blue_tnt_position: get_opposite_direction(Some(red_dir)),
        offset_x: Some(0.0),
        offset_z: Some(0.0),
        ..GeneralConfig::default()
    };

    if matches!(mode, Some(CannonMode::Vector3D)) {
        config.vertical_tnt = Some(get_relative_tnt(&draft_config.vertical_tnt, cx, cz));

        if !draft_config.max_vertical_tnt.trim().is_empty() {
            config.max_vertical_tnt = Some(parse_u32_string(&draft_config.max_vertical_tnt));
        }
        config.mode = mode;
    }

    config
}

pub fn build_export_config(
    draft_config: &DraftConfig,
    cannon_center: &CannonCenter,
    red_tnt_location: Option<TntDirection>,
    bit_template_state: Option<&BitInputState>,
    mode: Option<CannonMode>,
    multiplier_bit_state: Option<&MultiplierBitInputState>,
) -> Value {
    let cx = parse_number_string(&cannon_center.x);
    let cz = parse_number_string(&cannon_center.z);
    let pearl_x = parse_number_string(&draft_config.pearl_x_position);
    let pearl_z = parse_number_string(&draft_config.pearl_z_position);

    let red_dir = red_tnt_location.unwrap_or(TntDirection::SouthEast);

    let mut root = Map::from_iter([
        (
            "NorthEastTNT".to_string(),
            serde_json::to_value(get_relative_tnt_uppercase(&draft_config.north_east_tnt, cx, cz))
                .unwrap_or(Value::Null),
        ),
        (
            "NorthWestTNT".to_string(),
            serde_json::to_value(get_relative_tnt_uppercase(&draft_config.north_west_tnt, cx, cz))
                .unwrap_or(Value::Null),
        ),
        (
            "SouthEastTNT".to_string(),
            serde_json::to_value(get_relative_tnt_uppercase(&draft_config.south_east_tnt, cx, cz))
                .unwrap_or(Value::Null),
        ),
        (
            "SouthWestTNT".to_string(),
            serde_json::to_value(get_relative_tnt_uppercase(&draft_config.south_west_tnt, cx, cz))
                .unwrap_or(Value::Null),
        ),
        (
            "Offset".to_string(),
            json!({
                "X": precise_subtract(pearl_x, cx),
                "Z": precise_subtract(pearl_z, cz),
            }),
        ),
        (
            "Pearl".to_string(),
            json!({
                "Position": {
                    "X": 0.0,
                    "Y": parse_number_string(&draft_config.pearl_y_position),
                    "Z": 0.0,
                },
                "Motion": {
                    "X": parse_number_string(&draft_config.pearl_x_motion),
                    "Y": parse_number_string(&draft_config.pearl_y_motion),
                    "Z": parse_number_string(&draft_config.pearl_z_motion),
                },
            }),
        ),
        (
            "MaxTNT".to_string(),
            Value::from(parse_u32_string(&draft_config.max_tnt)),
        ),
        (
            "DefaultRedTNTDirection".to_string(),
            serde_json::to_value(red_dir).unwrap_or(Value::String("SouthEast".into())),
        ),
        (
            "DefaultBlueTNTDirection".to_string(),
            serde_json::to_value(get_opposite_direction(Some(red_dir)))
                .unwrap_or(Value::String("NorthWest".into())),
        ),
    ]);

    if matches!(mode, Some(CannonMode::Vector3D | CannonMode::Accumulation)) {
        if matches!(mode, Some(CannonMode::Vector3D)) {
            root.insert(
                "VerticalTNT".to_string(),
                serde_json::to_value(get_relative_tnt_uppercase(
                    &draft_config.vertical_tnt,
                    cx,
                    cz,
                ))
                .unwrap_or(Value::Null),
            );

            if !draft_config.max_vertical_tnt.trim().is_empty() {
                root.insert(
                    "MaxVerticalTNT".to_string(),
                    Value::from(parse_u32_string(&draft_config.max_vertical_tnt)),
                );
            }
        }

        root.insert(
            "Mode".to_string(),
            serde_json::to_value(mode.unwrap_or_default()).unwrap_or(Value::String("Standard".into())),
        );
    }

    if let Some(bit_template_state) = bit_template_state {
        let direction_masks: BTreeMap<String, BitDirection> = bit_template_state
            .masks
            .iter()
            .filter_map(|mask| {
                let direction = parse_bit_direction(&mask.direction)?;
                Some((mask.bits.join(""), direction))
            })
            .collect();

        root.insert(
            "SideMode".to_string(),
            Value::from(bit_template_state.side_count),
        );
        root.insert(
            "DirectionMasks".to_string(),
            serde_json::to_value(direction_masks).unwrap_or_else(|_| Value::Object(Map::new())),
        );
        root.insert(
            "RedValues".to_string(),
            Value::from(
                bit_template_state
                    .side_values
                    .iter()
                    .rev()
                    .map(|value| parse_u32_string(value))
                    .collect::<Vec<_>>(),
            ),
        );
        root.insert(
            "IsRedArrowCenter".to_string(),
            Value::from(bit_template_state.is_swapped),
        );
    } else {
        return Value::Object(root);
    }

    if let Some(multiplier_bit_state) = multiplier_bit_state {
        root.insert(
            "MultiplierSideMode".to_string(),
            Value::from(multiplier_bit_state.side_count),
        );
        root.insert(
            "MultiplierValues".to_string(),
            Value::from(
                multiplier_bit_state
                    .side_values
                    .iter()
                    .rev()
                    .map(|value| parse_u32_string(value))
                    .collect::<Vec<_>>(),
            ),
        );
        root.insert(
            "Multiplier".to_string(),
            Value::from(multiplier_bit_state.multiplier),
        );
        root.insert(
            "MultiplierIsSwapped".to_string(),
            Value::from(multiplier_bit_state.is_swapped),
        );
    }

    Value::Object(root)
}

pub fn convert_config_to_draft(
    config: &GeneralConfig,
) -> ConvertedConfigDraft {
    let center = CannonCenter {
        x: (config.pearl_x_position - config.offset_x.unwrap_or(0.0)).to_string(),
        z: (config.pearl_z_position - config.offset_z.unwrap_or(0.0)).to_string(),
    };

    let momentum = PearlMomentum {
        x: config.pearl_x_motion.to_string(),
        y: config.pearl_y_motion.to_string(),
        z: config.pearl_z_motion.to_string(),
    };

    let draft = DraftConfig {
        max_tnt: config.max_tnt.to_string(),
        north_west_tnt: vector3_to_draft(config.north_west_tnt),
        north_east_tnt: vector3_to_draft(config.north_east_tnt),
        south_west_tnt: vector3_to_draft(config.south_west_tnt),
        south_east_tnt: vector3_to_draft(config.south_east_tnt),
        vertical_tnt: config.vertical_tnt.map(vector3_to_draft).unwrap_or_default(),
        max_vertical_tnt: config
            .max_vertical_tnt
            .map(|value| value.to_string())
            .unwrap_or_default(),
        pearl_x_position: config.pearl_x_position.to_string(),
        pearl_y_position: config.pearl_y_position.to_string(),
        pearl_z_position: config.pearl_z_position.to_string(),
        pearl_x_motion: config.pearl_x_motion.to_string(),
        pearl_y_motion: config.pearl_y_motion.to_string(),
        pearl_z_motion: config.pearl_z_motion.to_string(),
    };

    ConvertedConfigDraft {
        draft,
        center,
        momentum,
        red_location: Some(config.default_red_tnt_position),
    }
}

pub fn build_encodable_config(
    config: &GeneralConfig,
    bit_template: Option<&BitTemplateConfig>,
) -> EncodableConfig {
    EncodableConfig {
        north_east_tnt: EncodableVector3::from(config.north_east_tnt),
        north_west_tnt: EncodableVector3::from(config.north_west_tnt),
        south_east_tnt: EncodableVector3::from(config.south_east_tnt),
        south_west_tnt: EncodableVector3::from(config.south_west_tnt),
        offset: EncodableOffset {
            x: config.offset_x.unwrap_or(0.0),
            z: config.offset_z.unwrap_or(0.0),
        },
        pearl: EncodablePearl {
            position: EncodableVector3 {
                x: config.pearl_x_position,
                y: config.pearl_y_position,
                z: config.pearl_z_position,
            },
            motion: EncodableVector3 {
                x: config.pearl_x_motion,
                y: config.pearl_y_motion,
                z: config.pearl_z_motion,
            },
        },
        max_tnt: config.max_tnt,
        default_red_tnt_direction: config.default_red_tnt_position,
        default_blue_tnt_direction: config.default_blue_tnt_position,
        side_mode: bit_template.map(|template| template.side_mode).unwrap_or(0),
        direction_masks: bit_template
            .map(|template| {
                template
                    .direction_masks
                    .iter()
                    .map(|(key, value)| (key.clone(), format!("{value:?}")))
                    .collect()
            })
            .unwrap_or_default(),
        red_values: bit_template
            .map(|template| template.red_values.clone())
            .unwrap_or_default(),
        is_red_arrow_center: bit_template
            .map(|template| template.is_red_arrow_center)
            .unwrap_or(false),
    }
}

pub fn encode_config(data: &EncodableConfig) -> Result<String, String> {
    let mut stream = Vec::new();

    let side_mode = data.side_mode & 0x1f;
    let is_center = if data.is_red_arrow_center { 1 } else { 0 };
    stream.push((side_mode as u8) | ((is_center as u8) << 5));

    stream.push((data.max_tnt & 0xff) as u8);
    stream.push(((data.max_tnt >> 8) & 0xff) as u8);

    let float_values = FLOAT_KEYS_ORDER.map(|path| get_nested_value(data, path));
    let mut mask: u32 = 0;
    let mut float_bytes = Vec::new();

    for (index, value) in float_values.iter().enumerate() {
        if value.abs() > 1e-9 {
            mask |= 1 << index;
            float_bytes.extend(float_to_bytes(*value));
        }
    }

    stream.push((mask & 0xff) as u8);
    stream.push(((mask >> 8) & 0xff) as u8);
    stream.push(((mask >> 16) & 0xff) as u8);
    stream.extend(float_bytes);

    let default_red = dir_to_u8(data.default_red_tnt_direction);
    let default_blue = dir_to_u8(data.default_blue_tnt_direction);
    stream.push((default_red << 4) | (default_blue & 0x0f));

    let d00 = bit_dir_to_u8(data.direction_masks.get("00"));
    let d01 = bit_dir_to_u8(data.direction_masks.get("01"));
    let d10 = bit_dir_to_u8(data.direction_masks.get("10"));
    let d11 = bit_dir_to_u8(data.direction_masks.get("11"));
    stream.push((d11 << 6) | (d10 << 4) | (d01 << 2) | d00);

    for value in data.red_values.iter().take(data.side_mode as usize) {
        write_var_int(&mut stream, *value);
    }

    stream.push(crc8(&stream));

    Ok(format!("{PREFIX}{}", STANDARD.encode(stream)))
}

pub fn decode_config(input: &str) -> Result<DecodedConfig, String> {
    let code = input
        .split('#')
        .find(|segment| !segment.is_empty())
        .ok_or_else(|| "error.config.no_valid_code".to_string())?;

    let bytes = STANDARD
        .decode(code)
        .map_err(|_| "error.config.no_valid_code".to_string())?;

    if bytes.is_empty() {
        return Err("error.config.unexpected_end".to_string());
    }

    let (data_bytes, expected_crc) = bytes.split_at(bytes.len() - 1);
    let actual_crc = crc8(data_bytes);
    if expected_crc[0] != actual_crc {
        return Err("error.config.checksum_mismatch".to_string());
    }

    let mut cursor = ByteCursor::new(data_bytes);
    let header = cursor.next_u8()?;
    let side_mode = (header & 0x1f) as u32;
    let is_red_arrow_center = ((header >> 5) & 0x01) == 1;

    let low = cursor.next_u8()? as u32;
    let high = cursor.next_u8()? as u32;
    let max_tnt = (high << 8) | low;

    let mask = (cursor.next_u8()? as u32)
        | ((cursor.next_u8()? as u32) << 8)
        | ((cursor.next_u8()? as u32) << 16);

    let mut float_values = Vec::with_capacity(20);
    for index in 0..20 {
        if ((mask >> index) & 1) == 1 {
            float_values.push(bytes_to_float([
                cursor.next_u8()?,
                cursor.next_u8()?,
                cursor.next_u8()?,
                cursor.next_u8()?,
            ]));
        } else {
            float_values.push(0.0);
        }
    }

    let dirs = cursor.next_u8()?;
    let default_red_dir = u8_to_dir((dirs >> 4) & 0x0f);
    let default_blue_dir = u8_to_dir(dirs & 0x0f);

    let direction_byte = cursor.next_u8()?;
    let direction_masks = BTreeMap::from_iter([
        ("00".to_string(), u8_to_bit_dir(direction_byte & 0x03)),
        ("01".to_string(), u8_to_bit_dir((direction_byte >> 2) & 0x03)),
        ("10".to_string(), u8_to_bit_dir((direction_byte >> 4) & 0x03)),
        ("11".to_string(), u8_to_bit_dir((direction_byte >> 6) & 0x03)),
    ]);

    let mut red_values = Vec::with_capacity(side_mode as usize);
    for _ in 0..side_mode {
        red_values.push(cursor.read_var_int()?);
    }

    let general_config = GeneralConfig {
        max_tnt,
        north_east_tnt: Vector3 {
            x: float_values[0],
            y: float_values[1],
            z: float_values[2],
        },
        north_west_tnt: Vector3 {
            x: float_values[3],
            y: float_values[4],
            z: float_values[5],
        },
        south_east_tnt: Vector3 {
            x: float_values[6],
            y: float_values[7],
            z: float_values[8],
        },
        south_west_tnt: Vector3 {
            x: float_values[9],
            y: float_values[10],
            z: float_values[11],
        },
        pearl_x_position: float_values[14],
        pearl_y_position: float_values[15],
        pearl_z_position: float_values[16],
        pearl_x_motion: float_values[17],
        pearl_y_motion: float_values[18],
        pearl_z_motion: float_values[19],
        default_red_tnt_position: default_red_dir,
        default_blue_tnt_position: default_blue_dir,
        offset_x: Some(float_values[12]),
        offset_z: Some(float_values[13]),
        ..GeneralConfig::default()
    };

    let bit_template = if side_mode > 0 {
        Some(BitTemplateConfig {
            side_mode,
            direction_masks: direction_masks
                .into_iter()
                .collect::<BTreeMap<String, BitDirection>>(),
            red_values,
            is_red_arrow_center,
        })
    } else {
        None
    };

    Ok(DecodedConfig {
        general_config,
        bit_template,
    })
}

pub fn parse_configuration_content(
    content: &str,
    path: &str,
) -> Result<ImportedConfiguration, String> {
    let json = serde_json::from_str::<Value>(content).map_err(|error| error.to_string())?;
    let root = extract_root(&json);
    let config = normalize_config(root)?;
    let bit_template = extract_bit_template_config(root)?;
    let multiplier_template = extract_multiplier_config(root)?;

    Ok(ImportedConfiguration {
        config,
        bit_template,
        multiplier_template,
        path: path.to_string(),
    })
}

pub fn config_to_input_state(config: Option<&BitTemplateConfig>) -> Option<BitInputState> {
    config.map(|config| BitInputState {
        side_count: config.side_mode,
        masks: vec![
            MaskGroup {
                bits: ["0".to_string(), "0".to_string()],
                direction: config
                    .direction_masks
                    .get("00")
                    .map(|direction| format!("{direction:?}"))
                    .unwrap_or_default(),
            },
            MaskGroup {
                bits: ["0".to_string(), "1".to_string()],
                direction: config
                    .direction_masks
                    .get("01")
                    .map(|direction| format!("{direction:?}"))
                    .unwrap_or_default(),
            },
            MaskGroup {
                bits: ["1".to_string(), "0".to_string()],
                direction: config
                    .direction_masks
                    .get("10")
                    .map(|direction| format!("{direction:?}"))
                    .unwrap_or_default(),
            },
            MaskGroup {
                bits: ["1".to_string(), "1".to_string()],
                direction: config
                    .direction_masks
                    .get("11")
                    .map(|direction| format!("{direction:?}"))
                    .unwrap_or_default(),
            },
        ],
        side_values: config
            .red_values
            .iter()
            .rev()
            .map(|value| if *value == 0 { String::new() } else { value.to_string() })
            .collect(),
        is_swapped: config.is_red_arrow_center,
    })
}

pub fn input_state_to_config(state: &BitInputState) -> BitTemplateConfig {
    BitTemplateConfig {
        side_mode: state.side_count,
        direction_masks: state
            .masks
            .iter()
            .filter_map(|mask| {
                parse_bit_direction(&mask.direction).map(|direction| (mask.bits.join(""), direction))
            })
            .collect(),
        red_values: state
            .side_values
            .iter()
            .rev()
            .map(|value| parse_u32_string(value))
            .collect(),
        is_red_arrow_center: state.is_swapped,
    }
}

pub fn config_to_multiplier_input_state(
    config: Option<&MultiplierConfig>,
) -> Option<MultiplierBitInputState> {
    config.map(|config| MultiplierBitInputState {
        side_count: config.multiplier_side_mode,
        side_values: config
            .multiplier_values
            .iter()
            .rev()
            .map(|value| if *value == 0 { String::new() } else { value.to_string() })
            .collect(),
        multiplier: config.multiplier,
        is_swapped: config.multiplier_is_swapped,
    })
}

pub fn input_state_to_multiplier_config(state: &MultiplierBitInputState) -> MultiplierConfig {
    MultiplierConfig {
        multiplier_side_mode: state.side_count,
        multiplier_values: state
            .side_values
            .iter()
            .rev()
            .map(|value| parse_u32_string(value))
            .collect(),
        multiplier: state.multiplier,
        multiplier_is_swapped: state.is_swapped,
    }
}

fn normalize_config(root: &Value) -> Result<GeneralConfig, String> {
    let red_dir = parse_tnt_direction(
        root.get("DefaultRedDirection")
            .and_then(Value::as_str)
            .or_else(|| root.get("DefaultRedTNTDirection").and_then(Value::as_str)),
    )
    .unwrap_or(TntDirection::SouthEast);

    let blue_dir = parse_tnt_direction(
        root.get("DefaultBlueDirection")
            .and_then(Value::as_str)
            .or_else(|| root.get("DefaultBlueTNTDirection").and_then(Value::as_str)),
    )
    .unwrap_or(TntDirection::SouthEast);

    Ok(GeneralConfig {
        max_tnt: value_to_u32(root.get("MaxTNT")),
        north_west_tnt: read_pascal_vector(root.get("NorthWestTNT")),
        north_east_tnt: read_pascal_vector(root.get("NorthEastTNT")),
        south_west_tnt: read_pascal_vector(root.get("SouthWestTNT")),
        south_east_tnt: read_pascal_vector(root.get("SouthEastTNT")),
        vertical_tnt: root.get("VerticalTNT").map(|value| read_pascal_vector(Some(value))),
        pearl_x_position: number_at(root, &["Pearl", "Position", "X"]),
        pearl_x_motion: number_at(root, &["Pearl", "Motion", "X"]),
        pearl_y_motion: number_at(root, &["Pearl", "Motion", "Y"]),
        pearl_z_motion: number_at(root, &["Pearl", "Motion", "Z"]),
        pearl_y_position: number_at(root, &["Pearl", "Position", "Y"]),
        pearl_z_position: number_at(root, &["Pearl", "Position", "Z"]),
        default_red_tnt_position: red_dir,
        default_blue_tnt_position: blue_dir,
        offset_x: Some(number_at(root, &["Offset", "X"])),
        offset_z: Some(number_at(root, &["Offset", "Z"])),
        max_vertical_tnt: root.get("MaxVerticalTNT").map(|value| value_to_u32(Some(value))),
        mode: parse_cannon_mode(root.get("Mode").and_then(Value::as_str)),
    })
}

fn extract_bit_template_config(root: &Value) -> Result<Option<BitTemplateConfig>, String> {
    let side_mode = value_to_u32(root.get("SideMode"));
    let Some(red_values_raw) = root.get("RedValues").and_then(Value::as_array) else {
        return Ok(None);
    };

    if side_mode == 0 {
        return Ok(None);
    }

    let direction_masks = root
        .get("DirectionMasks")
        .and_then(Value::as_object)
        .map(|masks| {
            masks
                .iter()
                .filter_map(|(key, value)| {
                    parse_bit_direction(value.as_str().unwrap_or_default())
                        .map(|direction| (key.clone(), direction))
                })
                .collect()
        })
        .unwrap_or_default();

    Ok(Some(BitTemplateConfig {
        side_mode,
        direction_masks,
        red_values: red_values_raw.iter().map(|value| value_to_u32(Some(value))).collect(),
        is_red_arrow_center: root
            .get("IsRedArrowCenter")
            .and_then(Value::as_bool)
            .unwrap_or(false),
    }))
}

fn extract_multiplier_config(root: &Value) -> Result<Option<MultiplierConfig>, String> {
    let side_mode = value_to_u32(root.get("MultiplierSideMode"));
    let Some(values) = root.get("MultiplierValues").and_then(Value::as_array) else {
        return Ok(None);
    };

    if side_mode == 0 {
        return Ok(None);
    }

    let multiplier = root
        .get("Multiplier")
        .map(|value| value_to_u32(Some(value)))
        .filter(|value| *value > 0)
        .unwrap_or(200);

    Ok(Some(MultiplierConfig {
        multiplier_side_mode: side_mode,
        multiplier_values: values.iter().map(|value| value_to_u32(Some(value))).collect(),
        multiplier,
        multiplier_is_swapped: root
            .get("MultiplierIsSwapped")
            .and_then(Value::as_bool)
            .unwrap_or(false),
    }))
}

fn extract_root<'a>(value: &'a Value) -> &'a Value {
    value.get("CannonSettings")
        .and_then(Value::as_array)
        .and_then(|items| items.first())
        .unwrap_or(value)
}

fn parse_number_string(value: &str) -> f64 {
    value.trim().parse::<f64>().unwrap_or(0.0)
}

fn parse_u32_string(value: &str) -> u32 {
    parse_number_string(value).round().max(0.0) as u32
}

fn value_to_u32(value: Option<&Value>) -> u32 {
    value.and_then(value_to_f64).unwrap_or(0.0).round().max(0.0) as u32
}

fn value_to_f64(value: &Value) -> Option<f64> {
    value
        .as_f64()
        .or_else(|| value.as_str().and_then(|value| value.parse::<f64>().ok()))
}

fn parse_tnt_direction(value: Option<&str>) -> Option<TntDirection> {
    match value {
        Some("SouthEast") => Some(TntDirection::SouthEast),
        Some("NorthWest") => Some(TntDirection::NorthWest),
        Some("SouthWest") => Some(TntDirection::SouthWest),
        Some("NorthEast") => Some(TntDirection::NorthEast),
        _ => None,
    }
}

fn parse_bit_direction(value: &str) -> Option<BitDirection> {
    match value {
        "North" => Some(BitDirection::North),
        "East" => Some(BitDirection::East),
        "West" => Some(BitDirection::West),
        "South" => Some(BitDirection::South),
        _ => None,
    }
}

fn parse_cannon_mode(value: Option<&str>) -> Option<CannonMode> {
    match value {
        Some("Standard") => Some(CannonMode::Standard),
        Some("Accumulation") => Some(CannonMode::Accumulation),
        Some("Vector3D") => Some(CannonMode::Vector3D),
        _ => None,
    }
}

fn read_pascal_vector(value: Option<&Value>) -> Vector3 {
    let value = value.unwrap_or(&Value::Null);
    Vector3 {
        x: value
            .get("X")
            .and_then(value_to_f64)
            .unwrap_or_default(),
        y: value
            .get("Y")
            .and_then(value_to_f64)
            .unwrap_or_default(),
        z: value
            .get("Z")
            .and_then(value_to_f64)
            .unwrap_or_default(),
    }
}

fn number_at(root: &Value, path: &[&str]) -> f64 {
    let mut current = root;
    for segment in path {
        current = current.get(*segment).unwrap_or(&Value::Null);
    }
    value_to_f64(current).unwrap_or_default()
}

fn precise_subtract(left: f64, right: f64) -> f64 {
    ((left * SCALE).round() - (right * SCALE).round()) / SCALE
}

fn get_relative_tnt(tnt: &DraftVector3, cx: f64, cz: f64) -> Vector3 {
    Vector3 {
        x: precise_subtract(parse_number_string(&tnt.x), cx),
        y: parse_number_string(&tnt.y),
        z: precise_subtract(parse_number_string(&tnt.z), cz),
    }
}

fn get_relative_tnt_uppercase(tnt: &DraftVector3, cx: f64, cz: f64) -> EncodableVector3 {
    EncodableVector3 {
        x: precise_subtract(parse_number_string(&tnt.x), cx),
        y: parse_number_string(&tnt.y),
        z: precise_subtract(parse_number_string(&tnt.z), cz),
    }
}

fn vector3_to_draft(vector: Vector3) -> DraftVector3 {
    DraftVector3 {
        x: vector.x.to_string(),
        y: vector.y.to_string(),
        z: vector.z.to_string(),
    }
}

impl From<Vector3> for EncodableVector3 {
    fn from(value: Vector3) -> Self {
        Self {
            x: value.x,
            y: value.y,
            z: value.z,
        }
    }
}

fn dir_to_u8(direction: TntDirection) -> u8 {
    match direction {
        TntDirection::SouthEast => 7,
        TntDirection::NorthWest => 4,
        TntDirection::SouthWest => 6,
        TntDirection::NorthEast => 5,
    }
}

fn u8_to_dir(value: u8) -> TntDirection {
    match value {
        4 => TntDirection::NorthWest,
        5 => TntDirection::NorthEast,
        6 => TntDirection::SouthWest,
        _ => TntDirection::SouthEast,
    }
}

fn bit_dir_to_u8(direction: Option<&String>) -> u8 {
    match direction.map(String::as_str) {
        Some("South") => 0,
        Some("West") => 1,
        Some("North") => 2,
        Some("East") => 3,
        _ => 0,
    }
}

fn u8_to_bit_dir(value: u8) -> BitDirection {
    match value {
        1 => BitDirection::West,
        2 => BitDirection::North,
        3 => BitDirection::East,
        _ => BitDirection::South,
    }
}

fn get_nested_value(data: &EncodableConfig, path: &[&str]) -> f64 {
    let mut current = serde_json::to_value(data).unwrap_or(Value::Null);
    for segment in path {
        current = current.get(*segment).cloned().unwrap_or(Value::Null);
    }
    value_to_f64(&current).unwrap_or_default()
}

fn write_var_int(buffer: &mut Vec<u8>, value: u32) {
    let mut current = value;
    while current >= 128 {
        buffer.push(((current & 0x7f) as u8) | 0x80);
        current >>= 7;
    }
    buffer.push(current as u8);
}

fn float_to_bytes(value: f64) -> [u8; 4] {
    (value as f32).to_le_bytes()
}

fn bytes_to_float(bytes: [u8; 4]) -> f64 {
    f32::from_le_bytes(bytes) as f64
}

fn crc8(data: &[u8]) -> u8 {
    let mut crc = 0u8;
    for byte in data {
        crc ^= *byte;
        for _ in 0..8 {
            if (crc & 0x80) != 0 {
                crc = (crc << 1) ^ 0x07;
            } else {
                crc <<= 1;
            }
        }
    }
    crc
}

struct ByteCursor<'a> {
    bytes: &'a [u8],
    index: usize,
}

impl<'a> ByteCursor<'a> {
    fn new(bytes: &'a [u8]) -> Self {
        Self { bytes, index: 0 }
    }

    fn next_u8(&mut self) -> Result<u8, String> {
        let byte = self
            .bytes
            .get(self.index)
            .copied()
            .ok_or_else(|| "error.config.unexpected_end".to_string())?;
        self.index += 1;
        Ok(byte)
    }

    fn read_var_int(&mut self) -> Result<u32, String> {
        let mut value = 0u32;
        let mut shift = 0u32;
        loop {
            let byte = self.next_u8()?;
            value |= ((byte & 0x7f) as u32) << shift;
            if (byte & 0x80) == 0 {
                break;
            }
            shift += 7;
        }
        Ok(value)
    }
}
