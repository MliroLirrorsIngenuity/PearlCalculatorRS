const SCALE = 1e12;

export function preciseAdd(a: number, b: number): number {
	return (Math.round(a * SCALE) + Math.round(b * SCALE)) / SCALE;
}

export function preciseSubtract(a: number, b: number): number {
	return (Math.round(a * SCALE) - Math.round(b * SCALE)) / SCALE;
}

export function preciseMultiply(a: number, b: number): number {
	return (Math.round(a * SCALE) * Math.round(b * SCALE)) / (SCALE * SCALE);
}

export function preciseDivide(a: number, b: number): number {
	return Math.round(a * SCALE) / Math.round(b * SCALE);
}
