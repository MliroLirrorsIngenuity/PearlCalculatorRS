use pearl_calculator_core::calculation::results::{CalculationResult, TNTResult};
use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct TNTResultOutput {
    pub distance: f64,
    pub tick: u32,
    pub blue: u32,
    pub red: u32,
    pub total: u32,
    pub pearl_end_pos: Space3DOutput,
    pub pearl_end_motion: Space3DOutput,
    pub direction: String,
}

impl From<TNTResult> for TNTResultOutput {
    fn from(r: TNTResult) -> Self {
        TNTResultOutput {
            distance: r.distance,
            tick: r.tick,
            blue: r.blue,
            red: r.red,
            total: r.total,
            pearl_end_pos: Space3DOutput {
                x: r.pearl_end_pos.x,
                y: r.pearl_end_pos.y,
                z: r.pearl_end_pos.z,
            },
            pearl_end_motion: Space3DOutput {
                x: r.pearl_end_motion.x,
                y: r.pearl_end_motion.y,
                z: r.pearl_end_motion.z,
            },
            direction: format!("{:?}", r.direction),
        }
    }
}

#[derive(Debug, Serialize)]
pub struct PearlTraceOutput {
    pub landing_position: Space3DOutput,
    pub pearl_trace: Vec<Space3DOutput>,
    pub pearl_motion_trace: Vec<Space3DOutput>,
    pub is_successful: bool,
    pub tick: u32,
    pub final_motion: Space3DOutput,
    pub distance: f64,
    pub closest_approach: Option<ClosestApproachOutput>,
}

impl PearlTraceOutput {
    pub fn from_core(result: CalculationResult, destination: Option<(f64, f64)>) -> Self {
        let mut min_distance = f64::INFINITY;
        let mut closest_tick = 0;
        let mut closest_point = Space3DOutput {
            x: 0.0,
            y: 0.0,
            z: 0.0,
        };

        let pearl_trace_output: Vec<Space3DOutput> = result
            .pearl_trace
            .iter()
            .enumerate()
            .map(|(index, pos)| {
                if let Some((dest_x, dest_z)) = destination {
                    let dx = pos.x - dest_x;
                    let dz = pos.z - dest_z;
                    let distance = (dx * dx + dz * dz).sqrt();

                    if distance < min_distance {
                        min_distance = distance;
                        closest_tick = index as u32;
                        closest_point = Space3DOutput {
                            x: pos.x,
                            y: pos.y,
                            z: pos.z,
                        };
                    }
                }

                Space3DOutput {
                    x: pos.x,
                    y: pos.y,
                    z: pos.z,
                }
            })
            .collect();

        let pearl_motion_trace_output: Vec<Space3DOutput> = result
            .pearl_motion_trace
            .iter()
            .map(|pos| Space3DOutput {
                x: pos.x,
                y: pos.y,
                z: pos.z,
            })
            .collect();

        let (distance, closest_approach) = if destination.is_some() {
            (
                result.distance,
                Some(ClosestApproachOutput {
                    tick: closest_tick,
                    point: closest_point,
                    distance: min_distance,
                }),
            )
        } else {
            (0.0, None)
        };

        PearlTraceOutput {
            landing_position: Space3DOutput {
                x: result.landing_position.x,
                y: result.landing_position.y,
                z: result.landing_position.z,
            },
            pearl_trace: pearl_trace_output,
            pearl_motion_trace: pearl_motion_trace_output,
            is_successful: result.is_successful,
            tick: result.tick,
            final_motion: Space3DOutput {
                x: result.final_motion.x,
                y: result.final_motion.y,
                z: result.final_motion.z,
            },
            distance,
            closest_approach,
        }
    }
}

#[derive(Debug, Serialize)]
pub struct ClosestApproachOutput {
    pub tick: u32,
    pub point: Space3DOutput,
    pub distance: f64,
}

#[derive(Debug, Serialize)]
pub struct Space3DOutput {
    #[serde(rename = "X")]
    pub x: f64,
    #[serde(rename = "Y")]
    pub y: f64,
    #[serde(rename = "Z")]
    pub z: f64,
}
