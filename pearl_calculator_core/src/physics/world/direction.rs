use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[repr(u8)]
pub enum Direction {
    North = 1,
    South = 2,
    West = 8,
    East = 4,
}

impl Direction {
    pub fn invert(&self) -> Direction {
        match self {
            Direction::North => Direction::South,
            Direction::South => Direction::North,
            Direction::West => Direction::East,
            Direction::East => Direction::West,
        }
    }

    pub fn from_angle(angle: f64) -> Direction {
        if (-135.0..-45.0).contains(&angle) {
            Direction::East
        } else if (-45.0..45.0).contains(&angle) {
            Direction::South
        } else if (45.0..135.0).contains(&angle) {
            Direction::West
        } else {
            Direction::North
        }
    }

    pub fn from_angle_with_fallbacks(angle: f64) -> Vec<Direction> {
        const BOUNDARY_EPSILON: f64 = 10.0;

        let is_near = |boundary: f64| (angle - boundary).abs() < BOUNDARY_EPSILON;

        if is_near(-45.0) {
            vec![Direction::South, Direction::East]
        } else if is_near(45.0) {
            vec![Direction::West, Direction::South]
        } else if is_near(135.0) {
            vec![Direction::North, Direction::West]
        } else if is_near(-135.0) {
            vec![Direction::East, Direction::North]
        } else {
            vec![Self::from_angle(angle)]
        }
    }
}

impl std::ops::BitOr for Direction {
    type Output = u8;
    fn bitor(self, rhs: Self) -> Self::Output {
        (self as u8) | (rhs as u8)
    }
}

impl std::ops::BitAnd for Direction {
    type Output = u8;
    fn bitand(self, rhs: Self) -> Self::Output {
        (self as u8) & (rhs as u8)
    }
}

impl std::ops::Not for Direction {
    type Output = u8;
    fn not(self) -> Self::Output {
        !(self as u8)
    }
}
