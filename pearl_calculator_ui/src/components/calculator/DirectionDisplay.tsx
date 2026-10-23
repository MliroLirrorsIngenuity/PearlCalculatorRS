interface DirectionDisplayProps {
	direction: [boolean, boolean];
	label?: string;
}

export function DirectionDisplay({ direction, label }: DirectionDisplayProps) {
	return (
		<div className="flex justify-center">
			<div className="inline-flex items-center gap-3 px-2 py-2 rounded-xl border border-border border-dashed bg-muted/30">
				{label && (
					<span className="text-xs font-medium text-muted-foreground ml-2 mr-1">
						{label}
					</span>
				)}
				<div className="flex gap-2">
					{direction.map((isActive, idx) => (
						<div
							key={idx}
							className={`w-8 h-8 flex items-center justify-center text-xs tabular-nums rounded-md border transition-all duration-300 ${
								isActive
									? "bg-foreground border-foreground shadow-sm text-background font-semibold scale-110 z-10"
									: "bg-background border-border text-muted-foreground/60"
							}`}
						>
							{isActive ? "1" : "0"}
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
