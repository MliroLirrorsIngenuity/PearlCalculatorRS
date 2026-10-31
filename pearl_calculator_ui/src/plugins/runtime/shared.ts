import type {
	PearlCalculatorApi,
	PearlState,
	PearlVersion,
	SortKey,
	Vec3,
} from "@/plugins/pearlcalc-plugin";

export type Row = Record<string, unknown>;

export interface TopN {
	compare(a: Row, b: Row): number;
	accepts(row: Row): boolean;
	offer(row: Row): boolean;
	worst(): Row | undefined;
	full(): boolean;
	rows(): Row[];
	setFloor(row: Row | undefined): void;
}

export interface PhysicsExports {
	memory: WebAssembly.Memory;
	pc_tnt_impulse(
		pearlX: number,
		pearlY: number,
		pearlZ: number,
		tntX: number,
		tntY: number,
		tntZ: number,
	): number;
	pc_flight(
		version: number,
		positionX: number,
		positionY: number,
		positionZ: number,
		motionX: number,
		motionY: number,
		motionZ: number,
		ticks: number,
	): number;
}

export type HostRequest = (
	method: string,
	payload: unknown,
) => Promise<unknown>;

export function createTopN(sortBy: SortKey[] | undefined, limit: number): TopN {
	const keys = (sortBy ?? []).map((entry) =>
		typeof entry === "string"
			? { key: entry, sign: 1 }
			: { key: entry.key, sign: entry.order === "desc" ? -1 : 1 },
	);
	const capacity = Math.max(1, Math.floor(limit));
	const items: Row[] = [];
	const byKey = new Map<unknown, Row>();
	let floor: Row | undefined;

	const rank = (value: unknown) =>
		typeof value === "number" && !Number.isNaN(value)
			? value
			: typeof value === "string"
				? value
				: Number.POSITIVE_INFINITY;

	const compare = (a: Row, b: Row) => {
		for (const { key, sign } of keys) {
			const left = rank(a[key]);
			const right = rank(b[key]);
			if (left < right) return -sign;
			if (left > right) return sign;
		}
		return 0;
	};

	const upperBound = (row: Row) => {
		let low = 0;
		let high = items.length;
		while (low < high) {
			const mid = (low + high) >> 1;
			if (compare(items[mid], row) <= 0) low = mid + 1;
			else high = mid;
		}
		return low;
	};

	const remove = (row: Row) => {
		const index = items.indexOf(row);
		if (index >= 0) items.splice(index, 1);
	};

	const beatsFloor = (row: Row) =>
		keys.length === 0 || floor === undefined || compare(row, floor) < 0;

	const accepts = (row: Row) => {
		if (!beatsFloor(row)) return false;
		if (items.length < capacity) return true;
		return keys.length > 0 && compare(row, items[items.length - 1]) < 0;
	};

	const offer = (row: Row) => {
		const key = row.key;
		const keyed = typeof key === "string" || typeof key === "number";
		const existing = keyed ? byKey.get(key) : undefined;
		if (existing) {
			if (keys.length === 0 || compare(row, existing) >= 0) return false;
			remove(existing);
			byKey.delete(key);
		} else if (!accepts(row)) {
			return false;
		}
		items.splice(keys.length === 0 ? items.length : upperBound(row), 0, row);
		if (keyed) byKey.set(key, row);
		if (items.length > capacity) {
			const evicted = items.pop() as Row;
			const evictedKey = evicted.key;
			if (byKey.get(evictedKey) === evicted) byKey.delete(evictedKey);
		}
		return true;
	};

	return {
		compare,
		accepts,
		offer,
		worst: () => items[items.length - 1],
		full: () => items.length >= capacity,
		rows: () => items.slice(),
		setFloor: (row) => {
			floor = row;
		},
	};
}

