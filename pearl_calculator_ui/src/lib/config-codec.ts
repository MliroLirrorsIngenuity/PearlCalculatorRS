import type {
	BitDirection,
	BitTemplateConfig,
	GeneralConfig,
} from "@/types/domain";
import { GeneralConfigSchema, BitTemplateConfigSchema } from "@/lib/schemas";

const DIR_MAP: Record<string, number> = {
	South: 0,
	West: 1,
	North: 2,
	East: 3,
	NorthWest: 4,
	NorthEast: 5,
	SouthWest: 6,
	SouthEast: 7,
};

const DIR_MAP_REV: Record<number, string> = Object.fromEntries(
	Object.entries(DIR_MAP).map(([k, v]) => [v, k]),
);

const BIT_DIR_MAP: Record<string, number> = {
	South: 0,
	West: 1,
	North: 2,
	East: 3,
};

const BIT_DIR_MAP_REV: Record<number, BitDirection> = {
	0: "South",
	1: "West",
	2: "North",
	3: "East",
};

type FloatPath = readonly string[];
const FLOAT_KEYS_ORDER: FloatPath[] = [
	["NorthEastTNT", "X"],
	["NorthEastTNT", "Y"],
	["NorthEastTNT", "Z"],
	["NorthWestTNT", "X"],
	["NorthWestTNT", "Y"],
	["NorthWestTNT", "Z"],
	["SouthEastTNT", "X"],
	["SouthEastTNT", "Y"],
	["SouthEastTNT", "Z"],
	["SouthWestTNT", "X"],
	["SouthWestTNT", "Y"],
	["SouthWestTNT", "Z"],
	["Offset", "X"],
	["Offset", "Z"],
	["Pearl", "Position", "X"],
	["Pearl", "Position", "Y"],
	["Pearl", "Position", "Z"],
	["Pearl", "Motion", "X"],
	["Pearl", "Motion", "Y"],
	["Pearl", "Motion", "Z"],
];

export interface EncodableConfig {
	NorthEastTNT: { X: number; Y: number; Z: number };
	NorthWestTNT: { X: number; Y: number; Z: number };
	SouthEastTNT: { X: number; Y: number; Z: number };
	SouthWestTNT: { X: number; Y: number; Z: number };
	Offset: { X: number; Z: number };
	Pearl: {
		Position: { X: number; Y: number; Z: number };
		Motion: { X: number; Y: number; Z: number };
	};
	MaxTNT: number;
	DefaultRedTNTDirection: string;
	DefaultBlueTNTDirection: string;
	SideMode: number;
	DirectionMasks: Record<string, string>;
	RedValues: number[];
	IsRedArrowCenter: boolean;
}

export interface DecodedConfig {
	generalConfig: GeneralConfig;
	bitTemplate: BitTemplateConfig | null;
}

function writeVarInt(buffer: number[], value: number): void {
	let v = value >>> 0;
	while (v >= 128) {
		buffer.push((v & 0x7f) | 0x80);
		v >>>= 7;
	}
	buffer.push(v);
}

function readVarInt(iter: Iterator<number>): number {
	let value = 0;
	let shift = 0;
	while (true) {
		const result = iter.next();
		if (result.done) throw new Error("error.config.unexpected_end");
		const byte = result.value;
		value |= (byte & 0x7f) << shift;
		if (!(byte & 0x80)) break;
		shift += 7;
	}
	return value;
}

function floatToBytes(value: number): number[] {
	const buffer = new ArrayBuffer(4);
	new DataView(buffer).setFloat32(0, value, true);
	return Array.from(new Uint8Array(buffer));
}

function bytesToFloat(bytes: number[]): number {
	const buffer = new ArrayBuffer(4);
	const arr = new Uint8Array(buffer);
	for (let i = 0; i < 4; i++) arr[i] = bytes[i];
	return new DataView(buffer).getFloat32(0, true);
}

function getNestedValue(obj: any, path: readonly string[]): number {
	let val = obj;
	for (const key of path) {
		val = val?.[key];
	}
	return typeof val === "number" ? val : 0;
}

function crc8(data: number[]): number {
	let crc = 0;
	for (const byte of data) {
		crc ^= byte;
		for (let i = 0; i < 8; i++) {
			if (crc & 0x80) {
				crc = ((crc << 1) ^ 0x07) & 0xff;
			} else {
				crc = (crc << 1) & 0xff;
			}
		}
	}
	return crc;
}

