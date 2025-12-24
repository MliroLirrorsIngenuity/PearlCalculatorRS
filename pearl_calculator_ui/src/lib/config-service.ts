import { open, save } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { z } from "zod";
import {
	BitDirectionSchema,
	BitTemplateConfigSchema,
	GeneralConfigSchema,
	TNTDirectionSchema,
} from "@/lib/schemas";
import type {
	BitTemplateConfig,
	GeneralConfig,
} from "@/types/domain";
import { isTauri } from "@/services";



const LooseConfigSchema = z.object({
	Version: z.string().optional(),
	CannonSettings: z.array(z.any()).optional(),
	MaxTNT: z.any().optional(),
	NorthWestTNT: z.any().optional(),
	NorthEastTNT: z.any().optional(),
	SouthWestTNT: z.any().optional(),
	SouthEastTNT: z.any().optional(),
	DefaultRedDirection: z.string().optional(),
	DefaultRedTNTDirection: z.string().optional(),
	DefaultBlueDirection: z.string().optional(),
	DefaultBlueTNTDirection: z.string().optional(),
	Pearl: z.object({
		Position: z.object({ X: z.any().optional(), Y: z.any().optional(), Z: z.any().optional() }).optional(),
		Motion: z.object({ X: z.any().optional(), Y: z.any().optional(), Z: z.any().optional() }).optional(),
	}).optional(),
	Offset: z.object({ X: z.any().optional(), Z: z.any().optional() }).optional(),
	SideMode: z.number().optional(),
	DirectionMasks: z.record(z.string(), z.any()).optional(),
	RedValues: z.array(z.any()).optional(),
	IsRedArrowCenter: z.boolean().optional(),
}).passthrough();

type DirtyConfig = z.infer<typeof LooseConfigSchema>;

function normalizeConfig(dirty: DirtyConfig): GeneralConfig {
	let root = dirty;
	if (
		dirty.CannonSettings &&
		Array.isArray(dirty.CannonSettings) &&
		dirty.CannonSettings.length > 0
	) {
		root = dirty.CannonSettings[0];
	}

	const readPos = (obj: any) => ({
		x: Number(obj?.X ?? 0),
		y: Number(obj?.Y ?? 0),
		z: Number(obj?.Z ?? 0),
	});

	const redDirRaw =
		root.DefaultRedDirection ?? root.DefaultRedTNTDirection ?? "SouthEast";
	const blueDirRaw =
		root.DefaultBlueDirection ?? root.DefaultBlueTNTDirection ?? "SouthEast";

	const redDir = TNTDirectionSchema.safeParse(redDirRaw).data ?? "SouthEast";
	const blueDir = TNTDirectionSchema.safeParse(blueDirRaw).data ?? "SouthEast";

	const config = {
		max_tnt: Number(root.MaxTNT ?? 0),
		north_west_tnt: readPos(root.NorthWestTNT),
		north_east_tnt: readPos(root.NorthEastTNT),
		south_west_tnt: readPos(root.SouthWestTNT),
		south_east_tnt: readPos(root.SouthEastTNT),
		pearl_x_position: Number(root.Pearl?.Position?.X ?? 0),
		pearl_y_motion: Number(root.Pearl?.Motion?.Y ?? 0),
		pearl_y_position: Number(root.Pearl?.Position?.Y ?? 0),
		pearl_z_position: Number(root.Pearl?.Position?.Z ?? 0),
		default_red_tnt_position: redDir,
		default_blue_tnt_position: blueDir,
		offset_x: Number(root.Offset?.X ?? 0),
		offset_z: Number(root.Offset?.Z ?? 0),
	};


	return GeneralConfigSchema.parse(config);
}

function extractBitTemplateConfig(
	dirty: DirtyConfig,
): BitTemplateConfig | null {
	let root = dirty;
	if (
		dirty.CannonSettings &&
		Array.isArray(dirty.CannonSettings) &&
		dirty.CannonSettings.length > 0
	) {
		root = dirty.CannonSettings[0];
	}

	if (!root.SideMode || !root.RedValues || !Array.isArray(root.RedValues)) {
		return null;
	}

	const directionMasks: BitTemplateConfig["DirectionMasks"] = {};
	if (root.DirectionMasks) {
		const masks = ["00", "01", "10", "11"] as const;
		masks.forEach(key => {
			const raw = root.DirectionMasks?.[key];
			const parsed = BitDirectionSchema.safeParse(raw);
			if (parsed.success) {
				directionMasks[key] = parsed.data;
			}
		});
	}

	const template = {
		SideMode: root.SideMode,
		DirectionMasks: directionMasks,
		RedValues: root.RedValues.map((v) => Number(v) || 0),
		IsRedArrowCenter: root.IsRedArrowCenter ?? false,
	};

	return BitTemplateConfigSchema.parse(template);
}

export async function loadConfiguration(): Promise<{
	config: GeneralConfig;
	bitTemplate: BitTemplateConfig | null;
	path: string;
} | null> {

	try {
		if (isTauri) {
			const selected = await open({
				multiple: false,
				filters: [{ name: "Configuration", extensions: ["json"] }],
			});

			if (selected && typeof selected === "string") {
				const content = await readTextFile(selected);
				const json = JSON.parse(content);
				const dirty = LooseConfigSchema.parse(json);

				const cleanConfig = normalizeConfig(dirty);
				const bitTemplate = extractBitTemplateConfig(dirty);

				return { config: cleanConfig, bitTemplate, path: selected };
			}
		} else {
			return new Promise((resolve, reject) => {
				const input = document.createElement("input");
				input.type = "file";
				input.accept = ".json";
				input.onchange = async (e) => {
					try {
						const file = (e.target as HTMLInputElement).files?.[0];
						if (file) {
							const content = await file.text();
							const json = JSON.parse(content);
							const dirty = LooseConfigSchema.parse(json);

							const cleanConfig = normalizeConfig(dirty);
							const bitTemplate = extractBitTemplateConfig(dirty);
							resolve({ config: cleanConfig, bitTemplate, path: file.name });
						} else {
							resolve(null);
						}
					} catch (err) {
						reject(err);
					}
				};
				input.click();
			});
		}
	} catch (error) {
		console.error("Config load failed", error);
		throw error;
	}
	return null;
}

export async function exportConfiguration(config: any): Promise<string | null> {
	try {
		if (isTauri) {
			const path = await save({
				filters: [{ name: "JSON", extensions: ["json"] }],
			});

			if (path) {
				await writeTextFile(path, JSON.stringify(config, null, 2));
				return path;
			}
		} else {
			const content = JSON.stringify(config, null, 2);
			const blob = new Blob([content], { type: "application/json" });
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = "config.json";
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
			return "config.json";
		}
	} catch (error) {
		console.error("Config export failed", error);
		throw error;
	}
	return null;
}
