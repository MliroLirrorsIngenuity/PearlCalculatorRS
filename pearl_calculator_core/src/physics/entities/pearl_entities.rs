use crate::physics::aabb::aabb_box::AABBBox;
use crate::physics::constants::constants::{
    PEARL_DRAG_MULTIPLIER, PEARL_GRAVITY_ACCELERATION, PEARL_HEIGHT, PEARL_RADIUS,
};
use crate::physics::entities::entities::{EntityData, EntityTrait};
use crate::physics::world::space::Space3D;

#[derive(Debug, Clone, PartialEq)]
pub struct PearlEntity {
    pub data: EntityData,
}

impl PearlEntity {
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

        Self { data }
    }
}

impl EntityTrait for PearlEntity {
    fn tick(&mut self) {
        if self.data.is_gravity {
            self.data.motion.y -= PEARL_GRAVITY_ACCELERATION;
        }

        self.data.motion *= PEARL_DRAG_MULTIPLIER;
    }
}
