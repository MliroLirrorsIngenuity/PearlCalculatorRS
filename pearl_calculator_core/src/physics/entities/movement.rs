use crate::physics::aabb::aabb_box::AABBBox;
use crate::physics::constants::constants::{PEARL_DRAG_MULTIPLIER, PEARL_GRAVITY_ACCELERATION};
use crate::physics::entities::pearl_entities::PearlEntity;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum PearlVersion {
    /// <= 1.20.4
    /// Float, Move => Drag => Gravity
    Legacy,

    /// 1.20.5 - 1.21.1
    /// Double, Move => Drag => Gravity
    Post1205,

    /// >= 1.21.2
    /// Double, Gravity => Drag => Move
    Post1212,
}

impl PearlVersion {
    pub fn apply_grav_drag_tick(&self, velocity: f64, gravity: f64, drag: f64) -> f64 {
        match self {
            PearlVersion::Legacy | PearlVersion::Post1205 => (velocity * drag) + gravity,
            PearlVersion::Post1212 => (velocity + gravity) * drag,
        }
    }

    pub fn get_projection_multiplier(&self, drag: f64) -> f64 {
        match self {
            PearlVersion::Legacy | PearlVersion::Post1205 => 1.0,
            PearlVersion::Post1212 => drag,
        }
    }

    #[inline]
    pub fn apply_motion_tick(&self, velocity: f64, drag: f64) -> (f64, f64) {
        match self {
            PearlVersion::Legacy | PearlVersion::Post1205 => {
                let displacement = velocity;
                let new_velocity = velocity * drag;
                (new_velocity, displacement)
            }
            PearlVersion::Post1212 => {
                let new_velocity = velocity * drag;
                let displacement = new_velocity;
                (new_velocity, displacement)
            }
        }
    }
}

pub trait PearlMovement {
    fn run_tick_sequence(pearl: &mut PearlEntity<Self>, world_collisions: &[AABBBox])
    where
        Self: Sized;
}

#[derive(Debug, Clone, Copy)]
pub struct MovementLegacy;

impl PearlMovement for MovementLegacy {
    fn run_tick_sequence(pearl: &mut PearlEntity<Self>, world_collisions: &[AABBBox]) {
        pearl.data.move_entity(
            pearl.data.motion.x,
            pearl.data.motion.y,
            pearl.data.motion.z,
            world_collisions,
        );

        let mut mx = pearl.data.motion.x as f32;
        let mut my = pearl.data.motion.y as f32;
        let mut mz = pearl.data.motion.z as f32;

        mx *= PEARL_DRAG_MULTIPLIER as f32;
        my *= PEARL_DRAG_MULTIPLIER as f32;
        mz *= PEARL_DRAG_MULTIPLIER as f32;

        if pearl.data.is_gravity {
            my -= PEARL_GRAVITY_ACCELERATION as f32;
        }

        pearl.data.motion.x = mx as f64;
        pearl.data.motion.y = my as f64;
        pearl.data.motion.z = mz as f64;
    }
}

#[derive(Debug, Clone, Copy)]
pub struct MovementPost1205;

impl PearlMovement for MovementPost1205 {
    fn run_tick_sequence(pearl: &mut PearlEntity<Self>, world_collisions: &[AABBBox]) {
        pearl.data.move_entity(
            pearl.data.motion.x,
            pearl.data.motion.y,
            pearl.data.motion.z,
            world_collisions,
        );

        pearl.data.motion *= PEARL_DRAG_MULTIPLIER;
        if pearl.data.is_gravity {
            pearl.data.motion.y -= PEARL_GRAVITY_ACCELERATION;
        }
    }
}

#[derive(Debug, Clone, Copy)]
pub struct MovementPost1212;

impl PearlMovement for MovementPost1212 {
    fn run_tick_sequence(pearl: &mut PearlEntity<Self>, world_collisions: &[AABBBox]) {
        if pearl.data.is_gravity {
            pearl.data.motion.y -= PEARL_GRAVITY_ACCELERATION;
        }
        pearl.data.motion *= PEARL_DRAG_MULTIPLIER;

        pearl.data.move_entity(
            pearl.data.motion.x,
            pearl.data.motion.y,
            pearl.data.motion.z,
            world_collisions,
        );
    }
}
