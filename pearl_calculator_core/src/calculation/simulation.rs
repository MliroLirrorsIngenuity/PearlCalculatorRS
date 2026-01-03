use crate::calculation::inputs::GeneralData;
use crate::calculation::results::CalculationResult;
use crate::physics::aabb::aabb_box::AABBBox;
use crate::physics::constants::constants::{
    FLOAT_PRECISION_EPSILON, PEARL_EXPLOSION_Y_FACTOR, PEARL_HEIGHT, TNT_ENTITY_Y_OFFSET,
    TNT_EXPLOSION_RADIUS,
};
use crate::physics::entities::movement::{
    MovementLegacy, MovementPost1205, MovementPost1212, PearlMovement, PearlVersion,
};
use crate::physics::entities::pearl_entities::PearlEntity;
use crate::physics::entities::tnt_entities::TNTEntity;
use crate::physics::world::space::Space3D;
use std::collections::LinkedList;

pub struct SimResult {
    pub tick: u32,
    pub position: Space3D,
    pub motion: Space3D,
    pub distance: f64,
}

pub fn run(
    data: &GeneralData,
    destination: Option<Space3D>,
    max_ticks: u32,
    world_collisions: &[AABBBox],
    offset: Option<Space3D>,
    version: PearlVersion,
) -> Option<CalculationResult> {
    match version {
        PearlVersion::Legacy => {
            run_internal::<MovementLegacy>(data, destination, max_ticks, world_collisions, offset)
        }
        PearlVersion::Post1205 => {
            run_internal::<MovementPost1205>(data, destination, max_ticks, world_collisions, offset)
        }
        PearlVersion::Post1212 => {
            run_internal::<MovementPost1212>(data, destination, max_ticks, world_collisions, offset)
        }
    }
}

fn run_internal<M: PearlMovement + Clone>(
    data: &GeneralData,
    destination: Option<Space3D>,
    max_ticks: u32,
    world_collisions: &[AABBBox],
    offset: Option<Space3D>,
) -> Option<CalculationResult> {
    let mut pearl = PearlEntity::<M>::new(data.pearl_position, data.pearl_motion);
    let mut tnt_entities: Vec<TNTEntity> = data
        .tnt_charges
        .iter()
        .map(|tnt| TNTEntity::new(tnt.position, tnt.fuse))
        .collect();

    let mut traces: LinkedList<Space3D> = LinkedList::new();
    let mut motion_traces: LinkedList<Space3D> = LinkedList::new();

    traces.push_back(pearl.data.position);
    motion_traces.push_back(pearl.data.motion);

    for tick in 0..max_ticks {
        for tnt in &mut tnt_entities {
            if tnt.fuse == tick {
                pearl.data.motion += calculate_tnt_motion(pearl.data.position, tnt.data.position);
            }
        }

        M::run_tick_sequence(&mut pearl, world_collisions);

        traces.push_back(pearl.data.position);
        motion_traces.push_back(pearl.data.motion);
    }

    let final_landing_pos = pearl.data.position;

    let (distance_to_dest, is_success) = match destination {
        Some(dest) => {
            let distance = final_landing_pos.distance_2d(&dest);
            (distance, distance <= 0.25)
        }
        None => (0.0, false),
    };

    let mut final_traces: Vec<Space3D> = traces.into_iter().collect();
    let mut final_motion_traces: Vec<Space3D> = motion_traces.into_iter().collect();

    final_traces.dedup();
    final_motion_traces.dedup();

    let (final_landing_pos_with_offset, final_traces_with_offset) = match offset {
        Some(offset_vec) => {
            let final_pos = final_landing_pos + offset_vec;
            let final_traces = final_traces
                .into_iter()
                .map(|pos| pos + offset_vec)
                .collect();
            (final_pos, final_traces)
        }
        None => (final_landing_pos, final_traces),
    };

    Some(CalculationResult {
        landing_position: final_landing_pos_with_offset,
        pearl_trace: final_traces_with_offset,
        pearl_motion_trace: final_motion_traces,
        is_successful: is_success,
        tick: max_ticks,
        final_motion: pearl.data.motion,
        distance: distance_to_dest,
    })
}

pub fn scan_trajectory(
    data: &GeneralData,
    destination: Space3D,
    max_tick: u32,
    valid_ticks: &[bool],
    world_collisions: &[AABBBox],
    offset: Space3D,
    version: PearlVersion,
    max_distance_sq: f64,
    check_3d: bool,
) -> Vec<SimResult> {
    match version {
        PearlVersion::Legacy => scan_internal::<MovementLegacy>(
            data,
            destination,
            max_tick,
            valid_ticks,
            world_collisions,
            offset,
            max_distance_sq,
            check_3d,
        ),
        PearlVersion::Post1205 => scan_internal::<MovementPost1205>(
            data,
            destination,
            max_tick,
            valid_ticks,
            world_collisions,
            offset,
            max_distance_sq,
            check_3d,
        ),
        PearlVersion::Post1212 => scan_internal::<MovementPost1212>(
            data,
            destination,
            max_tick,
            valid_ticks,
            world_collisions,
            offset,
            max_distance_sq,
            check_3d,
        ),
    }
}

