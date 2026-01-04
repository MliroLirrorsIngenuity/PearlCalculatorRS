use crate::settings::types::CannonMode;
use std::collections::HashMap;

pub struct SearchParams {
    pub max_tnt: u32,
    pub search_radius: i32,
    pub has_vertical: bool,
    pub cannon_mode: CannonMode,
}

pub fn generate_candidates(
    theoretical_groups: HashMap<(i32, i32, i32), Vec<u32>>,
    params: &SearchParams,
) -> Vec<((u32, u32, u32), Vec<u32>)> {
    let v_range = if params.has_vertical { -1..=1 } else { 0..=0 };
    let mut unique_candidates: HashMap<(u32, u32, u32), Vec<u32>> = HashMap::new();

    for ((center_red, center_blue, center_vert), valid_ticks) in theoretical_groups {
        for r_offset in -params.search_radius..=params.search_radius {
            for b_offset in -params.search_radius..=params.search_radius {
                for v_offset in v_range.clone() {
                    let current_red = center_red + r_offset;
                    let current_blue = center_blue + b_offset;
                    let current_vert = center_vert + v_offset;

                    if current_red < 0 || current_blue < 0 || current_vert < 0 {
                        continue;
                    }

                    let r_u32 = current_red as u32;
                    let b_u32 = current_blue as u32;
                    let v_u32 = current_vert as u32;

                    let max_single_side = r_u32.max(b_u32);
                    if params.max_tnt > 0
                        && params.cannon_mode != CannonMode::Accumulation
                        && max_single_side > params.max_tnt
                    {
                        continue;
                    }

                    unique_candidates
                        .entry((r_u32, b_u32, v_u32))
                        .or_default()
                        .extend(valid_ticks.iter().cloned());
                }
            }
        }
    }

    unique_candidates.into_iter().collect()
}
