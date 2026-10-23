const NUMBER = String.raw`(-?\d+(?:\.\d+)?)`;
const TELEPORT = new RegExp(
	String.raw`tp\s+@s\s+${NUMBER}\s+${NUMBER}\s+${NUMBER}`,
	"i",
);
const TRIPLE = new RegExp(
	String.raw`^\s*${NUMBER}[\s,]+${NUMBER}[\s,]+${NUMBER}\s*$`,
);

export function parseCoordinates(text: string) {
	const match = text.match(TELEPORT) ?? text.match(TRIPLE);
	if (!match) return null;
	const [x, y, z] = match.slice(1, 4).map(Number);
	return { x, y, z };
}
