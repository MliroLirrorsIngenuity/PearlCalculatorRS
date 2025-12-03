import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface CompactInputProps {
	label: string;
	value: string | number;
	onChange: (val: string) => void;
	className?: string;
	labelClassName?: string;
	error?: string;
}

export function CompactInput({
	label,
	value,
	onChange,
	className,
	labelClassName,
	error,
}: CompactInputProps) {
	const [localValue, setLocalValue] = React.useState(value.toString());
	const [isFocused, setIsFocused] = React.useState(false);

	React.useEffect(() => {
		if (!isFocused) {
			setLocalValue(value.toString());
		}
	}, [value, isFocused]);

	const handleChange = (newValue: string) => {
		setLocalValue(newValue);
		onChange(newValue);
	};

	return (
		<div className={cn("flex items-start gap-1.5", className)}>
			<Label
				className={cn(
					"w-9 text-xs font-mono text-muted-foreground shrink-0 pt-2",
					labelClassName,
				)}
			>
				{label}
			</Label>
			<div className="flex-1 min-w-0 space-y-1">
				<Input
					type="number"
					step="any"
					className={cn(
						"h-7 text-xs font-mono px-2 py-0 shadow-none focus-visible:ring-1 flex-1 min-w-0",
						error &&
							"border-destructive focus-visible:ring-destructive placeholder:text-destructive/60",
					)}
					value={localValue}
					onChange={(e) => handleChange(e.target.value)}
					onFocus={() => setIsFocused(true)}
					onBlur={() => setIsFocused(false)}
					placeholder={error}
				/>
			</div>
		</div>
	);
}
