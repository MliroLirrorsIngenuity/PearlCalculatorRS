import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { MaskGroup } from "@/types/domain";

const DIRECTIONS = [
	{ value: "North", labelKey: "calculator.direction_north" },
	{ value: "East", labelKey: "calculator.direction_east" },
	{ value: "West", labelKey: "calculator.direction_west" },
	{ value: "South", labelKey: "calculator.direction_south" },
] as const;

interface MaskGroupInputProps {
	mask: MaskGroup;
	onDirectionChange: (value: string) => void;
}

export function MaskGroupInput({
	mask,
	onDirectionChange,
}: MaskGroupInputProps) {
	const { t } = useTranslation();
	return (
		<div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl bg-slate-50 border border-slate-200">
			{mask.bits.map((bit, bIdx) => (
				<Input
					key={bIdx}
					value={bit}
					readOnly
					disabled
					className="w-7 h-7 text-center text-xs font-mono p-0 rounded-lg border-slate-300 bg-slate-100 text-muted-foreground cursor-not-allowed"
					maxLength={1}
				/>
			))}
			<Select
				value={mask.direction || undefined}
				onValueChange={onDirectionChange}
			>
				<SelectTrigger className="w-[72px] h-7 text-xs px-2 rounded-xl">
					<SelectValue placeholder={t("calculator.direction_label")} />
				</SelectTrigger>
				<SelectContent>
					{DIRECTIONS.map((d) => (
						<SelectItem key={d.value} value={d.value}>
							{t(d.labelKey)}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}
