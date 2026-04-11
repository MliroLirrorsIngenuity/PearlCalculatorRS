use crate::types::{BitInputState, MaskGroup};
use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BitValidationResult {
    pub is_valid: bool,
    #[serde(default)]
    pub error_key: Option<String>,
    #[serde(default)]
    pub error_params: Option<Value>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BitDecodeResult {
    pub activated_bits: Vec<u32>,
    pub activated_indices: Vec<usize>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MultiplierDecodeResult {
    pub activated_indices: Vec<usize>,
    pub remainder: u32,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BitCalculationResult {
    pub blue: Vec<usize>,
    pub red: Vec<usize>,
    pub direction: [bool; 2],
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(untagged)]
pub enum BitCalculationResponse {
    Success { result: BitCalculationResult },
    Error { error: BitValidationResult },
}

pub fn validate_bit_template(values: &[u32]) -> BitValidationResult {
    if values.is_empty() {
        return BitValidationResult {
            is_valid: false,
            error_key: Some("error.configuration_page.bit_validation.empty".to_string()),
            error_params: None,
        };
    }

    let mut sorted = values.to_vec();
    sorted.sort_unstable();

    if sorted.first().copied().unwrap_or_default() != 1 {
        return BitValidationResult {
            is_valid: false,
            error_key: Some("error.configuration_page.bit_validation.no_unit".to_string()),
            error_params: None,
        };
    }

    let mut current_max_reach = 0u32;
    for value in sorted {
        if value > current_max_reach + 1 {
            return BitValidationResult {
                is_valid: false,
                error_key: Some("error.configuration_page.bit_validation.gap".to_string()),
                error_params: Some(serde_json::json!({
                    "gap": current_max_reach + 1,
                    "sum": current_max_reach,
                })),
            };
        }
        current_max_reach += value;
    }

    BitValidationResult {
        is_valid: true,
        error_key: None,
        error_params: None,
    }
}

pub fn decode_bit_value(values: &[u32], target_value: u32) -> BitDecodeResult {
    let max_capacity: u32 = values.iter().sum();
    if target_value > max_capacity {
        return BitDecodeResult {
            activated_bits: Vec::new(),
            activated_indices: Vec::new(),
        };
    }

    let mut indexed: Vec<(usize, u32)> = values.iter().copied().enumerate().collect();
    indexed.sort_by(|left, right| right.1.cmp(&left.1));

    let mut activated_bits = Vec::new();
    let mut activated_indices = Vec::new();
    let mut remaining = target_value;

    for (index, value) in indexed {
        if remaining >= value {
            remaining -= value;
            activated_bits.push(value);
            activated_indices.push(index);
        }
        if remaining == 0 {
            break;
        }
    }

    BitDecodeResult {
        activated_bits,
        activated_indices,
    }
}

pub fn decode_with_multiplier(
    values: &[u32],
    multiplier: u32,
    target_value: u32,
) -> MultiplierDecodeResult {
    if target_value == 0 || multiplier == 0 {
        return MultiplierDecodeResult {
            activated_indices: Vec::new(),
            remainder: target_value,
        };
    }

    let mut indexed: Vec<(usize, u32)> = values
        .iter()
        .copied()
        .map(|value| value.saturating_mul(multiplier))
        .enumerate()
        .collect();
    indexed.sort_by(|left, right| right.1.cmp(&left.1));

    let mut activated_indices = Vec::new();
    let mut remaining = target_value;

    for (index, value) in indexed {
        if remaining >= value {
            remaining -= value;
            activated_indices.push(index);
        }
        if remaining == 0 {
            break;
        }
    }

    MultiplierDecodeResult {
        activated_indices,
        remainder: remaining,
    }
}

pub fn get_direction_bits(masks: &[MaskGroup], direction: &str) -> [bool; 2] {
    for mask in masks {
        if mask.direction == direction {
            return [mask.bits[0] == "1", mask.bits[1] == "1"];
        }
    }
    [false, false]
}

pub fn parse_template_values(state: &BitInputState) -> Option<Vec<u32>> {
    let mut values = Vec::with_capacity(state.side_values.len());
    for value in &state.side_values {
        let parsed = value.parse::<u32>().ok()?;
        if parsed == 0 {
            return None;
        }
        values.push(parsed);
    }
    Some(values)
}

pub fn calculate_bits(
    state: &BitInputState,
    blue_tnt: u32,
    red_tnt: u32,
    direction: &str,
) -> BitCalculationResponse {
    let Some(values) = parse_template_values(state) else {
        return BitCalculationResponse::Error {
            error: BitValidationResult {
                is_valid: false,
                error_key: Some("error.configuration_page.bit_validation.invalid".to_string()),
                error_params: None,
            },
        };
    };

    let validation = validate_bit_template(&values);
    if !validation.is_valid {
        return BitCalculationResponse::Error { error: validation };
    }

    let max_capacity: u32 = values.iter().sum();
    let max_target = blue_tnt.max(red_tnt);
    if max_target > max_capacity {
        return BitCalculationResponse::Error {
            error: BitValidationResult {
                is_valid: false,
                error_key: Some("error.configuration_page.bit_validation.gap".to_string()),
                error_params: Some(serde_json::json!({
                    "gap": max_target,
                    "sum": max_capacity,
                })),
            },
        };
    }

    let blue_result = decode_bit_value(&values, blue_tnt);
    let red_result = decode_bit_value(&values, red_tnt);
    let direction_bits = get_direction_bits(&state.masks, direction);

    BitCalculationResponse::Success {
        result: BitCalculationResult {
            blue: blue_result.activated_indices,
            red: red_result.activated_indices,
            direction: direction_bits,
        },
    }
}
