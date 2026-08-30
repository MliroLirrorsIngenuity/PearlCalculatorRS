use pearl_calculator_core::calculation::results::{CalculationResult, TNTResult};
use pearl_calculator_core::physics::world::space::Space3D;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TNTResultOutput {
    pub distance: f64,
    pub tick: u32,
    pub blue: u32,
    pub red: u32,
    pub vertical: u32,
    pub yaw: f64,
    pub pitch: f64,
    pub total: u32,
    pub pearl_end_pos: Space3DOutput,
    pub pearl_end_motion: Space3DOutput,
    pub direction: String,
}

impl From<TNTResult> for TNTResultOutput {
    fn from(r: TNTResult) -> Self {
        Self::from_core(r, Space3D::default())
    }
}

impl TNTResultOutput {
    pub fn from_core(r: TNTResult, origin: Space3D) -> Self {
        let pearl_end_pos = r.pearl_end_pos + origin;

        TNTResultOutput {
            distance: r.distance,
            tick: r.tick,
            blue: r.blue,
            red: r.red,
            vertical: r.vertical,
            yaw: r.yaw,
            pitch: r.pitch,
            total: r.total,
            pearl_end_pos: Space3DOutput {
                x: pearl_end_pos.x,
                y: pearl_end_pos.y,
                z: pearl_end_pos.z,
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

#[derive(Debug, Clone, Serialize, Deserialize)]
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
    pub fn from_core(
        result: CalculationResult,
        destination: Option<(f64, f64)>,
        destination_y: Option<f64>,
        origin: Space3D,
    ) -> Self {
        let pearl_trace_output: Vec<Space3DOutput> = result
            .pearl_trace
            .iter()
            .map(|pos| {
                let pos = *pos + origin;
                Space3DOutput {
                    x: pos.x,
                    y: pos.y,
                    z: pos.z,
                }
            })
            .collect();

        let closest_approach = destination.and_then(|(dest_x, dest_z)| {
            let closest = if let Some(target_y) = destination_y {
                pearl_trace_output
                    .windows(2)
                    .enumerate()
                    .filter_map(|(tick, window)| {
                        let upper = window[0];
                        let lower = window[1];
                        (upper.y >= target_y && lower.y < target_y).then_some((
                            tick as u32,
                            upper,
                            horizontal_axis_distance(upper, dest_x, dest_z),
                        ))
                    })
                    .min_by(|a, b| a.2.partial_cmp(&b.2).unwrap().then_with(|| a.0.cmp(&b.0)))
            } else {
                pearl_trace_output
                    .iter()
                    .enumerate()
                    .map(|(tick, &point)| {
                        (
                            tick as u32,
                            point,
                            horizontal_distance(point, dest_x, dest_z),
                        )
                    })
                    .min_by(|a, b| a.2.partial_cmp(&b.2).unwrap().then_with(|| a.0.cmp(&b.0)))
            };

            closest.map(|(tick, point, distance)| ClosestApproachOutput {
                tick,
                point,
                distance,
            })
        });

        let pearl_motion_trace_output: Vec<Space3DOutput> = result
            .pearl_motion_trace
            .iter()
            .map(|pos| Space3DOutput {
                x: pos.x,
                y: pos.y,
                z: pos.z,
            })
            .collect();

        let distance = destination.map_or(0.0, |_| result.distance);

        let landing_position = result.landing_position + origin;

        PearlTraceOutput {
            landing_position: Space3DOutput {
                x: landing_position.x,
                y: landing_position.y,
                z: landing_position.z,
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

fn horizontal_distance(point: Space3DOutput, dest_x: f64, dest_z: f64) -> f64 {
    (point.x - dest_x).hypot(point.z - dest_z)
}

fn horizontal_axis_distance(point: Space3DOutput, dest_x: f64, dest_z: f64) -> f64 {
    (point.x - dest_x).abs().max((point.z - dest_z).abs())
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClosestApproachOutput {
    pub tick: u32,
    pub point: Space3DOutput,
    pub distance: f64,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct Space3DOutput {
    #[serde(rename = "X")]
    pub x: f64,
    #[serde(rename = "Y")]
    pub y: f64,
    #[serde(rename = "Z")]
    pub z: f64,
}
