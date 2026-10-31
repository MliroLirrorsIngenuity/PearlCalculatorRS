import {
	type DecodedConfig,
	type EncodableConfig,
	utilsRust,
} from "@/lib/utils-rust";
import type { EmbeddedPluginEntry, ExportedPlugin } from "@/plugins/store";
import type {
	BitTemplateConfig,
	GeneralConfig,
	MultiplierConfig,
} from "@/types/domain";

export type { DecodedConfig, EncodableConfig };

const PLUGIN_SEGMENT_MARK = "~";

export function encodeConfig(data: EncodableConfig): string {
	return utilsRust.encode_config(data);
}

export function decodeConfig(input: string): DecodedConfig {
	return utilsRust.decode_config(input);
}

export function buildEncodableConfig(
	config: GeneralConfig,
	bitTemplate: BitTemplateConfig | null,
	multiplierTemplate: MultiplierConfig | null,
): EncodableConfig {
	return utilsRust.build_encodable_config(
		config,
		bitTemplate,
		multiplierTemplate,
	);
}

function toBase64(bytes: Uint8Array) {
	let binary = "";
	for (let index = 0; index < bytes.length; index += 0x8000) {
		binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
	}
	return btoa(binary);
}

function fromBase64(text: string) {
	return Uint8Array.from(atob(text), (char) => char.charCodeAt(0));
}

function transform(bytes: Uint8Array, stream: TransformStream) {
	return new Response(
		new Blob([bytes as BlobPart]).stream().pipeThrough(stream),
	);
}

const normalizeCode = (input: string) => input.replace(/\s+/g, "");

export function pluginSegmentOf(input: string) {
	const segment = normalizeCode(input)
		.split("#")
		.find((part) => part.startsWith(PLUGIN_SEGMENT_MARK));
	return segment === undefined
		? null
		: segment.slice(PLUGIN_SEGMENT_MARK.length);
}

export async function pluginSegment(plugins: ExportedPlugin[]) {
	if (plugins.length === 0) return "";
	const json = new TextEncoder().encode(JSON.stringify({ Plugins: plugins }));
	const packed = await transform(
		json,
		new CompressionStream("deflate-raw"),
	).arrayBuffer();
	return `#${PLUGIN_SEGMENT_MARK}${toBase64(new Uint8Array(packed))}`;
}

async function decodePluginSegment(
	segment: string,
): Promise<EmbeddedPluginEntry[]> {
	const json = await transform(
		fromBase64(segment),
		new DecompressionStream("deflate-raw"),
	).text();
	return utilsRust.parse_configuration_content(json, "share-code.json").plugins;
}

export async function decodeShareCode(input: string) {
	const code = normalizeCode(input);
	const segment = pluginSegmentOf(code);
	return {
		...decodeConfig(code),
		plugins: segment === null ? [] : await decodePluginSegment(segment),
	};
}
