import { BufferedNumberInput } from "@/components/common/BufferedNumberInput";
import { cn } from "@/lib/utils";

interface AxisInputProps {
	axis: string;
	id: string;
	value: string | number | undefined;
	onValueChange: (value: string) => void;
	compact?: boolean;
	placeholder?: string;
	error?: string;
	hint?: string;
	onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
}

export function AxisInput({
	axis,
	id,
	value,
	onValueChange,
	compact = false,
	placeholder = "0.0",
	error,
	hint,
	onKeyDown,
}: AxisInputProps) {
	return (
		<div className="relative min-w-0">
			<label
				htmlFor={id}
				className={cn(
					"pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted-foreground",
					compact ? "left-2 text-xs" : "left-3 text-[13px]",
					error && "text-destructive",
				)}
			>
				{axis}
			</label>
			<BufferedNumberInput
				id={id}
				placeholder={error ?? placeholder}
				aria-invalid={error ? true : undefined}
				className={cn(
					"tabular-nums",
					compact ? "h-8 pr-2 text-[13px] md:text-[13px]" : "pl-8",
					compact && (axis.length > 1 ? "pl-8" : "pl-6"),
					hint && "pr-8",
					error && "placeholder:text-destructive/60",
				)}
				value={value}
				onValueChange={onValueChange}
				onKeyDown={onKeyDown}
			/>
			{hint && (
				<span
					aria-hidden="true"
					className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted-foreground tabular-nums"
				>
					{hint}
				</span>
			)}
		</div>
	);
}
