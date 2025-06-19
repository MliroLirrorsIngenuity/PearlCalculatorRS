use crate::physics::aabb::aabb_box::AABBBox;
use crate::physics::constants::constants::{TNT_HEIGHT, TNT_RADIUS};
use crate::physics::entities::entities::{EntityData, EntityTrait};
use crate::physics::world::space::Space3D;

#[derive(Debug, Clone, PartialEq)]
pub struct TNTEntity {
    pub data: EntityData,
    pub fuse: u32,
}

impl TNTEntity {
    pub fn new(position: Space3D, fuse: u32) -> Self {
        let bounding_box = AABBBox::new(
            position.x - TNT_RADIUS,
            position.y,
            position.z - TNT_RADIUS,
            position.x + TNT_RADIUS,
            position.y + TNT_HEIGHT,
            position.z + TNT_RADIUS,
        );
        let data = EntityData::new(position, Space3D::default(), bounding_box);

        Self { data, fuse }
    }
}

impl EntityTrait for TNTEntity {
    fn tick(&mut self) {
        if self.fuse > 0 {
            self.fuse -= 1;
        }
    }
}
