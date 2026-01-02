import { z } from "zod";
import { CoercedNumberSchema, TNTDirectionSchema } from "@/lib/schemas";
import type {
	BitDirection,
	BitInputState,
	CannonMode,
	GeneralConfig,
} from "@/types/domain";

export type TNTDirection = z.infer<typeof TNTDirectionSchema>;

export function toBackendMode(mode: CannonMode): "Standard" | "Accumulation" {
	return mode === "Accumulation" ? "Accumulation" : "Standard";
}

export interface DraftConfig {
	pearl_x_position: string;
	pearl_y_position: string;
	pearl_z_position: string;
	pearl_y_motion: string;
	max_tnt: string;
	north_west_tnt: { x: string; y: string; z: string };
	north_east_tnt: { x: string; y: string; z: string };
	south_west_tnt: { x: string; y: string; z: string };
	south_east_tnt: { x: string; y: string; z: string };
	vertical_tnt: { x: string; y: string; z: string };
}

export interface CannonCenter {
	x: string;
	z: string;
}

export interface PearlMomentum {
	x: string;
	y: string;
	z: string;
}

const OPPOSITE_PAIRS: Record<TNTDirection, TNTDirection> = {
	NorthWest: "SouthEast",
	SouthEast: "NorthWest",
	NorthEast: "SouthWest",
	SouthWest: "NorthEast",
};

export function getOppositeDirection(dir: string | undefined): TNTDirection {
	if (dir && dir in OPPOSITE_PAIRS) {
		return OPPOSITE_PAIRS[dir as TNTDirection];
	}
	return "SouthEast";
}

function parseNumber(val: any): number {
	return CoercedNumberSchema.parse(val);
}

export function getRelativeTNT(
	tnt: { x: string; y: string; z: string },
	cx: number,
	cz: number,
) {
	return {
		x: parseNumber(tnt.x) - cx,
		y: parseNumber(tnt.y),
		z: parseNumber(tnt.z) - cz,
	};
}

export function getRelativeTNTUppercase(
	tnt: { x: string; y: string; z: string },
	cx: number,
	cz: number,
) {
	return {
		X: parseNumber(tnt.x) - cx,
		Y: parseNumber(tnt.y),
		Z: parseNumber(tnt.z) - cz,
	};
}

export function convertDraftToConfig(
	draftConfig: DraftConfig,
	cannonCenter: CannonCenter,
	redTNTLocation: string | undefined,
	mode?: CannonMode,
): GeneralConfig {
	const cx = parseNumber(cannonCenter.x);
	const cz = parseNumber(cannonCenter.z);

	const redDir: TNTDirection =
		TNTDirectionSchema.safeParse(redTNTLocation).data ?? "SouthEast";

	const baseConfig: GeneralConfig = {
		north_east_tnt: getRelativeTNT(draftConfig.north_east_tnt, cx, cz),
		north_west_tnt: getRelativeTNT(draftConfig.north_west_tnt, cx, cz),
		south_east_tnt: getRelativeTNT(draftConfig.south_east_tnt, cx, cz),
		south_west_tnt: getRelativeTNT(draftConfig.south_west_tnt, cx, cz),
		pearl_x_position: 0,
		pearl_y_motion: parseNumber(draftConfig.pearl_y_motion),
		pearl_y_position: parseNumber(draftConfig.pearl_y_position),
		pearl_z_position: 0,
		max_tnt: parseNumber(draftConfig.max_tnt),
		default_red_tnt_position: redDir,
		default_blue_tnt_position: getOppositeDirection(redDir),
		offset_x: 0,
		offset_z: 0,
	};

	if (mode === "Vector3D") {
		baseConfig.vertical_tnt = getRelativeTNT(draftConfig.vertical_tnt, cx, cz);
		baseConfig.mode = mode;
	}

	return baseConfig;
}

