import { useRef, useState } from "react";
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
	compact: { width: 150, height: 112, unit: 30 },
	full: { width: 240, height: 200, unit: 50 },
};

const DEFAULT_PITCH = 0.55;
const MIN_PITCH = 0.12;
const MAX_PITCH = 1.45;
const DRAG_SPEED = 0.012;

type Corner = [number, number, number];

const CUBE: {
	face: BlockFace;
	normal: Corner;
	corners: Corner[];
	fill: string;
}[] = [
	{
		face: "top",
		normal: [0, 1, 0],
		corners: [
			[0, 1, 0],
			[1, 1, 0],
			[1, 1, 1],
			[0, 1, 1],
		],
		fill: "fill-background dark:fill-zinc-500",
	},
	{
		face: "bottom",
		normal: [0, -1, 0],
		corners: [
			[0, 0, 0],
			[0, 0, 1],
			[1, 0, 1],
			[1, 0, 0],
		],
		fill: "fill-zinc-300 dark:fill-zinc-700",
	},
	{
		face: "south",
		normal: [0, 0, 1],
		corners: [
			[0, 0, 1],
			[1, 0, 1],
			[1, 1, 1],
			[0, 1, 1],
		],
		fill: "fill-zinc-300 dark:fill-zinc-700",
	},
	{
		face: "north",
		normal: [0, 0, -1],
		corners: [
			[0, 0, 0],
			[0, 1, 0],
			[1, 1, 0],
			[1, 0, 0],
		],
		fill: "fill-zinc-300 dark:fill-zinc-700",
	},
	{
		face: "east",
		normal: [1, 0, 0],
		corners: [
			[1, 0, 0],
			[1, 1, 0],
			[1, 1, 1],
			[1, 0, 1],
		],
		fill: "fill-zinc-200 dark:fill-zinc-600",
	},
	{
		face: "west",
		normal: [-1, 0, 0],
		corners: [
			[0, 0, 0],
			[0, 0, 1],
			[0, 1, 1],
			[0, 1, 0],
		],
		fill: "fill-zinc-200 dark:fill-zinc-600",
	},
];

const FACE_YAW: Partial<Record<BlockFace, number>> = {
	south: 0,
	east: Math.PI / 2,
	north: Math.PI,
	west: -Math.PI / 2,
};

const COMPASS: { key: "north" | "south" | "east" | "west"; at: Corner }[] = [
	{ key: "north", at: [0.5, 0, -1.45] },
	{ key: "south", at: [0.5, 0, 2.45] },
	{ key: "east", at: [2.45, 0, 0.5] },
	{ key: "west", at: [-1.45, 0, 0.5] },
];

function defaultYaw(face: BlockFace, dir: Vec3) {
	return (FACE_YAW[face] ?? Math.atan2(-dir.X, -dir.Z)) + 0.6;
}

const FACE_AXES: Record<BlockFace, [number, number]> = {
	top: [0, 2],
	bottom: [0, 2],
	east: [2, 1],
	west: [2, 1],
	south: [0, 1],
	north: [0, 1],
};

interface LandingBlockViewProps {
	trace: PearlTraceResult;
	size?: keyof typeof GEOMETRY;
	className?: string;
}