const PREFIX = "#";
const CODE_PATTERN = /#([A-Za-z0-9+/]+=*)/;

export function encodeConfig(data: EncodableConfig): string {
	const stream: number[] = [];

	const sideMode = data.SideMode || 0;
	const isCenter = data.IsRedArrowCenter ? 1 : 0;
	stream.push((sideMode & 0x1f) | (isCenter << 5));

	const maxTNT = data.MaxTNT || 0;
	stream.push(maxTNT & 0xff);
	stream.push((maxTNT >> 8) & 0xff);

	const floatValues = FLOAT_KEYS_ORDER.map((path) =>
		getNestedValue(data, path),
	);
	let mask = 0;
	const floatBytes: number[] = [];

	for (let i = 0; i < floatValues.length; i++) {
		if (Math.abs(floatValues[i]) > 1e-9) {
			mask |= 1 << i;
			floatBytes.push(...floatToBytes(floatValues[i]));
		}
	}

	stream.push(mask & 0xff);
	stream.push((mask >> 8) & 0xff);
	stream.push((mask >> 16) & 0xff);
	stream.push(...floatBytes);

	const defRed = DIR_MAP[data.DefaultRedTNTDirection] ?? 7;
	const defBlue = DIR_MAP[data.DefaultBlueTNTDirection] ?? 7;
	stream.push((defRed << 4) | (defBlue & 0x0f));

	const dm = data.DirectionMasks || {};
	const d00 = BIT_DIR_MAP[dm["00"]] ?? 0;
	const d01 = BIT_DIR_MAP[dm["01"]] ?? 0;
	const d10 = BIT_DIR_MAP[dm["10"]] ?? 0;
	const d11 = BIT_DIR_MAP[dm["11"]] ?? 0;
	stream.push((d11 << 6) | (d10 << 4) | (d01 << 2) | d00);

	const redValues = data.RedValues || [];
	for (let i = 0; i < sideMode; i++) {
		writeVarInt(stream, redValues[i] ?? 0);
	}

	stream.push(crc8(stream));

	const bytes = new Uint8Array(stream);
	let binary = "";
	for (const byte of bytes) {
		binary += String.fromCharCode(byte);
	}
	return PREFIX + btoa(binary);
}

