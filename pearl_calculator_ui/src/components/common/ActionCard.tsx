import { cn } from "@/lib/utils";

export const actionCardClass =
	"flex min-h-[190px] flex-col gap-2.5 rounded-xl border bg-card p-4 text-left";
export const actionIconClass =
	"flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-muted text-foreground [&_svg]:size-[18px]";

interface ActionCardProps {
	icon: React.ReactNode;
	title: string;
	hint: string;
	action?: string;
	onClick: () => void;
	primary?: boolean;
	className?: string;
}

export function ActionCard({
	icon,
	title,
	hint,
	action,
	onClick,
	primary = false,
	className,
}: ActionCardProps) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				actionCardClass,
				"transition-colors hover:bg-muted/50",
				primary && "border-foreground/80",
				className,
			)}
		>
			<span
				className={cn(
					actionIconClass,
					primary && "bg-foreground text-background",
				)}
			>
				{icon}
			</span>
			<span className="font-semibold">{title}</span>
			<span className="text-[13px] leading-relaxed text-muted-foreground">
				{hint}
			</span>
			{action && (
				<span className="mt-auto text-[13px] font-medium">{action}</span>
			)}
		</button>
	);
}
