use std::marker::PhantomData;

use crate::physics::aabb::aabb_box::AABBBox;
use crate::physics::constants::constants::{PEARL_HEIGHT, PEARL_RADIUS};
use crate::physics::entities::entities::EntityData;
use crate::physics::entities::movement::PearlMovement;
use crate::physics::world::space::Space3D;

#[derive(Debug, Clone, PartialEq)]
pub struct PearlEntity<M: PearlMovement> {
    pub data: EntityData,
    _movement: PhantomData<M>,
}

impl<M: PearlMovement> PearlEntity<M> {
    pub fn new(position: Space3D, motion: Space3D) -> Self {
        let bounding_box = AABBBox::new(
            position.x - PEARL_RADIUS,
            position.y,
            position.z - PEARL_RADIUS,
            position.x + PEARL_RADIUS,
            position.y + PEARL_HEIGHT,
            position.z + PEARL_RADIUS,
        );
        let mut data = EntityData::new(position, motion, bounding_box);
        data.is_gravity = true;

        Self {
            data,
            _movement: PhantomData,
        }
    }
}
