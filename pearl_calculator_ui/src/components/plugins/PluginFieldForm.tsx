import { Info } from "lucide-react";
import { AxisInput } from "@/components/common/AxisInput";
import { BufferedNumberInput } from "@/components/common/BufferedNumberInput";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { FieldError, RawValue, RawValues } from "@/plugins/fields";
import type { InputField } from "@/plugins/localize";

const labelClass = "text-sm font-medium leading-none";

function FieldLabel({
	field,
	htmlFor,
	invalid,
}: {
	field: InputField;
	htmlFor?: string;
	invalid: boolean;
}) {
	return (
		<div className="flex items-center gap-1.5">
			<label
				htmlFor={htmlFor}
				className={cn(labelClass, invalid && "text-destructive")}
			>
				{field.label}
				{field.required && <span className="text-muted-foreground"> *</span>}
			</label>
			{field.description && (
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>
							<button
								type="button"
								aria-label={field.description}
								className="text-muted-foreground hover:text-foreground"
							>
								<Info className="size-3.5" />
							</button>
						</TooltipTrigger>
						<TooltipContent className="max-w-72">
							<p>{field.description}</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			)}
		</div>
	);
}

function FieldControl({
	field,
	id,
	value,
	onChange,
}: {
	field: InputField;
	id: string;
	value: RawValue | undefined;
	onChange: (value: RawValue) => void;
}) {
	switch (field.type) {
		case "number":
		case "integer":
			return (
				<BufferedNumberInput
					id={id}
					className="tabular-nums"
					step={field.step ?? (field.type === "integer" ? 1 : "any")}
					min={field.min}
					max={field.max}
					value={typeof value === "string" ? value : ""}
					onValueChange={onChange}
				/>
			);
		case "text":
			return field.multiline ? (
				<textarea
					id={id}
					className="min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30"
					value={typeof value === "string" ? value : ""}
					onChange={(event) => onChange(event.target.value)}
				/>
			) : (
				<Input
					id={id}
					value={typeof value === "string" ? value : ""}
					onChange={(event) => onChange(event.target.value)}
				/>
			);
		case "select":
			return (
				<Select
					value={typeof value === "string" ? value : undefined}
					onValueChange={onChange}
				>
					<SelectTrigger id={id} className="w-full">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{field.options.map((option) => (
							<SelectItem key={option.value} value={option.value}>
								{option.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			);
		case "range": {
			const [low, high] = Array.isArray(value) ? value : ["", ""];
			return (
				<div className="grid grid-cols-2 gap-4">
					<AxisInput
						axis="≥"
						id={`${id}-low`}
						placeholder=""
						value={low}
						onValueChange={(next) => onChange([next, high])}
					/>
					<AxisInput
						axis="≤"
						id={`${id}-high`}
						placeholder=""
						value={high}
						onValueChange={(next) => onChange([low, next])}
					/>
				</div>
			);
		}
		case "vec3": {
			const vector =
				value && typeof value === "object" && !Array.isArray(value)
					? value
					: { x: "", y: "", z: "" };
			return (
				<div className="grid grid-cols-3 gap-4">
					{(["x", "y", "z"] as const).map((axis) => (
						<AxisInput
							key={axis}
							axis={axis.toUpperCase()}
							id={`${id}-${axis}`}
							value={vector[axis]}
							onValueChange={(next) => onChange({ ...vector, [axis]: next })}
						/>
					))}
				</div>
			);
		}
		default:
			return null;
	}
}

export function PluginFieldForm({
	idPrefix,
	fields,
	values,
	errors = [],
	onChange,
}: {
	idPrefix: string;
	fields: InputField[];
	values: RawValues;
	errors?: FieldError[];
	onChange: (values: RawValues) => void;
}) {
	const invalid = new Set(errors.map((error) => error.key));
	const toggles = fields.filter((field) => field.type === "boolean");
	const others = fields.filter((field) => field.type !== "boolean");

	return (
		<div className="flex flex-col gap-3.5">
			{others.map((field) => {
				const id = `${idPrefix}-${field.key}`;
				return (
					<div key={field.key} className="flex flex-col gap-2">
						<FieldLabel
							field={field}
							htmlFor={
								field.type === "range" || field.type === "vec3" ? undefined : id
							}
							invalid={invalid.has(field.key)}
						/>
						<FieldControl
							field={field}
							id={id}
							value={values[field.key]}
							onChange={(value) => onChange({ ...values, [field.key]: value })}
						/>
					</div>
				);
			})}
			{toggles.length > 0 && (
				<div className="flex flex-col gap-2.5 pt-0.5">
					{toggles.map((field) => (
						<label
							key={field.key}
							htmlFor={`${idPrefix}-${field.key}`}
							className="flex items-center gap-2 text-sm"
						>
							<input
								id={`${idPrefix}-${field.key}`}
								type="checkbox"
								checked={values[field.key] === true}
								onChange={(event) =>
									onChange({ ...values, [field.key]: event.target.checked })
								}
								className="size-4 rounded border-input accent-foreground"
							/>
							{field.label}
							{field.description && (
								<span className="text-xs text-muted-foreground">
									{field.description}
								</span>
							)}
						</label>
					))}
				</div>
			)}
		</div>
	);
}
