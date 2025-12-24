import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { SimulatorConfig } from "@/types/domain";
import { CoercedNumberSchema } from "@/lib/schemas";

function CompactInput({
	label,
	value,
	onChange,
	className,
	labelClassName,
}: {
	label: string;
	value: number;
	onChange: (val: string) => void;
	className?: string;
	labelClassName?: string;
}) {
	const [localValue, setLocalValue] = useState(value.toString());
	const [isFocused, setIsFocused] = useState(false);

	useEffect(() => {
		if (!isFocused && parseFloat(localValue) !== value) {
			setLocalValue(value.toString());
		}
	}, [value, isFocused, localValue]);

	const handleChange = (newValue: string) => {
		setLocalValue(newValue);
		onChange(newValue);
	};

	return (
		<div className={cn("flex items-center gap-1.5", className)}>
			<Label
				className={cn(
					"w-9 text-xs font-mono text-muted-foreground shrink-0 pt-0.5",
					labelClassName,
				)}
			>
				{label}
			</Label>
			<Input
				type="number"
				step="any"
				className="h-7 text-xs font-mono px-2 py-0 shadow-none focus-visible:ring-1 flex-1 min-w-0"
				value={localValue}
				onChange={(e) => handleChange(e.target.value)}
				onFocus={() => setIsFocused(true)}
				onBlur={() => setIsFocused(false)}
			/>
		</div>
	);
}

function Vector3Block({
	title,
	data,
	onUpdate,
}: {
	title: string;
	data: { x: number; y: number; z: number };
	onUpdate: (key: "x" | "y" | "z", val: number) => void;
}) {
	const { t } = useTranslation();
	const parse = (v: string) => CoercedNumberSchema.parse(v);

	return (
		<div className="space-y-1.5">
			<div className="text-xs font-bold text-foreground/80">{title}</div>
			<div className="grid gap-1.5">
				<CompactInput
					label={t("simulator.label_x")}
					labelClassName="w-3 text-left pr-0"
					value={data.x}
					onChange={(v) => onUpdate("x", parse(v))}
				/>
				<CompactInput
					label={t("simulator.label_y")}
					labelClassName="w-3 text-left pr-0"
					value={data.y}
					onChange={(v) => onUpdate("y", parse(v))}
				/>
				<CompactInput
					label={t("simulator.label_z")}
					labelClassName="w-3 text-left pr-0"
					value={data.z}
					onChange={(v) => onUpdate("z", parse(v))}
				/>
			</div>
		</div>
	);
}

function TNTGroupBlock({
	title,
	data,
	onUpdate,
}: {
	title: string;
	data: { pos: { x: number; y: number; z: number }; amount: number };
	onUpdate: (data: {
		pos: { x: number; y: number; z: number };
		amount: number;
	}) => void;
}) {
	const { t } = useTranslation();
	const parse = (v: string) => CoercedNumberSchema.parse(v);

	return (
		<div className="space-y-1.5">
			<div className="text-xs font-bold text-foreground/80">{title}</div>
			<div className="grid gap-1.5">
				<CompactInput
					label={t("simulator.label_x")}
					labelClassName="w-3 text-left pr-0"
					value={data.pos.x}
					onChange={(v) =>
						onUpdate({ ...data, pos: { ...data.pos, x: parse(v) } })
					}
				/>
				<CompactInput
					label={t("simulator.label_y")}
					labelClassName="w-3 text-left pr-0"
					value={data.pos.y}
					onChange={(v) =>
						onUpdate({ ...data, pos: { ...data.pos, y: parse(v) } })
					}
				/>
				<CompactInput
					label={t("simulator.label_z")}
					labelClassName="w-3 text-left pr-0"
					value={data.pos.z}
					onChange={(v) =>
						onUpdate({ ...data, pos: { ...data.pos, z: parse(v) } })
					}
				/>
				<CompactInput
					label={t("simulator.label_amount")}
					labelClassName="w-10 text-left pr-0"
					value={data.amount}
					onChange={(v) => onUpdate({ ...data, amount: parse(v) })}
				/>
			</div>
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
		<div className="flex flex-col h-full">
			<ScrollArea className="flex-1 pr-3 pl-1">
				<FieldSet className="w-full space-y-3 pb-4">
					<div className="flex items-center justify-between">
						<FieldLegend className="text-lg font-semibold flex items-center gap-2">
							{t("simulator.configuration_title")}
						</FieldLegend>
						<Button
							variant="outline"
							size="sm"
							className="h-6 px-2 text-xs"
							onClick={onReset}
						>
							{t("simulator.reset")}
						</Button>
					</div>

					<div className="grid grid-cols-2 gap-x-4 gap-y-4">
						<Vector3Block
							title={t("simulator.pearl_position")}
							data={config.pearl.pos}
							onUpdate={(k, v) =>
								onConfigChange({
									...config,
									pearl: {
										...config.pearl,
										pos: { ...config.pearl.pos, [k]: v },
									},
								})
							}
						/>
						<Vector3Block
							title={t("simulator.momentum")}
							data={config.pearl.momentum}
							onUpdate={(k, v) =>
								onConfigChange({
									...config,
									pearl: {
										...config.pearl,
										momentum: { ...config.pearl.momentum, [k]: v },
									},
								})
							}
						/>
						<TNTGroupBlock
							title={t("simulator.tnt_group_a")}
							data={config.tntA}
							onUpdate={(d) => onConfigChange({ ...config, tntA: d })}
						/>
						<TNTGroupBlock
							title={t("simulator.tnt_group_b")}
							data={config.tntB}
							onUpdate={(d) => onConfigChange({ ...config, tntB: d })}
						/>
					</div>
				</FieldSet>
			</ScrollArea>
			<div className="pt-2">
				<Button className="w-full" onClick={onTrace}>
					{t("simulator.trace_btn")}
				</Button>
			</div>
		</div>
	);
}
