use crate::calculation::inputs::Cannon;
use crate::calculation::simulation;
use crate::physics::world::direction::Direction;
use crate::physics::world::layout_direction::LayoutDirection;
use crate::physics::world::space::Space3D;

pub fn resolve_vectors_for_direction(
    cannon: &Cannon,
    direction: Direction,
) -> (Space3D, Space3D, Space3D) {
    let mut pearl_calc_pos = cannon.pearl.offset;
    pearl_calc_pos.y = cannon.pearl.position.y;

    let blue_duper = cannon
        .default_blue_duper
        .unwrap_or(LayoutDirection::NorthEast);
    let red_duper = cannon
        .default_red_duper
        .unwrap_or(LayoutDirection::NorthWest);

    let red_tnt_loc;
    let blue_tnt_loc;

    let blue_duper_bits = layout_direction_to_cardinal_bits(blue_duper);

    if (direction as u8 & blue_duper_bits) == 0 {
        blue_tnt_loc = tnt_loc_from_layout(cannon, blue_duper);

        let inverted_dir = direction.invert() as u8;
        let other_bits = (!((direction as u8) | blue_duper_bits)) & 0b1111;
        let final_bits = other_bits | inverted_dir;
        red_tnt_loc = tnt_loc_from_layout(cannon, cardinal_bits_to_layout_direction(final_bits));
    } else {
        red_tnt_loc = tnt_loc_from_layout(cannon, red_duper);

        let red_duper_bits = layout_direction_to_cardinal_bits(red_duper);
        let inverted_dir = direction.invert() as u8;
        let other_bits = (!((direction as u8) | red_duper_bits)) & 0b1111;
        let final_bits = other_bits | inverted_dir;
        blue_tnt_loc = tnt_loc_from_layout(cannon, cardinal_bits_to_layout_direction(final_bits));
    }

    let red_vec = simulation::calculate_tnt_motion(pearl_calc_pos, red_tnt_loc);
    let blue_vec = simulation::calculate_tnt_motion(pearl_calc_pos, blue_tnt_loc);

    let vert_vec = if let Some(v_pos) = cannon.vertical_tnt {
        simulation::calculate_tnt_motion(pearl_calc_pos, v_pos)
    } else {
        Space3D::default()
    };

    (red_vec, blue_vec, vert_vec)
}

fn tnt_loc_from_layout(cannon: &Cannon, dir: LayoutDirection) -> Space3D {
    match dir {
        LayoutDirection::NorthWest => cannon.north_west_tnt,
        LayoutDirection::NorthEast => cannon.north_east_tnt,
        LayoutDirection::SouthWest => cannon.south_west_tnt,
        LayoutDirection::SouthEast => cannon.south_east_tnt,
        _ => Space3D::default(),
    }
}

fn layout_direction_to_cardinal_bits(dir: LayoutDirection) -> u8 {
    match dir {
        LayoutDirection::NorthWest => (Direction::North as u8) | (Direction::West as u8),
        LayoutDirection::NorthEast => (Direction::North as u8) | (Direction::East as u8),
        LayoutDirection::SouthWest => (Direction::South as u8) | (Direction::West as u8),
        LayoutDirection::SouthEast => (Direction::South as u8) | (Direction::East as u8),
        _ => 0,
    }
}

fn cardinal_bits_to_layout_direction(bits: u8) -> LayoutDirection {
    let n = Direction::North as u8;
    let s = Direction::South as u8;
    let w = Direction::West as u8;
    let e = Direction::East as u8;

    if (bits & (n | w)) == (n | w) {
        LayoutDirection::NorthWest
    } else if (bits & (n | e)) == (n | e) {
        LayoutDirection::NorthEast
    } else if (bits & (s | w)) == (s | w) {
        LayoutDirection::SouthWest
    } else {
        LayoutDirection::SouthEast
    }
}
