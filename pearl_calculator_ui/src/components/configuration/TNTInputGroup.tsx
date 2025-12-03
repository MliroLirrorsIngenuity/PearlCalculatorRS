import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CompactInput } from "./CompactInput";
import { useTranslation } from "react-i18next";

interface TNTInputGroupProps {
	title: string;
	data: { x: string | number; y: string | number; z: string | number };
	onUpdate: (key: "x" | "y" | "z", val: string) => void;
	className?: string;
	isRedTNT?: boolean;
	onSetRedTNT?: () => void;
	errors?: { x?: string; y?: string; z?: string };
	hasError?: boolean;
	yOffset?: number;
}

export function TNTInputGroup({
	title,
	data,
	onUpdate,
	className,
	isRedTNT,
	onSetRedTNT,
	errors,
	hasError,
	yOffset = 0,
}: TNTInputGroupProps) {
	const { t } = useTranslation();
	let yValue: string | number = data.y;
	if (yOffset !== 0) {
		if (typeof data.y === "number") {
			yValue = data.y + yOffset;
		} else {
			const parsed = parseFloat(data.y);
			if (!Number.isNaN(parsed)) {
				yValue = parsed + yOffset;
			}
		}
	}

	return (
		<div
			className={cn(
				"space-y-1.5 w-[240px] bg-card p-3 rounded-lg border shadow-sm",
				className,
			)}
		>
			<div className="flex items-center justify-between mb-2">
				<div className="text-xs font-bold text-foreground/80">{title}</div>
				{onSetRedTNT && (
					<div onClick={onSetRedTNT} className="shrink-0">
						{isRedTNT ? (
							<Badge
								variant="destructive"
								className="cursor-default px-2 h-auto min-h-0 leading-none"
							>
								{t("configuration_page.red_tnt_badge")}
							</Badge>
						) : (
							<Badge
								variant="outline"
								className={cn(
									"cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors px-2 h-auto min-h-0 leading-none",
									hasError &&
									"border-destructive text-destructive hover:bg-destructive/10",
								)}
							>
								{t("configuration_page.set_red_badge")}
							</Badge>
						)}
					</div>
				)}
			</div>
			<div className="grid gap-1.5">
				<CompactInput
					label={t("configuration_page.label_x")}
					labelClassName="w-3 text-left pr-0"
					value={data.x}
					onChange={(v) => onUpdate("x", v)}
					error={errors?.x}
				/>
				<CompactInput
					label={t("configuration_page.label_y")}
					labelClassName="w-3 text-left pr-0"
					value={yValue}
					onChange={(v) => {
						if (yOffset !== 0) {
							const val = parseFloat(v);
							if (!Number.isNaN(val)) {
								onUpdate("y", (val - yOffset).toString());
							} else {
								onUpdate("y", v);
							}
						} else {
							onUpdate("y", v);
						}
					}}
					error={errors?.y}
				/>
				<CompactInput
					label={t("configuration_page.label_z")}
					labelClassName="w-3 text-left pr-0"
					value={data.z}
					onChange={(v) => onUpdate("z", v)}
					error={errors?.z}
				/>
			</div>
		</div>
	);
}