pub fn check_landing(
    data: &GeneralData,
    destination: Space3D,
    max_ticks: u32,
    world_collisions: &[AABBBox],
    offset: Space3D,
    version: PearlVersion,
    max_distance_sq: f64,
) -> Option<(Space3D, Space3D, u32)> {
    match version {
        PearlVersion::Legacy => check_internal::<MovementLegacy>(
            data,
            destination,
            max_ticks,
            world_collisions,
            offset,
            max_distance_sq,
        ),
        PearlVersion::Post1205 => check_internal::<MovementPost1205>(
            data,
            destination,
            max_ticks,
            world_collisions,
            offset,
            max_distance_sq,
        ),
        PearlVersion::Post1212 => check_internal::<MovementPost1212>(
            data,
            destination,
            max_ticks,
            world_collisions,
            offset,
            max_distance_sq,
        ),
    }
}

fn scan_internal<M: PearlMovement + Clone>(
    data: &GeneralData,
    destination: Space3D,
    max_tick: u32,
    valid_ticks: &[bool],
    world_collisions: &[AABBBox],
    offset: Space3D,
    max_distance_sq: f64,
    check_3d: bool,
) -> Vec<SimResult> {
    let mut results = Vec::new();
    let mut pearl = PearlEntity::<M>::new(data.pearl_position, data.pearl_motion);
    let mut tnt_entities: Vec<TNTEntity> = data
        .tnt_charges
        .iter()
        .map(|tnt| TNTEntity::new(tnt.position, tnt.fuse))
        .collect();

    for tick in 1..=max_tick {
        for tnt in &mut tnt_entities {
            if tnt.fuse == tick - 1 {
                pearl.data.motion += calculate_tnt_motion(pearl.data.position, tnt.data.position);
            }
        }

        M::run_tick_sequence(&mut pearl, world_collisions);

        let current_pos = pearl.data.position + offset;

        if (tick as usize) < valid_ticks.len() && valid_ticks[tick as usize] {
            let dist_sq = if check_3d {
                current_pos.distance_sq(&destination)
            } else {
                current_pos.distance_2d_sq(&destination)
            };
            if dist_sq <= max_distance_sq {
                results.push(SimResult {
                    tick,
                    position: current_pos,
                    motion: pearl.data.motion,
                    distance: dist_sq.sqrt(),
                });
            }
        }

        if pearl.data.motion.length_sq() < FLOAT_PRECISION_EPSILON {
            let dist_sq = if check_3d {
                current_pos.distance_sq(&destination)
            } else {
                current_pos.distance_2d_sq(&destination)
            };
            if dist_sq <= max_distance_sq {}
            break;
        }
    }
    results
}

fn check_internal<M: PearlMovement + Clone>(
    data: &GeneralData,
    destination: Space3D,
    max_ticks: u32,
    world_collisions: &[AABBBox],
    offset: Space3D,
    max_distance_sq: f64,
) -> Option<(Space3D, Space3D, u32)> {
    let mut pearl = PearlEntity::<M>::new(data.pearl_position, data.pearl_motion);
    let mut tnt_entities: Vec<TNTEntity> = data
        .tnt_charges
        .iter()
        .map(|tnt| TNTEntity::new(tnt.position, tnt.fuse))
        .collect();

    for tick in 0..max_ticks {
        for tnt in &mut tnt_entities {
            if tnt.fuse == tick {
                pearl.data.motion += calculate_tnt_motion(pearl.data.position, tnt.data.position);
            }
        }

        M::run_tick_sequence(&mut pearl, world_collisions);

        if pearl.data.motion.length_sq() < FLOAT_PRECISION_EPSILON {
            break;
        }
    }

    let final_pos = pearl.data.position + offset;

    if final_pos.distance_2d_sq(&destination) <= max_distance_sq {
        Some((final_pos, pearl.data.motion, max_ticks))
    } else {
        None
    }
}

pub fn calculate_tnt_motion(pearl_pos: Space3D, tnt_pos: Space3D) -> Space3D {
    let mut tnt_pos_adjusted = tnt_pos;
    tnt_pos_adjusted.y += TNT_ENTITY_Y_OFFSET;

    let distance_vec = pearl_pos - tnt_pos_adjusted;
    let distance_scalar = distance_vec.length();

    if distance_scalar >= TNT_EXPLOSION_RADIUS {
        return Space3D::default();
    }

    let mut explosion_vec = Space3D::new(
        distance_vec.x,
        pearl_pos.y + (PEARL_EXPLOSION_Y_FACTOR * PEARL_HEIGHT) - tnt_pos_adjusted.y,
        distance_vec.z,
    );

    let explosion_vec_len = explosion_vec.length();
    if explosion_vec_len.abs() < FLOAT_PRECISION_EPSILON {
        return Space3D::default();
    }
    explosion_vec /= explosion_vec_len;

    let explosion_strength = 1.0 - (distance_scalar / TNT_EXPLOSION_RADIUS);

    explosion_vec * explosion_strength
}

trait DistanceSqExt {
    fn distance_2d_sq(&self, other: &Space3D) -> f64;
}

impl DistanceSqExt for Space3D {
    fn distance_2d_sq(&self, other: &Space3D) -> f64 {
        (self.x - other.x).powi(2) + (self.z - other.z).powi(2)
    }
}
