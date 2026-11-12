use pearl_calculator_core::calculation::simulation::{calculate_tnt_motion, fly};
use pearl_calculator_core::physics::entities::movement::PearlVersion;
use pearl_calculator_core::physics::world::space::Space3D;

fn fly_to(position: Space3D, motion: Space3D, ticks: u32) -> (Space3D, Space3D) {
    let mut last = (position, motion);
    fly(position, motion, ticks, PearlVersion::Post1212, |p, m| {
        last = (p, m)
    });
    last
}

// Expected values are the pearl's Pos and Motion read with /data in a 1.21.2+ world.
#[test]
fn upward_blast_matches_game_bit_for_bit() {
    let (position, mut motion) = fly_to(
        Space3D::new(0.0, 155.33472917630513, 0.0),
        Space3D::new(0.0, 1.0, 0.0),
        16,
    );
    assert_eq!(position.y, 166.19628236009788);

    let x = 24.0 / 16.0 - 0.49f32 as f64;
    let z = 41.0 / 16.0 - 0.49f32 as f64;
    for sign in [1.0, 1.0, 1.0, 1.0, -1.0, -1.0, -1.0, -1.0] {
        motion += calculate_tnt_motion(
            position,
            Space3D::new(sign * x, 158.0 + 60.0 / 16.0, sign * z),
        );
    }
    assert_eq!(motion.y, 3.132956471284519);

    let (position, motion) = fly_to(position, motion, 50);
    assert_eq!(position.y, 256.3487521088233);
    assert_eq!(motion.y, 0.7223263409392097);
}
