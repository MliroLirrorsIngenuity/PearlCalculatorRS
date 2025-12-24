import { z } from "zod";

export const PearlVersionSchema = z.enum(["Legacy", "Post1205", "Post1212"]);

export const TNTDirectionSchema = z.enum([
	"SouthEast",
	"NorthWest",
	"SouthWest",
	"NorthEast",
]);

export const BitDirectionSchema = z.enum(["North", "East", "West", "South"]);

export const CoercedNumberSchema = z.union([
	z.number(),
	z.string().transform((val) => {
		const parsed = parseFloat(val);
		return isNaN(parsed) ? 0 : parsed;
	}),
]);

export const Vector3Schema = z.object({
	x: z.number(),
	y: z.number(),
	z: z.number(),
});

export const CoercedVector3Schema = z.object({
	x: CoercedNumberSchema,
	y: CoercedNumberSchema,
	z: CoercedNumberSchema,
});

export const TNTResultSchema = z.object({
	distance: z.number(),
	tick: z.number(),
	blue: z.number(),
	red: z.number(),
	total: z.number(),
	pearl_end_pos: z.object({ X: z.number(), Y: z.number(), Z: z.number() }),
	pearl_end_motion: z.object({ X: z.number(), Y: z.number(), Z: z.number() }),
	direction: z.string(),
});

export const PearlTraceResultSchema = z.object({
	landing_position: z.object({ X: z.number(), Y: z.number(), Z: z.number() }),
	pearl_trace: z.array(
		z.object({ X: z.number(), Y: z.number(), Z: z.number() }),
	),
	pearl_motion_trace: z.array(
		z.object({ X: z.number(), Y: z.number(), Z: z.number() }),
	),
	is_successful: z.boolean(),
	tick: z.number(),
	final_motion: z.object({ X: z.number(), Y: z.number(), Z: z.number() }),
	distance: z.number(),
	closest_approach: z
		.object({
			tick: z.number(),
			point: z.object({ X: z.number(), Y: z.number(), Z: z.number() }),
			distance: z.number(),
		})
		.optional(),
});

export const TraceTNTSchema = z.object({
	blue: z.number(),
	red: z.number(),
	total: z.number(),
});

export const GeneralConfigSchema = z.object({
	max_tnt: z.number(),
	north_west_tnt: Vector3Schema,
	north_east_tnt: Vector3Schema,
	south_west_tnt: Vector3Schema,
	south_east_tnt: Vector3Schema,
	pearl_x_position: z.number(),
	pearl_y_motion: z.number(),
	pearl_y_position: z.number(),
	pearl_z_position: z.number(),
	default_red_tnt_position: TNTDirectionSchema,
	default_blue_tnt_position: TNTDirectionSchema,
	offset_x: z.number().optional(),
	offset_z: z.number().optional(),
});

export const SimulatorConfigSchema = z.object({
	pearl: z.object({
		pos: Vector3Schema,
		momentum: Vector3Schema,
	}),
	tntA: z.object({
		pos: Vector3Schema,
		amount: z.number(),
	}),
	tntB: z.object({
		pos: Vector3Schema,
		amount: z.number(),
	}),
});

export const CalculatorInputsSchema = z.object({
	pearlX: z.string(),
	pearlZ: z.string(),
	destX: z.string(),
	destZ: z.string(),
	cannonY: z.string(),
	offsetX: z.string(),
	offsetZ: z.string(),
	tickRange: z.array(z.number()),
	distanceRange: z.array(z.number()),
});

export const MaskGroupSchema = z.object({
	bits: z.tuple([z.string(), z.string()]),
	direction: z.string(),
});

export const BitCalculationResultSchema = z.object({
	blue: z.array(z.number()),
	red: z.array(z.number()),
	direction: z.tuple([z.boolean(), z.boolean()]),
});

export const BitTemplateConfigSchema = z.object({
	SideMode: z.number(),
	DirectionMasks: z.object({
		"00": BitDirectionSchema.optional(),
		"01": BitDirectionSchema.optional(),
		"10": BitDirectionSchema.optional(),
		"11": BitDirectionSchema.optional(),
	}),
	RedValues: z.array(z.number()),
	IsRedArrowCenter: z.boolean(),
});

export const BitInputStateSchema = z.object({
	sideCount: z.number(),
	masks: z.array(MaskGroupSchema),
	sideValues: z.array(z.string()),
	isSwapped: z.boolean(),
});

export const WizardBasicInfoSchema = z.object({
	cannonCenter: z.object({
		x: z.string().min(1),
		z: z.string().min(1),
	}),
	pearlPosition: z.object({
		x: z.string().min(1),
		y: z.string().min(1),
		z: z.string().min(1),
	}),
	pearlMomentum: z.object({
		x: z.string().min(1),
		y: z.string().min(1),
		z: z.string().min(1),
	}),
	maxTNT: z.string().refine((val) => {
		const num = parseFloat(val);
		return !isNaN(num) && num > 0;
	}),
});

export const WizardTNTConfigSchema = z.object({
	northWest: z.object({
		x: z.string().min(1),
		y: z.string().min(1),
		z: z.string().min(1),
	}),
	northEast: z.object({
		x: z.string().min(1),
		y: z.string().min(1),
		z: z.string().min(1),
	}),
	southWest: z.object({
		x: z.string().min(1),
		y: z.string().min(1),
		z: z.string().min(1),
	}),
	southEast: z.object({
		x: z.string().min(1),
		y: z.string().min(1),
		z: z.string().min(1),
	}),
	redTNTLocation: z.string().min(1),
});

export const WizardBitConfigSchema = z
	.object({
		state: BitInputStateSchema.nullable().optional(),
		skipped: z.boolean(),
	})
	.refine(
		(data) => {
			if (data.skipped) return true;
			if (!data.state) return false;
			const hasEmptyValue = data.state.sideValues.some(
				(v) => !v || v.trim() === "",
			);
			if (hasEmptyValue) return false;
			const hasEmptyMask = data.state.masks.some((m) => !m.direction);
			if (hasEmptyMask) return false;
			return true;
		},
		{
			message: "incomplete",
		},
	);
