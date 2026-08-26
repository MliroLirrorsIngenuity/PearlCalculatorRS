import * as React from "react";
import { Input } from "@/components/ui/input";

type BufferedNumberInputProps = Omit<
	React.ComponentProps<typeof Input>,
	"value" | "onChange" | "type"
> & {
	value: string | number | undefined;
	onValueChange: (value: string) => void;
};

export function BufferedNumberInput({
	value,
	onValueChange,
	onFocus,
	onBlur,
	...props
}: BufferedNumberInputProps) {
	const [localValue, setLocalValue] = React.useState(String(value ?? ""));
	const [isFocused, setIsFocused] = React.useState(false);

	React.useEffect(() => {
		if (!isFocused) {
			setLocalValue(String(value ?? ""));
		}
	}, [value, isFocused]);

	return (
		<Input
			{...props}
			type="number"
			value={localValue}
			onChange={(e) => {
				setLocalValue(e.target.value);
				onValueChange(e.target.value);
			}}
			onFocus={(e) => {
				setIsFocused(true);
				onFocus?.(e);
			}}
			onBlur={(e) => {
				setIsFocused(false);
				onBlur?.(e);
			}}
		/>
	);
}
