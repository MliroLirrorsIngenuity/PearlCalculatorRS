import { RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AxisInput } from "@/components/common/AxisInput";
import { PluginSimulatorInputs } from "@/components/plugins/PluginCalculatorInputs";
import { PluginMount } from "@/components/plugins/PluginMount";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CoercedNumberSchema } from "@/lib/schemas";
import type { SimulatorConfig } from "@/types/domain";
import { SimulatorImportMenu } from "./SimulatorImportMenu";

type Vec = { x: number; y: number; z: number };

const parse = (value: string) => CoercedNumberSchema.parse(value);

const TNT_GROUPS = [
	{ key: "tntA", label: "TNT A" },
	{ key: "tntB", label: "TNT B" },
	{ key: "tntC", label: "TNT C" },
	{ key: "tntD", label: "TNT D" },
] as const;

function VectorBlock({
	id,
	label,
	value,
	onChange,
	headerExtra,
}: {
	id: string;
	label: string;
	value: Vec;
	onChange: (value: Vec) => void;
	headerExtra?: React.ReactNode;
}) {
	return (
		<div className="flex min-w-0 flex-col gap-1.5">
			<div className="flex h-8 items-center justify-between gap-2">
				<span className="text-[13px] font-medium whitespace-nowrap">
					{label}
				</span>
				{headerExtra}
			</div>
			{(["x", "y", "z"] as const).map((axis) => (
				<AxisInput
					key={axis}
					compact
					axis={axis.toUpperCase()}
					id={`${id}-${axis}`}
					value={value[axis]}
					onValueChange={(v) => onChange({ ...value, [axis]: parse(v) })}
				/>
			))}
		</div>
	);
}

interface SimulatorInputFormProps {
	config: SimulatorConfig;
	onConfigChange: (newConfig: SimulatorConfig) => void;
	onTrace: () => void;
	onReset: () => void;
}

export default function SimulatorInputForm({
	config,
	onConfigChange,
	onTrace,
	onReset,
}: SimulatorInputFormProps) {
	const { t } = useTranslation();

	return (
		<div className="flex h-full min-h-0 flex-col">
			<ScrollArea className="min-h-0 flex-1">
				<div className="flex flex-col gap-4 pt-1 pr-3 pb-1 pl-1">
					<section className="grid grid-cols-2 gap-3">
						<VectorBlock
							id="sim-pearl-pos"
							label={t("configuration_page.pearl_coord_label")}
							value={config.pearl.pos}
							onChange={(pos) =>
								onConfigChange({ ...config, pearl: { ...config.pearl, pos } })
							}
						/>
						<VectorBlock
							id="sim-pearl-momentum"
							label={t("configuration_page.pearl_momentum_label")}
							value={config.pearl.momentum}
							onChange={(momentum) =>
								onConfigChange({
									...config,
									pearl: { ...config.pearl, momentum },
								})
							}
						/>
					</section>

					<section className="grid grid-cols-2 gap-3">
						{TNT_GROUPS.map(({ key, label }) => {
							const group = config[key];
							return (
								<VectorBlock
									key={key}
									id={`sim-${key}`}
									label={label}
									value={group.pos}
									onChange={(pos) =>
										onConfigChange({ ...config, [key]: { ...group, pos } })
									}
									headerExtra={
										<div className="w-20 shrink-0">
											<AxisInput
												compact
												axis="×"
												id={`sim-${key}-amount`}
												placeholder="0"
												value={group.amount}
												onValueChange={(v) =>
													onConfigChange({
														...config,
														[key]: { ...group, amount: parse(v) },
													})
												}
											/>
										</div>
									}
								/>
							);
						})}
					</section>
					<PluginSimulatorInputs />
					<PluginMount
						point="simulator.inputs"
						className="border-t border-border/60 pt-3.5"
					/>
				</div>
			</ScrollArea>
			<div className="mt-2 flex gap-2">
				<Button variant="outline" onClick={onReset}>
					<RotateCcw />
					{t("simulator.reset")}
				</Button>
				<SimulatorImportMenu config={config} onImport={onConfigChange} />
				<Button className="flex-1" onClick={onTrace}>
					{t("simulator.trace_btn")}
				</Button>
			</div>
		</div>
	);
}
