export type PearlVersion = "Legacy" | "Post1205" | "Post1212";

export interface TNTResult {
	distance: number;
	tick: number;
	blue: number;
	red: number;
	total: number;
	pearl_end_pos: { X: number; Y: number; Z: number };
	pearl_end_motion: { X: number; Y: number; Z: number };
	direction: string;
}

export interface PearlTraceResult {
	landing_position: { X: number; Y: number; Z: number };
	pearl_trace: Array<{ X: number; Y: number; Z: number }>;
	pearl_motion_trace: Array<{ X: number; Y: number; Z: number }>;
	is_successful: boolean;
	tick: number;
	final_motion: { X: number; Y: number; Z: number };
	distance: number;
	closest_approach?: {
		tick: number;
		point: { X: number; Y: number; Z: number };
		distance: number;
	};
}

export interface TraceTNT {
	blue: number;
	red: number;
	total: number;
}

export interface GeneralConfig {
	max_tnt: number;
	north_west_tnt: { x: number; y: number; z: number };
	north_east_tnt: { x: number; y: number; z: number };
	south_west_tnt: { x: number; y: number; z: number };
	south_east_tnt: { x: number; y: number; z: number };
	pearl_x_position: number;
	pearl_y_motion: number;
	pearl_y_position: number;
	pearl_z_position: number;
	default_red_tnt_position:
	| "SouthEast"
	| "NorthWest"
	| "SouthWest"
	| "NorthEast";
	default_blue_tnt_position:
	| "SouthEast"
	| "NorthWest"
	| "SouthWest"
	| "NorthEast";
	offset_x?: number;
	offset_z?: number;
}

export interface SimulatorConfig {
	pearl: {
		pos: { x: number; y: number; z: number };
		momentum: { x: number; y: number; z: number };
	};
	tntA: {
		pos: { x: number; y: number; z: number };
		amount: number;
	};
	tntB: {
		pos: { x: number; y: number; z: number };
		amount: number;
	};
}

export interface CalculatorInputs {
	pearlX: string;
	pearlZ: string;
	destX: string;
	destZ: string;
	cannonY: string;
	offsetX: string;
	offsetZ: string;
	tickRange: number[];
	distanceRange: number[];
}
