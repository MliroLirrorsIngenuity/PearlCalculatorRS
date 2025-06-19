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
        if (-135.0..=-45.0).contains(&angle) {
            Direction::East
        } else if (-45.0..=45.0).contains(&angle) {
            Direction::South
        } else if (45.0..=135.0).contains(&angle) {
            Direction::West
        } else {
            Direction::North
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
