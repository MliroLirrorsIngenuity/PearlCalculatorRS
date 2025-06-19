use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct AABBBox {
    pub min_x: f64,
    pub min_y: f64,
    pub min_z: f64,
    pub max_x: f64,
    pub max_y: f64,
    pub max_z: f64,
}

impl AABBBox {
    pub fn new(min_x: f64, min_y: f64, min_z: f64, max_x: f64, max_y: f64, max_z: f64) -> Self {
        Self {
            min_x,
            min_y,
            min_z,
            max_x,
            max_y,
            max_z,
        }
    }

    pub fn default() -> Self {
        Self {
            min_x: 0.0,
            min_y: 0.0,
            min_z: 0.0,
            max_x: 0.0,
            max_y: 0.0,
            max_z: 0.0,
        }
    }

    pub fn offset(&self, x: f64, y: f64, z: f64) -> Self {
        Self::new(
            self.min_x + x,
            self.min_y + y,
            self.min_z + z,
            self.max_x + x,
            self.max_y + y,
            self.max_z + z,
        )
    }

    pub fn y_offset(&self, other: &AABBBox, mut offset_y: f64) -> f64 {
        if other.max_x <= self.min_x || other.min_x >= self.max_x {
            return offset_y;
        }
        if other.max_z <= self.min_z || other.min_z >= self.max_z {
            return offset_y;
        }
        if offset_y > 0.0 && other.max_y <= self.min_y {
            let d = self.min_y - other.max_y;
            if d < offset_y {
                offset_y = d;
            }
        }
        if offset_y < 0.0 && other.min_y >= self.max_y {
            let d = self.max_y - other.min_y;
            if d > offset_y {
                offset_y = d;
            }
        }
        offset_y
    }

    pub fn x_offset(&self, other: &AABBBox, mut offset_x: f64) -> f64 {
        if other.max_y <= self.min_y || other.min_y >= self.max_y {
            return offset_x;
        }
        if other.max_z <= self.min_z || other.min_z >= self.max_z {
            return offset_x;
        }
        if offset_x > 0.0 && other.max_x <= self.min_x {
            let d = self.min_x - other.max_x;
            if d < offset_x {
                offset_x = d;
            }
        }
        if offset_x < 0.0 && other.min_x >= self.max_x {
            let d = self.max_x - other.min_x;
            if d > offset_x {
                offset_x = d;
            }
        }
        offset_x
    }

    pub fn z_offset(&self, other: &AABBBox, mut offset_z: f64) -> f64 {
        if other.max_x <= self.min_x || other.min_x >= self.max_x {
            return offset_z;
        }
        if other.max_y <= self.min_y || other.min_y >= self.max_y {
            return offset_z;
        }
        if offset_z > 0.0 && other.max_z <= self.min_z {
            let d = self.min_z - other.max_z;
            if d < offset_z {
                offset_z = d;
            }
        }
        if offset_z < 0.0 && other.min_z >= self.max_z {
            let d = self.max_z - other.min_z;
            if d > offset_z {
                offset_z = d;
            }
        }
        offset_z
    }
}
