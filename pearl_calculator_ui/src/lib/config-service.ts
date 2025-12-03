import { open } from "@tauri-apps/plugin-dialog";
import { readTextFile } from "@tauri-apps/plugin-fs";
import type { GeneralConfig } from "@/types/domain";

interface DirtyConfig {
	Version?: string;
	CannonSettings?: any[];

	MaxTNT?: number;
	NorthWestTNT?: any;
	NorthEastTNT?: any;
	SouthWestTNT?: any;
	SouthEastTNT?: any;

	DefaultRedDirection?: string;
	DefaultRedTNTDirection?: string;
	DefaultBlueDirection?: string;
	DefaultBlueTNTDirection?: string;

	Pearl?: {
		Position?: { X: number; Y: number; Z: number };
		Motion?: { X: number; Y: number; Z: number };
	};
}

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

	return {
		max_tnt: Number(root.MaxTNT ?? 0),

		north_west_tnt: readPos(root.NorthWestTNT),
		north_east_tnt: readPos(root.NorthEastTNT),
		south_west_tnt: readPos(root.SouthWestTNT),
		south_east_tnt: readPos(root.SouthEastTNT),

		pearl_x_position: Number(root.Pearl?.Position?.X ?? 0),
		pearl_y_motion: Number(root.Pearl?.Motion?.Y ?? 0),
		pearl_y_position: Number(root.Pearl?.Position?.Y ?? 0),
		pearl_z_position: Number(root.Pearl?.Position?.Z ?? 0),

		default_red_tnt_position: validateDirection(redDirRaw),
		default_blue_tnt_position: validateDirection(blueDirRaw),
	};
}

function validateDirection(
	dir: string,
): "SouthEast" | "NorthWest" | "SouthWest" | "NorthEast" {
	if (dir === "NorthWest") return "NorthWest";
	if (dir === "SouthEast") return "SouthEast";
	if (dir === "NorthEast") return "NorthEast";
	if (dir === "SouthWest") return "SouthWest";
	return "SouthEast";
}

export async function loadConfiguration(): Promise<{
	config: GeneralConfig;
	path: string;
} | null> {
	const isTauri = typeof window !== "undefined" && "__TAURI__" in window;

	try {
		if (isTauri) {
			const selected = await open({
				multiple: false,
				filters: [{ name: "Configuration", extensions: ["json"] }],
			});

			if (selected && typeof selected === "string") {
				const content = await readTextFile(selected);
				const json = JSON.parse(content);

				const cleanConfig = normalizeConfig(json);

				return { config: cleanConfig, path: selected };
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
							const cleanConfig = normalizeConfig(json);
							resolve({ config: cleanConfig, path: file.name });
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