export function createPluginApi(
	wasm: PhysicsExports,
	defaultVersion: PearlVersion,
	request: HostRequest,
): PearlCalculatorApi {
	const VERSION_CODES: Record<string, number> = {
		Legacy: 0,
		Post1205: 1,
		Post1212: 2,
	};
	const MAX_TICKS = 100000;
	const STRIDE = 6;

	const versionCode = (version: PearlVersion | undefined) => {
		const code = VERSION_CODES[version ?? defaultVersion];
		if (code === undefined) throw new Error(`Unknown version: ${version}`);
		return code;
	};

	const view = (pointer: number, length: number) =>
		new Float64Array(wasm.memory.buffer, pointer, length);

	const tntImpulse = (pearl: Vec3, tnt: Vec3): Vec3 => {
		const values = view(
			wasm.pc_tnt_impulse(pearl.x, pearl.y, pearl.z, tnt.x, tnt.y, tnt.z),
			3,
		);
		return { x: values[0], y: values[1], z: values[2] };
	};

	const flight = (state: PearlState, ticks: number, version?: PearlVersion) => {
		const count = Math.max(0, Math.min(MAX_TICKS, Math.floor(ticks)));
		const { position, motion } = state;
		const pointer = wasm.pc_flight(
			versionCode(version),
			position.x,
			position.y,
			position.z,
			motion.x,
			motion.y,
			motion.z,
			count,
		);
		return view(pointer, (count + 1) * STRIDE);
	};

	const stateAt = (values: Float64Array, tick: number): PearlState => {
		const offset = tick * STRIDE;
		return {
			position: {
				x: values[offset],
				y: values[offset + 1],
				z: values[offset + 2],
			},
			motion: {
				x: values[offset + 3],
				y: values[offset + 4],
				z: values[offset + 5],
			},
		};
	};

	return {
		constants: {
			GRAVITY: 0.03,
			DRAG: 0.99,
			PEARL_HEIGHT: 0.25,
			PEARL_EYE_HEIGHT: 0.85 * 0.25,
			PEARL_RADIUS: 0.125,
			TNT_HALF_WIDTH: 0.49,
			TNT_HEIGHT: 0.98,
			TNT_EXPLOSION_Y_OFFSET: 0.06125,
			TNT_EXPLOSION_RADIUS: 8,
			FLIGHT_STRIDE: STRIDE,
		},
		physics: {
			tntImpulse,
			flight,
			step: (state, version) => stateAt(flight(state, 1, version), 1),
			trace: (state, ticks, version) => {
				const values = flight(state, ticks, version);
				return Array.from({ length: values.length / STRIDE }, (_, tick) =>
					stateAt(values, tick),
				);
			},
		},
		calc: {
			tntAmount: (input) =>
				request("calc.tntAmount", input) as ReturnType<
					PearlCalculatorApi["calc"]["tntAmount"]
				>,
			pearlTrace: (input) =>
				request("calc.pearlTrace", input) as ReturnType<
					PearlCalculatorApi["calc"]["pearlTrace"]
				>,
			rawTrace: (input) =>
				request("calc.rawTrace", input) as ReturnType<
					PearlCalculatorApi["calc"]["rawTrace"]
				>,
		},
		run: {
			solve: (input) =>
				request("run.solve", input) as ReturnType<
					PearlCalculatorApi["run"]["solve"]
				>,
			trace: (input) =>
				request("run.trace", input) as ReturnType<
					PearlCalculatorApi["run"]["trace"]
				>,
			simulate: (input) =>
				request("run.simulate", input) as ReturnType<
					PearlCalculatorApi["run"]["simulate"]
				>,
			bits: (input) =>
				request("run.bits", input) as ReturnType<
					PearlCalculatorApi["run"]["bits"]
				>,
		},
		storage: {
			get: (key) => request("storage.get", { key }) as Promise<never>,
			set: (key, value) =>
				request("storage.set", { key, value }) as Promise<void>,
			remove: (key) => request("storage.remove", { key }) as Promise<void>,
			keys: () => request("storage.keys", null) as Promise<string[]>,
		},
		app: {
			notify: (message, level) =>
				request("app.notify", { message, level }) as Promise<void>,
			navigate: (path) => request("app.navigate", { path }) as Promise<void>,
			setCalculator: (patch) =>
				request("app.setCalculator", patch) as Promise<void>,
		},
		clipboard: {
			write: (text) => request("clipboard.write", { text }) as Promise<void>,
			read: () => request("clipboard.read", null) as Promise<string>,
		},
		files: {
			open: (options) =>
				request("files.open", options ?? {}) as ReturnType<
					PearlCalculatorApi["files"]["open"]
				>,
			save: (text, options) =>
				request("files.save", { text, ...(options ?? {}) }) as Promise<boolean>,
		},
	};
}
