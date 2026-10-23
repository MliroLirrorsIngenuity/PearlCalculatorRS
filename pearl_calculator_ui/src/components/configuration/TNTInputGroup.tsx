import { useId } from "react";
import { useTranslation } from "react-i18next";
import { AxisInput } from "@/components/common/AxisInput";
import { cn } from "@/lib/utils";

interface TNTInputGroupProps {
	title: string;
	data: { x: string | number; y: string | number; z: string | number };
	onUpdate: (key: "x" | "y" | "z", val: string) => void;
	className?: string;
	isRedTNT?: boolean;
	isBlueTNT?: boolean;
	onSetRedTNT?: () => void;
	errors?: { x?: string; y?: string; z?: string };
	hasError?: boolean;
	xSign?: string;
	zSign?: string;
	inputIdX?: string;
}

function GroupTag({ color, label }: { color: "red" | "blue"; label: string }) {
	return (
		<span
			className={cn(
				"flex h-6 items-center gap-1.5 rounded-md px-2 text-xs font-medium",
				color === "red"
					? "bg-red-600/10 text-red-700 dark:text-red-400"
					: "bg-blue-600/10 text-blue-700 dark:text-blue-400",
			)}
		>
			<span
				className={cn(
					"size-2",
					color === "red"
						? "bg-red-600 dark:bg-red-400"
						: "bg-blue-600 dark:bg-blue-400",
				)}
			/>
			{label}
		</span>
	);
}

export function TNTInputGroup({
	title,
	data,
	onUpdate,
	className,
	isRedTNT,
	isBlueTNT,
	onSetRedTNT,
	errors,
	hasError,
	xSign,
	zSign,
	inputIdX,
}: TNTInputGroupProps) {
	const { t } = useTranslation();
	const id = useId();

	return (
		<div
			className={cn(
				"flex flex-col gap-2 rounded-lg border bg-card p-3",
				isRedTNT && "border-red-600/40 dark:border-red-400/40",
				className,
			)}
		>
			<div className="flex h-6 items-center justify-between gap-2">
				<span className="text-[13px] font-medium">{title}</span>
				{isRedTNT && (
					<GroupTag color="red" label={t("configuration_page.red_tnt_badge")} />
				)}
				{!isRedTNT && isBlueTNT && (
					<button
						type="button"
						title={t("configuration_page.set_red_badge")}
						onClick={onSetRedTNT}
						disabled={!onSetRedTNT}
					>
						<GroupTag color="blue" label={t("configuration_page.color_blue")} />
					</button>
				)}
				{!isRedTNT && !isBlueTNT && onSetRedTNT && (
					<button
						type="button"
						onClick={onSetRedTNT}
						className={cn(
							"h-6 rounded-md border px-2 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
							hasError && "border-destructive text-destructive",
						)}
					>
						{t("configuration_page.set_red_badge")}
					</button>
				)}
			</div>
			<AxisInput
				axis="X"
				id={inputIdX ?? `${id}-x`}
				value={data.x}
				onValueChange={(v) => onUpdate("x", v)}
				error={errors?.x}
				hint={xSign}
			/>
			<AxisInput
				axis="Y"
				id={`${id}-y`}
				value={data.y}
				onValueChange={(v) => onUpdate("y", v)}
				error={errors?.y}
			/>
			<AxisInput
				axis="Z"
				id={`${id}-z`}
				value={data.z}
				onValueChange={(v) => onUpdate("z", v)}
				error={errors?.z}
				hint={zSign}
			/>
		</div>
	);
}