export function buildExportConfig(
	draftConfig: DraftConfig,
	cannonCenter: CannonCenter,
	pearlMomentum: PearlMomentum,
	redTNTLocation: string | undefined,
	bitTemplateState: BitInputState | undefined,
	mode?: CannonMode,
): Record<string, unknown> {
	const cx = parseNumber(cannonCenter.x);
	const cz = parseNumber(cannonCenter.z);
	const pearlX = parseNumber(draftConfig.pearl_x_position);
	const pearlZ = parseNumber(draftConfig.pearl_z_position);

	const baseConfig: Record<string, unknown> = {
		NorthEastTNT: getRelativeTNTUppercase(draftConfig.north_east_tnt, cx, cz),
		NorthWestTNT: getRelativeTNTUppercase(draftConfig.north_west_tnt, cx, cz),
		SouthEastTNT: getRelativeTNTUppercase(draftConfig.south_east_tnt, cx, cz),
		SouthWestTNT: getRelativeTNTUppercase(draftConfig.south_west_tnt, cx, cz),
		Offset: { X: pearlX - cx, Z: pearlZ - cz },
		Pearl: {
			Position: {
				X: 0,
				Y: parseNumber(draftConfig.pearl_y_position),
				Z: 0,
			},
			Motion: {
				X: parseNumber(pearlMomentum.x),
				Y: parseNumber(draftConfig.pearl_y_motion),
				Z: parseNumber(pearlMomentum.z),
			},
		},
		MaxTNT: parseNumber(draftConfig.max_tnt),
		DefaultRedTNTDirection: redTNTLocation,
		DefaultBlueTNTDirection: getOppositeDirection(redTNTLocation),
	};

	if (mode === "Vector3D") {
		baseConfig.VerticalTNT = getRelativeTNTUppercase(
			draftConfig.vertical_tnt,
			cx,
			cz,
		);
		baseConfig.Mode = mode;
	}

	if (!bitTemplateState) {
		return baseConfig;
	}

	const directionMasks = bitTemplateState.masks.reduce(
		(acc, mask) => {
			if (mask.direction) {
				acc[mask.bits.join("")] = mask.direction as BitDirection;
			}
			return acc;
		},
		{} as Record<string, BitDirection>,
	);

	return {
		...baseConfig,
		SideMode: bitTemplateState.sideCount,
		DirectionMasks: directionMasks,
		RedValues: bitTemplateState.sideValues
			.map((v) => parseInt(v, 10) || 0)
			.reverse(),
		IsRedArrowCenter: bitTemplateState.isSwapped,
	};
}

export function convertConfigToDraft(config: GeneralConfig): {
	draft: DraftConfig;
	center: CannonCenter;
	momentum: PearlMomentum;
	redLocation: string | undefined;
} {
	const center = {
		x: (config.pearl_x_position - (config.offset_x ?? 0)).toString(),
		z: (config.pearl_z_position - (config.offset_z ?? 0)).toString(),
	};

	const momentum = {
		x: "0",
		y: config.pearl_y_motion.toString(),
		z: "0",
	};

	const redLocation = config.default_red_tnt_position;

	const draft: DraftConfig = {
		max_tnt: config.max_tnt.toString(),
		north_west_tnt: {
			x: config.north_west_tnt.x.toString(),
			y: config.north_west_tnt.y.toString(),
			z: config.north_west_tnt.z.toString(),
		},
		north_east_tnt: {
			x: config.north_east_tnt.x.toString(),
			y: config.north_east_tnt.y.toString(),
			z: config.north_east_tnt.z.toString(),
		},
		south_west_tnt: {
			x: config.south_west_tnt.x.toString(),
			y: config.south_west_tnt.y.toString(),
			z: config.south_west_tnt.z.toString(),
		},
		south_east_tnt: {
			x: config.south_east_tnt.x.toString(),
			y: config.south_east_tnt.y.toString(),
			z: config.south_east_tnt.z.toString(),
		},
		vertical_tnt: config.vertical_tnt
			? {
					x: config.vertical_tnt.x.toString(),
					y: config.vertical_tnt.y.toString(),
					z: config.vertical_tnt.z.toString(),
				}
			: { x: "", y: "", z: "" },
		pearl_x_position: config.pearl_x_position.toString(),
		pearl_y_position: config.pearl_y_position.toString(),
		pearl_z_position: config.pearl_z_position.toString(),
		pearl_y_motion: config.pearl_y_motion.toString(),
	};

	return { draft, center, momentum, redLocation };
}
