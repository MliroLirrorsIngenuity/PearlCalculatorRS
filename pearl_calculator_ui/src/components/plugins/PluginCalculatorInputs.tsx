import { sectionLabelClass } from "@/components/common/Metric";
import { editedRaw, type RawValues, resolveRaw } from "@/plugins/fields";
import {
	type PluginRecord,
	setCalculatorInputsRaw,
	setSimulatorInputsRaw,
	usePluginState,
} from "@/plugins/store";
import { PluginFieldForm } from "./PluginFieldForm";

type InputKind = "calculatorInputs" | "simulatorInputs";

const SETTERS: Record<InputKind, (uid: string, raw: RawValues) => void> = {
	calculatorInputs: setCalculatorInputsRaw,
	simulatorInputs: setSimulatorInputsRaw,
};

function PluginInputs({
	plugin,
	kind,
}: {
	plugin: PluginRecord;
	kind: InputKind;
}) {
	const app = usePluginState((state) => state.app);
	const fields = plugin.manifest[kind];
	const resolved = resolveRaw(fields, plugin[kind], app);
	return (
		<section className="flex flex-col gap-3.5 border-t border-border/60 pt-3.5">
			<span className={sectionLabelClass}>{plugin.manifest.name}</span>
			<PluginFieldForm
				idPrefix={`${kind}-${plugin.manifest.id}`}
				fields={fields}
				values={resolved}
				onChange={(values) =>
					SETTERS[kind](plugin.uid, editedRaw(values, resolved, plugin[kind]))
				}
			/>
		</section>
	);
}

function PluginInputSections({ kind }: { kind: InputKind }) {
	const plugins = usePluginState((state) => state.plugins);
	return plugins
		.filter((plugin) => plugin.active && plugin.manifest[kind].length > 0)
		.map((plugin) => (
			<PluginInputs key={plugin.uid} plugin={plugin} kind={kind} />
		));
}

export function PluginCalculatorInputs() {
	return <PluginInputSections kind="calculatorInputs" />;
}

export function PluginSimulatorInputs() {
	return <PluginInputSections kind="simulatorInputs" />;
}
