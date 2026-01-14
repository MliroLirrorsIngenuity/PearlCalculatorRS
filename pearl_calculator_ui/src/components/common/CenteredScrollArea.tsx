import * as React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useElementSize } from "@/hooks/use-element-size";
import { cn } from "@/lib/utils";

interface CenteredScrollAreaProps
	extends React.ComponentProps<typeof ScrollArea> {
	contentClassName?: string;
}

export function CenteredScrollArea({
	children,
	className,
	contentClassName,
	orientation = "vertical",
	...props
}: CenteredScrollAreaProps) {
	const { ref, height } = useElementSize<HTMLDivElement>();

	const isVertical = orientation === "vertical" || orientation === "both";

	return (
		<ScrollArea
			className={className}
			viewportRef={isVertical ? ref : undefined}
			orientation={orientation}
			{...props}
		>
			<div
				className={cn("flex flex-col", contentClassName)}
				style={{
					minHeight: isVertical && height > 0 ? height : "100%",
				}}
			>
				{children}
			</div>
		</ScrollArea>
	);
}
