import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const sectionLabelClass =
	"text-xs font-medium tracking-wide text-muted-foreground";

export function Metric({
	label,
	children,
	sub,
}: {
	label: string;
	children: ReactNode;
	sub: ReactNode;
}) {
	return (
		<div className="flex flex-col gap-1">
			<span className="text-xs text-muted-foreground">{label}</span>
			<span className="text-2xl font-semibold tracking-tight tabular-nums">
				{children}
			</span>
			<span className="text-xs text-muted-foreground tabular-nums">{sub}</span>
		</div>
	);
}

export function Unit({ children }: { children: ReactNode }) {
	return (
		<span className="mx-1 text-[13px] font-medium text-muted-foreground/70">
			{children}
		</span>
	);
}

export function TntCounts({
	blue,
	red,
	vertical,
}: {
	blue?: number;
	red?: number;
	vertical?: number;
}) {
	return (
		<span className="flex items-center gap-3.5">
			<span className="flex items-center gap-1.5">
				<span className="size-2 bg-blue-600 dark:bg-blue-400" />
				{blue}
			</span>
			<span className="flex items-center gap-1.5">
				<span className="size-2 bg-red-600 dark:bg-red-400" />
				{red}
			</span>
			{vertical !== undefined && (
				<span className="flex items-center gap-1.5">
					<span className="size-2 bg-foreground" />
					{vertical}
				</span>
			)}
		</span>
	);
}

export function Segmented<T extends string>({
	value,
	options,
	onChange,
	className,
}: {
	value: T;
	options: { value: T; label: ReactNode }[];
	onChange: (value: T) => void;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"flex rounded-lg bg-muted p-[3px] dark:bg-white/[0.06]",
				className,
			)}
		>
			{options.map((option) => (
				<button
					key={option.value}
					type="button"
					aria-pressed={option.value === value}
					onClick={() => onChange(option.value)}
					className={cn(
						"h-6 rounded-[5px] px-2.5 text-xs whitespace-nowrap text-muted-foreground",
						option.value === value &&
							"bg-background font-medium text-foreground shadow-xs dark:bg-white/[0.16]",
					)}
				>
					{option.label}
				</button>
			))}
		</div>
	);
}
