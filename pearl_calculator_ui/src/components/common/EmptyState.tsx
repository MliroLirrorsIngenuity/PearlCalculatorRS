import { cn } from "@/lib/utils";

export function EmptyState({
	icon,
	title,
	hint,
	className,
}: {
	icon: React.ReactNode;
	title: string;
	hint: string;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-6 text-center",
				className,
			)}
		>
			<span className="flex size-10 items-center justify-center rounded-xl bg-muted [&_svg]:size-5">
				{icon}
			</span>
			<div className="flex max-w-sm flex-col gap-1">
				<span className="font-medium">{title}</span>
				<span className="text-sm text-muted-foreground">{hint}</span>
			</div>
		</div>
	);
}
