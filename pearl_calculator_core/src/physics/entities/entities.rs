use crate::physics::aabb::aabb_box::AABBBox;
use crate::physics::world::space::Space3D;

pub trait EntityTrait {
    fn tick(&mut self);
}

#[derive(Debug, Clone, PartialEq)]
pub struct EntityData {
    pub position: Space3D,
    pub motion: Space3D,
    pub bounding_box: AABBBox,
    pub on_ground: bool,
    pub is_collided_horizontally: bool,
    pub is_collided_vertically: bool,
    pub is_gravity: bool,
}

impl EntityData {
    pub fn new(position: Space3D, motion: Space3D, bounding_box: AABBBox) -> Self {
        Self {
            position,
            motion,
            bounding_box,
            on_ground: false,
            is_collided_horizontally: false,
            is_collided_vertically: false,
            is_gravity: false,
        }
    }

    pub fn move_entity(
        &mut self,
        mut xa: f64,
        mut ya: f64,
        mut za: f64,
        world_collisions: &[AABBBox],
    ) {
        let original_xa = xa;
        let original_ya = ya;
        let original_za = za;

        let mut bb = self.bounding_box;
        for aabb in world_collisions {
            ya = aabb.y_offset(&bb, ya);
        }
        bb = bb.offset(0.0, ya, 0.0);

        for aabb in world_collisions {
            xa = aabb.x_offset(&bb, xa);
        }
        bb = bb.offset(xa, 0.0, 0.0);

        for aabb in world_collisions {
            za = aabb.z_offset(&bb, za);
        }

        self.bounding_box = bb.offset(0.0, 0.0, za);

        self.position.x = (self.bounding_box.min_x + self.bounding_box.max_x) / 2.0;
        self.position.y = self.bounding_box.min_y;
        self.position.z = (self.bounding_box.min_z + self.bounding_box.max_z) / 2.0;

        self.is_collided_horizontally = original_xa != xa || original_za != za;
        self.is_collided_vertically = original_ya != ya;
        self.on_ground = original_ya != ya && original_ya < 0.0;

        if original_xa != xa {
            self.motion.x = 0.0;
        }
        if original_ya != ya {
            self.motion.y = 0.0;
        }
        if original_za != za {
            self.motion.z = 0.0;
        }
    }
}
