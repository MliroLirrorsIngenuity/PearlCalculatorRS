use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum LayoutDirection {
    NorthWest,
    NorthEast,
    SouthWest,
    SouthEast,
    North,
    South,
    West,
    East,
}
