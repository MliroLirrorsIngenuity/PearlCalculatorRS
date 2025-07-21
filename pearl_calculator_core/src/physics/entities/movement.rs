use crate::physics::aabb::aabb_box::AABBBox;
use crate::physics::constants::constants::{PEARL_DRAG_MULTIPLIER, PEARL_GRAVITY_ACCELERATION};
use crate::physics::entities::pearl_entities::PearlEntity;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PearlVersion {
    Legacy,
    Post1212,
}

pub trait PearlMovement {
    fn run_tick_sequence(pearl: &mut PearlEntity<Self>, world_collisions: &[AABBBox]) where Self: Sized;
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