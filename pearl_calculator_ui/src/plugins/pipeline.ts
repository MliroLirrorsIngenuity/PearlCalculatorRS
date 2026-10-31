import i18n from "i18next";
import type { SlotName } from "@/plugins/pearlcalc-plugin";
import { SLOT_BOUNDS } from "./bounds";
import { callContext, type PluginRecord, slotChain } from "./store";
import { ensureWorker } from "./workers";

const SLOT_TIMEOUT_MS = 120000;
const MAX_SLOT_DEPTH = 8;

export class PluginSlotError extends Error {
	constructor(
		readonly pluginName: string,
		readonly slot: SlotName,
		cause: unknown,
	) {
		super(
			i18n.t("plugins.errors.slot_failed", {
				name: pluginName,
				slot: i18n.t(`plugins.slot.${slot}`),
				message: cause instanceof Error ? cause.message : String(cause),
			}),
		);
	}
}

export function hasSlotOverride(slot: SlotName) {
	return slotChain(slot).length > 0;
}

export async function runSlot<I, O>(
	slot: SlotName,
	input: I,
	builtin: (input: I) => Promise<O>,
	check?: (output: unknown) => O,
	depth = 0,
	accept: (plugin: PluginRecord) => boolean = () => true,
): Promise<O> {
	if (depth >= MAX_SLOT_DEPTH) {
		throw new Error(`pc.run nested more than ${MAX_SLOT_DEPTH} levels`);
	}
	const chain = slotChain(slot).filter(accept);
	if (chain.length === 0) return builtin(input);

	const bound = SLOT_BOUNDS[slot] ?? ((value: unknown) => value);
	const invoke = async (index: number, value: I): Promise<O> => {
		if (index >= chain.length) return builtin(bound(value) as I);
		const plugin = chain[index];
		try {
			const worker = await ensureWorker(plugin.uid);
			const { promise } = worker.call(
				{ kind: "slot", name: slot },
				[value],
				callContext(plugin),
				{
					onNext: (next) => invoke(index + 1, next as I),
					timeoutMs: SLOT_TIMEOUT_MS,
					depth: depth + 1,
				},
			);
			const output = await promise;
			return check ? check(output) : (output as O);
		} catch (error) {
			throw error instanceof PluginSlotError
				? error
				: new PluginSlotError(plugin.manifest.name, slot, error);
		}
	};

	return invoke(0, input);
}
