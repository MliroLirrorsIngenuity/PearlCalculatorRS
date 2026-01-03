import { match, P } from "ts-pattern";
import { ArrowUpDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BitInputRow, type ThemeColor } from "./BitInputRow";

function parsePastedValues(text: string): string[] | null {
	const trimmed = text.trim();
	if (!trimmed) return null;

	if (/^(\d+\s+)+\d+$/.test(trimmed)) {
		return trimmed.split(/\s+/);
	}

	if (/^(\d+\s*,\s*)+\d+$/.test(trimmed)) {
		return trimmed.split(",").map((s) => s.trim());
	}

	return null;
}

export interface MultiplierBitInputState {
	sideCount: number;
	sideValues: string[];
	multiplier: number;
	isSwapped: boolean;
}

interface MultiplierBitInputSectionProps {
	value?: MultiplierBitInputState;
	onChange?: (state: MultiplierBitInputState) => void;
}

const DEFAULT_STATE: MultiplierBitInputState = {
	sideCount: 13,
	sideValues: Array(13).fill(""),
	multiplier: 200,
	isSwapped: false,
};

export function MultiplierBitInputSection({
	value,
	onChange,
}: MultiplierBitInputSectionProps) {
	const { t } = useTranslation();
	const [internalState, setInternalState] =
		useState<MultiplierBitInputState>(DEFAULT_STATE);
	const [, setHistory] = useState<MultiplierBitInputState[]>([]);

	const state = value ?? internalState;
	const setState = (newState: MultiplierBitInputState) => {
		if (onChange) {
			onChange(newState);
		} else {
			setInternalState(newState);
		}
	};

	const saveCheckpoint = () => {
		setHistory((prev) => [...prev, state]);
	};

	const undo = () => {
		setHistory((prev) => {
			if (prev.length === 0) return prev;
			const newHistory = [...prev];
			const previousState = newHistory.pop();
			if (previousState) {
				setState(previousState);
			}
			return newHistory;
		});
	};

	const [sideInputValue, setSideInputValue] = useState<string>(
		state.sideCount.toString(),
	);
	const [multiplierInputValue, setMultiplierInputValue] = useState<string>(
		state.multiplier.toString(),
	);
	const blueRefs = useRef<(HTMLInputElement | null)[]>([]);
	const redRefs = useRef<(HTMLInputElement | null)[]>([]);

	useEffect(() => {
		setSideInputValue(state.sideCount.toString());
	}, [state.sideCount]);

	useEffect(() => {
		setMultiplierInputValue(state.multiplier.toString());
	}, [state.multiplier]);

	useEffect(() => {
		if (state.sideValues.length !== state.sideCount) {
			const newValues =
				state.sideValues.length < state.sideCount
					? [
							...state.sideValues,
							...Array(state.sideCount - state.sideValues.length).fill(""),
						]
					: state.sideValues.slice(0, state.sideCount);
			setState({ ...state, sideValues: newValues });
		}
		blueRefs.current = blueRefs.current.slice(0, state.sideCount);
		redRefs.current = redRefs.current.slice(0, state.sideCount);
	}, [state.sideCount]);

	const handleSideBlur = () => {
		const val = Number.parseInt(sideInputValue);
		if (!Number.isNaN(val) && val > 0 && val <= 64) {
			setState({ ...state, sideCount: val });
		} else {
			setSideInputValue(state.sideCount.toString());
		}
	};

	const handleMultiplierBlur = () => {
		const val = Number.parseInt(multiplierInputValue);
		if (!Number.isNaN(val) && val > 0) {
			setState({ ...state, multiplier: val });
		} else {
			setMultiplierInputValue(state.multiplier.toString());
		}
	};

	const handleSideValueChange = (
		index: number,
		value: string,
		source: "blue" | "red",
	) => {
		const newValues = [...state.sideValues];
		const actualIndex = source === "blue" ? index : state.sideCount - 1 - index;
		newValues[actualIndex] = value;
		setState({ ...state, sideValues: newValues });
	};

	const handleKeyDown = (
		index: number,
		e: React.KeyboardEvent<HTMLInputElement>,
		source: "blue" | "red",
	) => {
		const refs = source === "blue" ? blueRefs : redRefs;
		match(e.key)
			.with(P.union("Enter", " "), () => {
				e.preventDefault();
				if (index < state.sideCount - 1) {
					refs.current[index + 1]?.focus();
				}
			})
			.with("Backspace", () => {
				const actualIndex =
					source === "blue" ? index : state.sideCount - 1 - index;
				if (state.sideValues[actualIndex] === "" && index > 0) {
					e.preventDefault();
					refs.current[index - 1]?.focus();
				}
			})
			.otherwise(() => {
				if ((e.ctrlKey || e.metaKey) && e.key === "z") {
					e.preventDefault();
					undo();
				}
			});
	};

	const handlePaste = (
		index: number,
		e: React.ClipboardEvent,
		source: "blue" | "red",
	) => {
		const text = e.clipboardData.getData("text");
		const values = parsePastedValues(text);

		if (!values) return;

		e.preventDefault();
		saveCheckpoint();

		const newValues = [...state.sideValues];
		const startIndex = source === "blue" ? index : state.sideCount - 1 - index;
		const direction = source === "blue" ? 1 : -1;

		values.forEach((val, i) => {
			const targetIndex = startIndex + i * direction;
			if (targetIndex >= 0 && targetIndex < state.sideCount) {
				newValues[targetIndex] = val;
			}
		});

		setState({ ...state, sideValues: newValues });
	};

	const handleSwap = () => {
		saveCheckpoint();
		setState({ ...state, isSwapped: !state.isSwapped });
	};

	const getPlaceholder = (index: number) => (index + 1).toString();

	const topDisplay = state.sideValues;
	const botDisplay = [...state.sideValues].reverse();
	const topTheme: ThemeColor = state.isSwapped ? "red" : "blue";
	const topLabel = state.isSwapped
		? t("calculator.header_red")
		: t("calculator.header_blue");
	const botTheme: ThemeColor = state.isSwapped ? "blue" : "red";
	const botLabel = state.isSwapped
		? t("calculator.header_blue")
		: t("calculator.header_red");

	const topPlaceholders = topDisplay.map((_, i) => getPlaceholder(i));
	const botPlaceholders = botDisplay.map((_, i) =>
		getPlaceholder(state.sideCount - 1 - i),
	);

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap justify-between items-center gap-2">
				<div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-50 border border-slate-200">
					<Label className="text-xs text-muted-foreground font-medium whitespace-nowrap">
						{t("calculator.side_mode")}
					</Label>
					<Input
						type="number"
						value={sideInputValue}
						onChange={(e) => setSideInputValue(e.target.value)}
						onBlur={handleSideBlur}
						onKeyDown={(e) => {
							if (e.key === "Enter") e.currentTarget.blur();
						}}
						className="w-16 h-7 text-center text-xs font-medium"
					/>
				</div>

				<div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-50 border border-slate-200">
					<Label className="text-xs text-muted-foreground font-medium whitespace-nowrap">
						{t("calculator.multiplier_label")}
					</Label>
					<span className="text-xs text-muted-foreground font-medium">×</span>
					<Input
						type="number"
						value={multiplierInputValue}
						onChange={(e) => setMultiplierInputValue(e.target.value)}
						onBlur={handleMultiplierBlur}
						onKeyDown={(e) => {
							if (e.key === "Enter") e.currentTarget.blur();
						}}
						className="w-20 h-7 text-center text-xs font-medium"
					/>
				</div>
			</div>

			<div className="space-y-2">
				<BitInputRow
					theme={topTheme}
					label={topLabel}
					values={topDisplay}
					placeholders={topPlaceholders}
					arrowPosition="right"
					inputRefs={blueRefs}
					onValueChange={(i, v) => handleSideValueChange(i, v, "blue")}
					onKeyDown={(i, e) => handleKeyDown(i, e, "blue")}
					onPaste={(i, e) => handlePaste(i, e, "blue")}
				/>

				<div className="flex justify-center relative z-10">
					<Button
						variant="outline"
						size="icon"
						className="h-6 w-6 rounded-md bg-background border-slate-200 shadow-sm hover:bg-slate-100 transition-colors"
						onClick={handleSwap}
					>
						<ArrowUpDown className="w-3 h-3 text-muted-foreground" />
					</Button>
				</div>

				<BitInputRow
					theme={botTheme}
					label={botLabel}
					values={botDisplay}
					placeholders={botPlaceholders}
					arrowPosition="left"
					inputRefs={redRefs}
					onValueChange={(i, v) => handleSideValueChange(i, v, "red")}
					onKeyDown={(i, e) => handleKeyDown(i, e, "red")}
					onPaste={(i, e) => handlePaste(i, e, "red")}
				/>
			</div>
		</div>
	);
}
