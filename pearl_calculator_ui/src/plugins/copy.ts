import type { CopyInput } from "@/plugins/pearlcalc-plugin";
import { rejectEmbeddedPlugins } from "./embedded";
import { runSlot } from "./pipeline";

export async function copyText(
	kind: CopyInput["kind"],
	text: string,
	data: unknown,
	useSlots = true,
) {
	const output = await runSlot(
		"copy",
		{ kind, text, data },
		async (input) => input.text,
		(value) => {
			if (typeof value !== "string") {
				throw new Error("copy must return a string");
			}
			return value;
		},
		0,
		() => useSlots,
	);
	rejectEmbeddedPlugins(output);
	return output;
}
