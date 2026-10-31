use pearl_calculator_core::calculation::calculation::calculate_raw_trace;
use pearl_calculator_core::calculation::simulation::fly;
use pearl_calculator_core::physics::entities::movement::PearlVersion;
use pearl_calculator_core::physics::world::space::Space3D;

const VERSIONS: [PearlVersion; 3] = [
    PearlVersion::Legacy,
    PearlVersion::Post1205,
    PearlVersion::Post1212,
];

#[test]
fn fly_matches_raw_trace_bit_for_bit() {
    let position = Space3D::new(12.3456789, 256.56834822789864, -98.7654321);
    let motion = Space3D::new(-3.217, 1.3125, 7.0625);
    let ticks = 300;

    for version in VERSIONS {
        let trace = calculate_raw_trace(position, motion, vec![], ticks, &[], version).unwrap();
        let mut visited = Vec::new();
        fly(position, motion, ticks, version, |p, m| {
            visited.push((p, m))
        });

        assert_eq!(visited.len(), trace.pearl_trace.len());
        for (tick, (p, m)) in visited.iter().enumerate() {
            assert_eq!(
                p.x.to_bits(),
                trace.pearl_trace[tick].x.to_bits(),
                "{version:?} x@{tick}"
            );
            assert_eq!(
                p.y.to_bits(),
                trace.pearl_trace[tick].y.to_bits(),
                "{version:?} y@{tick}"
            );
            assert_eq!(
                p.z.to_bits(),
                trace.pearl_trace[tick].z.to_bits(),
                "{version:?} z@{tick}"
            );
            assert_eq!(
                m.y.to_bits(),
                trace.pearl_motion_trace[tick].y.to_bits(),
                "{version:?} vy@{tick}"
            );
        }
    }
}
