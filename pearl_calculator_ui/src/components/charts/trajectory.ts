import type { PearlTraceResult } from "@/types/domain";

export interface ProfilePoint {
	d: number;
	y: number;
}

export interface Vec3 {
	X: number;
	Y: number;
	Z: number;
}

export function toProfile(trace: PearlTraceResult): ProfilePoint[] {
	const [start] = trace.pearl_trace;
	if (!start) return [];
	return trace.pearl_trace.slice(0, landingIndex(trace) + 1).map((p) => ({
		d: Math.hypot(p.X - start.X, p.Z - start.Z),
		y: p.Y,
	}));
}

export function profileUntil(
	trace: PearlTraceResult,
	from: number,
	byTick: boolean,
	done: (point: ProfilePoint) => boolean,
): ProfilePoint[] {
	const [start] = trace.pearl_trace;
	const points: ProfilePoint[] = [];
	for (let i = Math.max(from, 0); i < trace.pearl_trace.length; i++) {
		const p = trace.pearl_trace[i];
		const point = {
			d: byTick ? i : Math.hypot(p.X - start.X, p.Z - start.Z),
			y: p.Y,
		};
		points.push(point);
		if (done(point)) break;
	}
	return points;
}

export function toTickProfile(trace: PearlTraceResult): ProfilePoint[] {
	return trace.pearl_trace
		.slice(0, landingIndex(trace) + 1)
		.map((p, i) => ({ d: i, y: p.Y }));
}

export function landingIndex(trace: PearlTraceResult) {
	const last = trace.pearl_trace.length - 1;
	return Math.min(trace.closest_approach?.tick ?? last, last);
}

export function landingPoint(trace: PearlTraceResult): Vec3 {
	return trace.closest_approach?.point ?? trace.landing_position;
}

export function peakIndex(points: { y: number }[]) {
	return points.reduce((best, p, i) => (p.y > points[best].y ? i : best), 0);
}

function niceStep(raw: number) {
	const magnitude = 10 ** Math.floor(Math.log10(raw));
	const fraction = raw / magnitude;
	const nice = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
	return nice * magnitude;
}

export function niceTicks(min: number, max: number, count: number) {
	const span = max - min || Math.abs(max) || 1;
	const step = niceStep(span / count);
	const lo = Math.floor(min / step) * step;
	const hi = Math.ceil(max / step) * step;
	const ticks: number[] = [];
	for (let v = lo; v <= hi + step / 2; v += step) {
		ticks.push(Number(v.toFixed(10)));
		if (v + step === v) break;
	}
	return { ticks, step };
}

export function svgPath(points: [number, number][]) {
	return points
		.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`)
		.join("");
}

export function descentAngle(trace: PearlTraceResult) {
	const i = landingIndex(trace);
	if (i < 1) return 0;
	const a = trace.pearl_trace[i - 1];
	const b = trace.pearl_trace[i];
	const horizontal = Math.hypot(b.X - a.X, b.Z - a.Z);
	const angle = (Math.atan2(a.Y - b.Y, horizontal) * 180) / Math.PI;
	return Math.abs(angle) < 0.05 ? 0 : angle;
}

export function incomingDirection(trace: PearlTraceResult): Vec3 {
	const i = landingIndex(trace);
	const a = trace.pearl_trace[Math.max(i - 1, 0)];
	const b = trace.pearl_trace[i];
	const length = Math.hypot(b.X - a.X, b.Y - a.Y, b.Z - a.Z) || 1;
	return {
		X: (b.X - a.X) / length,
		Y: (b.Y - a.Y) / length,
		Z: (b.Z - a.Z) / length,
	};
}

export type BlockFace = "top" | "bottom" | "east" | "west" | "south" | "north";

export function hitBlock(point: Vec3, direction: Vec3) {
	const block = {
		X: Math.floor(point.X),
		Y: Math.ceil(point.Y) - 1,
		Z: Math.floor(point.Z),
	};
	const local = {
		X: point.X - block.X,
		Y: point.Y - block.Y,
		Z: point.Z - block.Z,
	};
	const backtrack = (offset: number, speed: number) =>
		Math.abs(speed) < 1e-9
			? Number.POSITIVE_INFINITY
			: offset / Math.abs(speed);
	const entries: [BlockFace, number][] = [
		[
			direction.X > 0 ? "west" : "east",
			backtrack(direction.X > 0 ? local.X : 1 - local.X, direction.X),
		],
		[
			direction.Y > 0 ? "bottom" : "top",
			backtrack(direction.Y > 0 ? local.Y : 1 - local.Y, direction.Y),
		],
		[
			direction.Z > 0 ? "north" : "south",
			backtrack(direction.Z > 0 ? local.Z : 1 - local.Z, direction.Z),
		],
	];
	const [face, distance] = entries.reduce((best, entry) =>
		entry[1] < best[1] ? entry : best,
	);
	const back = Number.isFinite(distance) ? distance : 0;
	const clamp = (value: number) => Math.min(1, Math.max(0, value));
	const entry = {
		X: clamp(local.X - direction.X * back),
		Y: clamp(local.Y - direction.Y * back),
		Z: clamp(local.Z - direction.Z * back),
	};
	return { block, local, face, entry };
}

export function tickMarks(
	end: number,
	every = Math.max(10, niceStep(end / 15)),
) {
	const count = Math.max(0, Math.ceil(end / every) - 1);
	return Array.from({ length: count }, (_, i) => (i + 1) * every);
}

export function spacedMarks(
	ticks: number[],
	at: (tick: number) => [number, number],
	gap = 12,
) {
	const kept: number[] = [];
	let last: [number, number] | null = null;
	for (const tick of ticks) {
		const point = at(tick);
		if (!last || Math.hypot(point[0] - last[0], point[1] - last[1]) >= gap) {
			kept.push(tick);
			last = point;
		}
	}
	return kept;
}