export function decodeConfig(input: string): DecodedConfig {
	const match = input.match(CODE_PATTERN);
	if (!match) {
		throw new Error("error.config.no_valid_code");
	}
	const base64Str = match[1];
	const binary = atob(base64Str);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}

	const dataBytes = Array.from(bytes.slice(0, -1));
	const expectedCrc = bytes[bytes.length - 1];
	const actualCrc = crc8(dataBytes);
	if (expectedCrc !== actualCrc) {
		throw new Error("error.config.checksum_mismatch");
	}

	const iter = dataBytes[Symbol.iterator]();

	const header = iter.next().value!;
	const sideMode = header & 0x1f;
	const isRedArrowCenter = Boolean((header >> 5) & 0x01);

	const low = iter.next().value!;
	const high = iter.next().value!;
	const maxTNT = (high << 8) | low;

	const m0 = iter.next().value!;
	const m1 = iter.next().value!;
	const m2 = iter.next().value!;
	const mask = m0 | (m1 << 8) | (m2 << 16);

	const floatValues: number[] = [];
	for (let i = 0; i < 20; i++) {
		if ((mask >> i) & 1) {
			const b = [
				iter.next().value!,
				iter.next().value!,
				iter.next().value!,
				iter.next().value!,
			];
			floatValues.push(bytesToFloat(b));
		} else {
			floatValues.push(0);
		}
	}

	const NorthEastTNT = {
		X: floatValues[0],
		Y: floatValues[1],
		Z: floatValues[2],
	};
	const NorthWestTNT = {
		X: floatValues[3],
		Y: floatValues[4],
		Z: floatValues[5],
	};
	const SouthEastTNT = {
		X: floatValues[6],
		Y: floatValues[7],
		Z: floatValues[8],
	};
	const SouthWestTNT = {
		X: floatValues[9],
		Y: floatValues[10],
		Z: floatValues[11],
	};
	const offsetX = floatValues[12];
	const offsetZ = floatValues[13];
	const pearlPosX = floatValues[14];
	const pearlPosY = floatValues[15];
	const pearlPosZ = floatValues[16];
	const pearlMotX = floatValues[17];
	const pearlMotY = floatValues[18];
	const pearlMotZ = floatValues[19];

	const dirs = iter.next().value!;
	const defaultRedDir = DIR_MAP_REV[(dirs >> 4) & 0x0f] || "SouthEast";
	const defaultBlueDir = DIR_MAP_REV[dirs & 0x0f] || "SouthEast";

	const dMap = iter.next().value!;
	const directionMasks: BitTemplateConfig["DirectionMasks"] = {
		"00": BIT_DIR_MAP_REV[dMap & 0x03],
		"01": BIT_DIR_MAP_REV[(dMap >> 2) & 0x03],
		"10": BIT_DIR_MAP_REV[(dMap >> 4) & 0x03],
		"11": BIT_DIR_MAP_REV[(dMap >> 6) & 0x03],
	};

	const redValues: number[] = [];
	for (let i = 0; i < sideMode; i++) {
		redValues.push(readVarInt(iter));
	}

	const validateDir = (
		d: string,
	): "SouthEast" | "NorthWest" | "SouthWest" | "NorthEast" => {
		if (
			d === "NorthWest" ||
			d === "SouthEast" ||
			d === "NorthEast" ||
			d === "SouthWest"
		) {
			return d;
		}
		return "SouthEast";
	};

	const generalConfig: GeneralConfig = GeneralConfigSchema.parse({
		max_tnt: maxTNT,
		north_east_tnt: { x: NorthEastTNT.X, y: NorthEastTNT.Y, z: NorthEastTNT.Z },
		north_west_tnt: { x: NorthWestTNT.X, y: NorthWestTNT.Y, z: NorthWestTNT.Z },
		south_east_tnt: { x: SouthEastTNT.X, y: SouthEastTNT.Y, z: SouthEastTNT.Z },
		south_west_tnt: { x: SouthWestTNT.X, y: SouthWestTNT.Y, z: SouthWestTNT.Z },
		pearl_x_position: pearlPosX,
		pearl_y_position: pearlPosY,
		pearl_z_position: pearlPosZ,
		pearl_x_motion: pearlMotX,
		pearl_y_motion: pearlMotY,
		pearl_z_motion: pearlMotZ,
		default_red_tnt_position: validateDir(defaultRedDir),
		default_blue_tnt_position: validateDir(defaultBlueDir),
		offset_x: offsetX,
		offset_z: offsetZ,
	});

	let bitTemplate: BitTemplateConfig | null = null;
	if (sideMode > 0) {
		bitTemplate = BitTemplateConfigSchema.parse({
			SideMode: sideMode,
			DirectionMasks: directionMasks,
			RedValues: redValues,
			IsRedArrowCenter: isRedArrowCenter,
		});
	}

	return { generalConfig, bitTemplate };
}

export function buildEncodableConfig(
	config: GeneralConfig,
	bitTemplate: BitTemplateConfig | null,
): EncodableConfig {
	return {
		NorthEastTNT: {
			X: config.north_east_tnt.x,
			Y: config.north_east_tnt.y,
			Z: config.north_east_tnt.z,
		},
		NorthWestTNT: {
			X: config.north_west_tnt.x,
			Y: config.north_west_tnt.y,
			Z: config.north_west_tnt.z,
		},
		SouthEastTNT: {
			X: config.south_east_tnt.x,
			Y: config.south_east_tnt.y,
			Z: config.south_east_tnt.z,
		},
		SouthWestTNT: {
			X: config.south_west_tnt.x,
			Y: config.south_west_tnt.y,
			Z: config.south_west_tnt.z,
		},
		Offset: { X: config.offset_x ?? 0, Z: config.offset_z ?? 0 },
		Pearl: {
			Position: {
				X: config.pearl_x_position,
				Y: config.pearl_y_position,
				Z: config.pearl_z_position,
			},
			Motion: {
				X: config.pearl_x_motion ?? 0,
				Y: config.pearl_y_motion,
				Z: config.pearl_z_motion ?? 0,
			},
		},
		MaxTNT: config.max_tnt,
		DefaultRedTNTDirection: config.default_red_tnt_position,
		DefaultBlueTNTDirection: config.default_blue_tnt_position,
		SideMode: bitTemplate?.SideMode ?? 0,
		DirectionMasks: bitTemplate?.DirectionMasks
			? Object.fromEntries(
				Object.entries(bitTemplate.DirectionMasks).map(([k, v]) => [
					k,
					v ?? "",
				]),
			)
			: {},
		RedValues: bitTemplate?.RedValues ?? [],
		IsRedArrowCenter: bitTemplate?.IsRedArrowCenter ?? false,
	};
}
