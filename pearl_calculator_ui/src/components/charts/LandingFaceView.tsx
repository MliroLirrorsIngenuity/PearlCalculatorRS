import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { PearlTraceResult } from "@/types/domain";
import {
	type BlockFace,
	hitBlock,
	incomingDirection,
	landingPoint,
	type Vec3,
} from "./trajectory";

const GEOMETRY = {
	compact: { width: 150, height: 112, size: 80, marker: 7 },
	full: { width: 240, height: 200, size: 150, marker: 9 },
};

type Edge = "north" | "south" | "east" | "west" | "up" | "down";

interface FaceLayout {
	u: (p: Vec3) => number;
	v: (p: Vec3) => number;
	edges: { left: Edge; right: Edge; top: Edge; bottom: Edge };
}

const SIDE = { top: "up", bottom: "down" } as const;

const FACES: Record<BlockFace, FaceLayout> = {
	south: {
		u: (p) => p.X,
		v: (p) => p.Y,
		edges: { left: "west", right: "east", ...SIDE },
	},
	north: {
		u: (p) => 1 - p.X,
		v: (p) => p.Y,
		edges: { left: "east", right: "west", ...SIDE },
	},
	east: {
		u: (p) => 1 - p.Z,
		v: (p) => p.Y,
		edges: { left: "south", right: "north", ...SIDE },
	},
	west: {
		u: (p) => p.Z,
		v: (p) => p.Y,
		edges: { left: "north", right: "south", ...SIDE },
	},
	top: {
		u: (p) => p.X,
		v: (p) => 1 - p.Z,
		edges: { left: "west", right: "east", top: "north", bottom: "south" },
	},
	bottom: {
		u: (p) => 1 - p.X,
		v: (p) => 1 - p.Z,
		edges: { left: "east", right: "west", top: "north", bottom: "south" },
	},
};

interface LandingFaceViewProps {
	trace: PearlTraceResult;
	size?: keyof typeof GEOMETRY;
	className?: string;
}

export function LandingFaceView({
	trace,
	size = "compact",
	className,
}: LandingFaceViewProps) {
	const { t } = useTranslation();
	const g = GEOMETRY[size];
	const { face, entry } = hitBlock(
		landingPoint(trace),
		incomingDirection(trace),
	);
	const { u, v, edges } = FACES[face];

	const x0 = (g.width - g.size) / 2;
	const y0 = (g.height - g.size) / 2;
	const x1 = x0 + g.size;
	const y1 = y0 + g.size;
	const px = x0 + u(entry) * g.size;
	const py = y0 + (1 - v(entry)) * g.size;
	const cx = x0 + g.size / 2;
	const cy = y0 + g.size / 2;

	const pixel = g.size / 16;
	const grid = Array.from({ length: 15 }, (_, i) => (i + 1) * pixel)
		.map(
			(o) =>
				`M${(x0 + o).toFixed(1)},${y0}V${y1}M${x0},${(y0 + o).toFixed(1)}H${x1}`,
		)
		.join("");
	const label = (edge: Edge) => t(`chart.edge.${edge}`);

	return (
		<svg
			role="img"
			aria-label={t("chart.face_aria", { face: t(`trace.face.${face}`) })}
			viewBox={`0 0 ${g.width} ${g.height}`}
			className={cn("h-auto w-full", className)}
		>
			<rect
				x={x0}
				y={y0}
				width={g.size}
				height={g.size}
				className="fill-muted/60"
			/>
			<path d={grid} fill="none" strokeWidth={0.5} className="stroke-border" />
			<path
				d={`M${cx},${y0}V${y1}M${x0},${cy}H${x1}`}
				fill="none"
				className="stroke-muted-foreground/40"
			/>
			<path
				d={`M${x0},${py.toFixed(1)}H${x1}M${px.toFixed(1)},${y0}V${y1}`}
				fill="none"
				strokeDasharray="3 2"
				className="stroke-foreground/50"
			/>
			<rect
				x={x0}
				y={y0}
				width={g.size}
				height={g.size}
				fill="none"
				strokeWidth={1.25}
				className="stroke-foreground"
			/>
			<rect
				x={px - g.marker / 2}
				y={py - g.marker / 2}
				width={g.marker}
				height={g.marker}
				strokeWidth={1.5}
				className="fill-foreground stroke-background"
			/>
			<g className="fill-muted-foreground text-[10px]">
				<text x={cx} y={y0 - 5} textAnchor="middle">
					{label(edges.top)}
				</text>
				<text x={cx} y={y1 + 12} textAnchor="middle">
					{label(edges.bottom)}
				</text>
				<text x={x0 - 6} y={cy + 3.5} textAnchor="end">
					{label(edges.left)}
				</text>
				<text x={x1 + 6} y={cy + 3.5}>
					{label(edges.right)}
				</text>
			</g>
		</svg>
	);
}