export function LandingBlockView({
	trace,
	size = "compact",
	className,
}: LandingBlockViewProps) {
	const { t } = useTranslation();
	const g = GEOMETRY[size];
	const dir = incomingDirection(trace);
	const { face, entry } = hitBlock(landingPoint(trace), dir);
	const [angles, setAngles] = useState<{ yaw: number; pitch: number } | null>(
		null,
	);
	const drag = useRef<{
		x: number;
		y: number;
		yaw: number;
		pitch: number;
	} | null>(null);

	const yaw = angles?.yaw ?? defaultYaw(face, dir);
	const pitch = angles?.pitch ?? DEFAULT_PITCH;
	const cosYaw = Math.cos(yaw);
	const sinYaw = Math.sin(yaw);
	const cosPitch = Math.cos(pitch);
	const sinPitch = Math.sin(pitch);
	const ox = g.width / 2;
	const oy = g.height / 2 + g.unit * 0.15;

	const project = ([x, y, z]: Corner): [number, number] => {
		const dx = x - 0.5;
		const dy = y - 0.5;
		const dz = z - 0.5;
		const rx = cosYaw * dx - sinYaw * dz;
		const rz = sinYaw * dx + cosYaw * dz;
		const up = dy * cosPitch - rz * sinPitch;
		return [ox + rx * g.unit, oy - up * g.unit];
	};
	const facing = ([nx, ny, nz]: Corner) =>
		(sinYaw * nx + cosYaw * nz) * cosPitch + ny * sinPitch > 1e-6;
	const toPath = (points: Corner[], closed = false) =>
		points
			.map((p, i) => {
				const [x, y] = project(p);
				return `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`;
			})
			.join("") + (closed ? "Z" : "");

	const floor = [-1, 0, 1, 2]
		.map(
			(i) =>
				toPath([
					[i, 0, -1],
					[i, 0, 2],
				]) +
				toPath([
					[-1, 0, i],
					[2, 0, i],
				]),
		)
		.join("");

	const hit: Corner = [entry.X, entry.Y, entry.Z];
	const hitSide = CUBE.find((side) => side.face === face) ?? CUBE[0];
	const hitVisible = facing(hitSide.normal);
	const [ia, ib] = FACE_AXES[face];
	const fixed = 3 - ia - ib;
	const onFace = (a: number, b: number): Corner => {
		const point: Corner = [0, 0, 0];
		point[ia] = a;
		point[ib] = b;
		point[fixed] = hitSide.corners[0][fixed];
		return point;
	};
	const quarters = [0.25, 0.5, 0.75]
		.map(
			(v) =>
				toPath([onFace(v, 0), onFace(v, 1)]) +
				toPath([onFace(0, v), onFace(1, v)]),
		)
		.join("");
	const guides =
		toPath([onFace(0, hit[ib]), onFace(1, hit[ib])]) +
		toPath([onFace(hit[ia], 0), onFace(hit[ia], 1)]);

	const tail: Corner = [
		hit[0] - dir.X * 2.4,
		hit[1] - dir.Y * 2.4,
		hit[2] - dir.Z * 2.4,
	];
	const [hx, hy] = project(hit);
	const [tx, ty] = project(tail);
	const marker = size === "full" ? 8 : 6;

	const approach = (hidden: boolean) => (
		<g opacity={hidden ? 0.35 : 1}>
			<line
				x1={tx}
				y1={ty}
				x2={hx}
				y2={hy}
				strokeWidth={1.25}
				strokeDasharray="4 3"
				className="stroke-foreground"
			/>
			<rect
				x={hx - marker / 2}
				y={hy - marker / 2}
				width={marker}
				height={marker}
				strokeWidth={1.5}
				className="fill-foreground stroke-background"
			/>
		</g>
	);

	return (
		<svg
			role="img"
			aria-label={t("chart.block_aria", { face: t(`trace.face.${face}`) })}
			viewBox={`0 0 ${g.width} ${g.height}`}
			className={cn(
				"h-auto w-full cursor-grab touch-none select-none active:cursor-grabbing",
				className,
			)}
			onPointerDown={(event) => {
				event.currentTarget.setPointerCapture(event.pointerId);
				drag.current = { x: event.clientX, y: event.clientY, yaw, pitch };
			}}
			onPointerMove={(event) => {
				const start = drag.current;
				if (!start) return;
				setAngles({
					yaw: start.yaw - (event.clientX - start.x) * DRAG_SPEED,
					pitch: Math.min(
						MAX_PITCH,
						Math.max(
							MIN_PITCH,
							start.pitch + (event.clientY - start.y) * DRAG_SPEED,
						),
					),
				});
			}}
			onPointerUp={() => {
				drag.current = null;
			}}
			onPointerCancel={() => {
				drag.current = null;
			}}
			onDoubleClick={() => setAngles(null)}
		>
			<path
				d={floor}
				fill="none"
				className="stroke-border dark:stroke-zinc-700"
			/>
			<g className="fill-muted-foreground text-[10px]" textAnchor="middle">
				{COMPASS.map(({ key, at }) => {
					const [x, y] = project(at);
					return (
						<text key={key} x={x} y={y + 3.5}>
							{t(`chart.edge.${key}`)}
						</text>
					);
				})}
			</g>
			{!hitVisible && approach(false)}
			{CUBE.filter((side) => facing(side.normal)).map((side) => (
				<path
					key={side.face}
					d={toPath(side.corners, true)}
					strokeLinejoin="round"
					className={cn(
						"stroke-foreground dark:stroke-zinc-300",
						side.face === face ? "fill-sky-100 dark:fill-sky-800" : side.fill,
					)}
				/>
			))}
			{hitVisible && (
				<>
					<path
						d={quarters}
						fill="none"
						strokeWidth={0.5}
						className="stroke-sky-600/40 dark:stroke-sky-400/40"
					/>
					<path
						d={guides}
						fill="none"
						strokeDasharray="3 2"
						className="stroke-sky-700 dark:stroke-sky-300"
					/>
				</>
			)}
			{approach(!hitVisible)}
		</svg>
	);
}
