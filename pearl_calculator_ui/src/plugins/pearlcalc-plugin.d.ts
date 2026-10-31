export type PearlVersion = "Legacy" | "Post1205" | "Post1212";
export type CannonMode = "Standard" | "Accumulation" | "Vector3D";
export type Permission = "network" | "clipboard-read" | "full-access";
export type Locale = "zh" | "en";
export type Text = string | { [locale: string]: string };

export interface Vec3 {
	x: number;
	y: number;
	z: number;
}

export interface PearlState {
	position: Vec3;
	motion: Vec3;
}

export interface Point3 {
	X: number;
	Y: number;
	Z: number;
}

export interface CannonConfig {
	max_tnt: number;
	north_west_tnt: Vec3;
	north_east_tnt: Vec3;
	south_west_tnt: Vec3;
	south_east_tnt: Vec3;
	pearl_x_position: number;
	pearl_y_position: number;
	pearl_z_position: number;
	pearl_x_motion: number;
	pearl_y_motion: number;
	pearl_z_motion: number;
	default_red_tnt_position: string;
	default_blue_tnt_position: string;
	vertical_tnt?: Vec3;
	max_vertical_tnt?: number;
	mode?: CannonMode;
}

export interface CalculatorFields {
	pearlX: string;
	pearlZ: string;
	destX: string;
	destY?: string;
	destZ: string;
	cannonY: string;
	planeInterceptY: boolean;
	tickRange: number[];
	distanceRange: number[];
}

export interface CalculationInput {
	pearlX: number;
	pearlY: number;
	pearlZ: number;
	pearlMotionX: number;
	pearlMotionY: number;
	pearlMotionZ: number;
	cannonY: number;
	northWestTnt: Vec3;
	northEastTnt: Vec3;
	southWestTnt: Vec3;
	southEastTnt: Vec3;
	defaultRedDirection: string;
	defaultBlueDirection: string;
	destinationX: number;
	destinationY?: number;
	destinationZ: number;
	maxTnt: number;
	maxVerticalTnt?: number;
	maxTicks: number;
	maxDistance: number;
	version: PearlVersion;
	verticalTnt?: Vec3;
	mode?: string;
	planeInterceptY?: boolean;
}

export interface TNTResult {
	distance: number;
	tick: number;
	blue: number;
	red: number;
	vertical?: number;
	total: number;
	yaw?: number;
	pitch?: number;
	pearl_end_pos: Point3;
	pearl_end_motion: Point3;
	direction: string;
	[extra: string]: unknown;
}

export interface PearlTraceInput {
	redTnt: number;
	blueTnt: number;
	verticalTntAmount?: number;
	pearlX: number;
	pearlY: number;
	pearlZ: number;
	pearlMotionX: number;
	pearlMotionY: number;
	pearlMotionZ: number;
	cannonY: number;
	northWestTnt: Vec3;
	northEastTnt: Vec3;
	southWestTnt: Vec3;
	southEastTnt: Vec3;
	defaultRedDirection: string;
	defaultBlueDirection: string;
	destinationX: number;
	destinationY?: number;
	destinationZ: number;
	direction?: string;
	version: PearlVersion;
	verticalTnt?: Vec3;
	mode?: string;
	maxTicks?: number;
	planeInterceptY?: boolean;
}

export interface RawTraceInput {
	pearlX: number;
	pearlY: number;
	pearlZ: number;
	pearlMotionX: number;
	pearlMotionY: number;
	pearlMotionZ: number;
	tntGroups: { x: number; y: number; z: number; amount: number }[];
	version: PearlVersion;
}

export interface PearlTraceResult {
	landing_position: Point3;
	pearl_trace: Point3[];
	pearl_motion_trace: Point3[];
	is_successful: boolean;
	tick: number;
	final_motion: Point3;
	distance: number;
	closest_approach?: { tick: number; point: Point3; distance: number } | null;
	[extra: string]: unknown;
}

export interface BitTemplateState {
	sideCount: number;
	masks: { bits: [string, string]; direction: string }[];
	sideValues: string[];
	isSwapped: boolean;
}

export interface MultiplierTemplateState {
	sideCount: number;
	sideValues: string[];
	multiplier: number;
	isSwapped: boolean;
}

export interface BitsInput {
	template: BitTemplateState;
	multiplier: MultiplierTemplateState | null;
	tnt: { blue: number; red: number; vertical?: number };
	direction: string;
	mode: CannonMode;
}

export interface BitsResult {
	standard: { blue: number[]; red: number[]; direction: [boolean, boolean] };
	multiplier: { blue: number[]; red: number[] };
}

export interface CopyInput {
	kind: "bits" | "row" | "configCode" | "trace";
	text: string;
	data: unknown;
}

export interface ImportInput {
	name: string;
	content: string;
}

export interface ImportedConfiguration {
	config: CannonConfig;
	bitTemplate: unknown;
	multiplierTemplate: unknown;
	path: string;
	plugins: unknown[];
}

export type FieldValue = number | boolean | string | [number, number] | Vec3;
export type InputValues = Record<string, FieldValue | undefined>;

interface FieldBase {
	key: string;
	label: Text;
	description?: Text;
	required?: boolean;
	from?: string;
}

export interface NumberField extends FieldBase {
	type: "number" | "integer";
	default?: number;
	min?: number;
	max?: number;
	step?: number;
}

export interface BooleanField extends FieldBase {
	type: "boolean";
	default?: boolean;
}

export interface TextField extends FieldBase {
	type: "text";
	default?: string;
	multiline?: boolean;
}

export interface SelectField extends FieldBase {
	type: "select";
	options: { value: string; label: Text }[];
	default?: string;
}

export interface RangeField extends FieldBase {
	type: "range";
	default?: [number, number];
	integer?: boolean;
}

export interface Vec3Field extends FieldBase {
	type: "vec3";
	default?: Vec3;
}

export type InputField =
	| NumberField
	| BooleanField
	| TextField
	| SelectField
	| RangeField
	| Vec3Field;

export interface Column {
	key: string;
	label: Text;
	digits?: number;
	format?: "fixed" | "exp";
	width?: number;
	hidden?: boolean;
}

export type SortKey = string | { key: string; order?: "asc" | "desc" };

export type View =
	| { type: "text"; title?: string; text: string }
	| {
			type: "kv";
			title?: string;
			items: { label: string; value: string | number }[];
	  }
	| {
			type: "trajectory";
			title?: string;
			points: Vec3[];
			targetY?: number;
			target?: { x: number; z: number };
			view?: "side" | "top";
	  }
	| { type: "html"; title?: string; html: string; height?: number };

export interface PhysicsConstants {
	GRAVITY: number;
	DRAG: number;
	PEARL_HEIGHT: number;
	PEARL_EYE_HEIGHT: number;
	PEARL_RADIUS: number;
	TNT_HALF_WIDTH: number;
	TNT_HEIGHT: number;
	TNT_EXPLOSION_Y_OFFSET: number;
	TNT_EXPLOSION_RADIUS: number;
	FLIGHT_STRIDE: 6;
}

export interface Physics {
	tntImpulse(pearl: Vec3, tnt: Vec3): Vec3;
	flight(
		state: PearlState,
		ticks: number,
		version?: PearlVersion,
	): Float64Array;
	step(state: PearlState, version?: PearlVersion): PearlState;
	trace(state: PearlState, ticks: number, version?: PearlVersion): PearlState[];
}

export interface Calc {
	tntAmount(input: CalculationInput): Promise<TNTResult[]>;
	pearlTrace(input: PearlTraceInput): Promise<PearlTraceResult>;
	rawTrace(input: RawTraceInput): Promise<PearlTraceResult>;
}

export interface Run {
	solve(input: CalculationInput): Promise<TNTResult[]>;
	trace(input: PearlTraceInput): Promise<PearlTraceResult>;
	simulate(input: RawTraceInput): Promise<PearlTraceResult>;
	bits(input: BitsInput): Promise<BitsResult>;
}

export type JsonValue =
	| null
	| boolean
	| number
	| string
	| JsonValue[]
	| { [key: string]: JsonValue };

export interface Storage {
	get<T = JsonValue>(key: string): Promise<T | undefined>;
	set(key: string, value: JsonValue): Promise<void>;
	remove(key: string): Promise<void>;
	keys(): Promise<string[]>;
}

export type NoticeLevel = "info" | "success" | "warning" | "error";

export interface CalculatorPatch {
	pearlX?: string | number;
	pearlZ?: string | number;
	destX?: string | number;
	destY?: string | number;
	destZ?: string | number;
	cannonY?: string | number;
	planeInterceptY?: boolean;
	tickRange?: [number, number];
	distanceRange?: [number, number];
}

export interface App {
	notify(message: string, level?: NoticeLevel): Promise<void>;
	navigate(path: string): Promise<void>;
	setCalculator(patch: CalculatorPatch): Promise<void>;
}

export interface Clipboard {
	write(text: string): Promise<void>;
	read(): Promise<string>;
}

export interface OpenFileOptions {
	title?: string;
	extensions?: string[];
}

export interface SaveFileOptions {
	name?: string;
	extensions?: string[];
}

export interface Files {
	open(
		options?: OpenFileOptions,
	): Promise<{ name: string; text: string } | null>;
	save(text: string, options?: SaveFileOptions): Promise<boolean>;
}

export interface PearlCalculatorApi {
	constants: PhysicsConstants;
	physics: Physics;
	calc: Calc;
	run: Run;
	storage: Storage;
	app: App;
	clipboard: Clipboard;
	files: Files;
}

export interface HostContext {
	pc: PearlCalculatorApi;
	locale: Locale;
	version: PearlVersion;
	mode: CannonMode;
	config: CannonConfig | null;
	calculator: CalculatorFields;
	settings: InputValues;
	inputs: InputValues;
	simulatorInputs: InputValues;
	log(...args: unknown[]): void;
}

export interface ToolContext extends HostContext {
	input: InputValues;
}

export interface Signal {
	readonly aborted: boolean;
}

export interface ShardContext<Row> extends ToolContext {
	emit(row: Row): void;
	accepts(row: Partial<Row>): boolean;
	progress(fraction: number): void;
	signal: Signal;
}

export type Awaitable<T> = T | Promise<T>;

export interface ToolDefinition<
	Shard = InputValues,
	Row extends Record<string, unknown> = Record<string, unknown>,
> {
	id: string;
	title: Text;
	description?: Text;
	inputs: InputField[];
	columns: Column[];
	sortBy?: SortKey[];
	limit?: number | string;
	validate?(
		input: InputValues,
		ctx: ToolContext,
	): Awaitable<string | undefined>;
	plan?(input: InputValues, ctx: ToolContext): Awaitable<Shard[]>;
	runShard(shard: Shard, ctx: ShardContext<Row>): Awaitable<void>;
	finalize?(rows: Row[], ctx: ToolContext): Awaitable<Row[]>;
	detail?(row: Row, ctx: ToolContext): Awaitable<View[]>;
	copy?(row: Row, ctx: ToolContext): Awaitable<string>;
	actions?: Record<string, (payload: unknown, ctx: ToolContext) => unknown>;
}

export type Tone =
	| "default"
	| "muted"
	| "info"
	| "success"
	| "warning"
	| "danger";

export type Paint =
	| "foreground"
	| "muted"
	| "primary"
	| "border"
	| "blue"
	| "red"
	| "green"
	| "amber"
	| (string & {});

export interface SvgStyle {
	fill?: Paint;
	stroke?: Paint;
	strokeWidth?: number;
	strokeDasharray?: string;
	opacity?: number;
	transform?: string;
	on?: string;
	payload?: JsonValue;
}

export type SvgNode =
	| ({ type: "path"; d: string } & SvgStyle)
	| ({
			type: "line";
			x1: number;
			y1: number;
			x2: number;
			y2: number;
	  } & SvgStyle)
	| ({
			type: "rect";
			x: number;
			y: number;
			width: number;
			height: number;
			rx?: number;
	  } & SvgStyle)
	| ({ type: "circle"; cx: number; cy: number; r: number } & SvgStyle)
	| ({
			type: "ellipse";
			cx: number;
			cy: number;
			rx: number;
			ry: number;
	  } & SvgStyle)
	| ({ type: "polyline" | "polygon"; points: [number, number][] } & SvgStyle)
	| ({
			type: "text";
			x: number;
			y: number;
			text: string | number;
			fontSize?: number;
			anchor?: "start" | "middle" | "end";
	  } & SvgStyle)
	| ({ type: "g"; children: SvgNode[] } & SvgStyle);

export type UIChild = UINode | string | number | null | undefined | false;

export type UINode =
	| { type: "stack"; gap?: number; children: UIChild[] }
	| {
			type: "row";
			gap?: number;
			align?: "start" | "center" | "end" | "baseline" | "stretch";
			justify?: "start" | "center" | "end" | "between";
			wrap?: boolean;
			children: UIChild[];
	  }
	| { type: "grid"; columns?: number; gap?: number; children: UIChild[] }
	| { type: "section"; title?: string; children: UIChild[] }
	| {
			type: "text";
			text: string | number;
			tone?: Tone;
			size?: "xs" | "sm" | "md" | "lg" | "xl";
			weight?: "normal" | "medium" | "semibold";
			mono?: boolean;
			align?: "left" | "center" | "right";
	  }
	| { type: "badge"; text: string | number; tone?: Tone }
	| {
			type: "alert";
			text: string;
			title?: string;
			tone?: Tone;
	  }
	| {
			type: "metric";
			label: string;
			value: string | number;
			sub?: string;
			tone?: Tone;
	  }
	| {
			type: "kv";
			items: { label: string; value: string | number; tone?: Tone }[];
	  }
	| {
			type: "table";
			columns: Column[];
			rows: Record<string, unknown>[];
			onRowClick?: string;
			selected?: number;
			maxHeight?: number;
	  }
	| { type: "code"; text: string; maxHeight?: number }
	| { type: "progress"; value: number; label?: string }
	| { type: "separator" }
	| {
			type: "button";
			label: string;
			on: string;
			payload?: JsonValue;
			variant?: "default" | "secondary" | "outline" | "ghost" | "destructive";
			size?: "sm" | "default";
			disabled?: boolean;
			fill?: boolean;
	  }
	| { type: "fields"; fields: InputField[]; values?: InputValues; on: string }
	| {
			type: "trajectory";
			points: Vec3[];
			targetY?: number;
			target?: { x: number; z: number };
			view?: "side" | "top";
			height?: number;
	  }
	| {
			type: "svg";
			viewBox: string;
			height?: number;
			title?: string;
			children: SvgNode[];
	  }
	| { type: "image"; src: string; alt?: string; height?: number }
	| { type: "html"; html: string; height?: number };

export interface UIEvent {
	on: string;
	value?: unknown;
	payload?: JsonValue;
}

export type PanelMount =
	| "calculator.general"
	| "calculator.config"
	| "trace"
	| "simulator.inputs"
	| "simulator.results"
	| "page";

export interface PanelView {
	trace?: PearlTraceResult | null;
	tnt?: { blue: number; red: number; vertical?: number; direction: string };
}

export interface PanelContext extends HostContext {
	panel: string;
	view: PanelView;
}

export interface PanelDefinition<State = JsonValue> {
	id: string;
	mount: PanelMount;
	title?: Text;
	state?(ctx: PanelContext): Awaitable<State>;
	render(state: State, ctx: PanelContext): Awaitable<UIChild | UIChild[]>;
	on?: Record<string, PanelHandler<State>>;
}

export type PanelHandler<State> = {
	handle(state: State, event: UIEvent, ctx: PanelContext): unknown;
}["handle"];

export type MountPoint = PanelMount;

export interface MainContext {
	locale: Locale;
	version: PearlVersion;
	mode: CannonMode;
	config: CannonConfig | null;
	calculator: CalculatorFields;
	settings: InputValues;
	inputs: InputValues;
	simulatorInputs: InputValues;
}

export interface MainHost {
	pc: PearlCalculatorApi;
	context(): MainContext;
	onContextChange(listener: (ctx: MainContext) => void): () => void;
	mount(
		point: MountPoint,
		render: (element: HTMLElement, view: PanelView) => unknown,
	): () => void;
	log(...args: unknown[]): void;
}

export type Next<I, O> = (input: I) => Promise<O>;
export type Slot<I, O> = (
	input: I,
	next: Next<I, O>,
	ctx: HostContext,
) => Awaitable<O>;

export interface Slots {
	solve?: Slot<CalculationInput, TNTResult[]>;
	trace?: Slot<PearlTraceInput, PearlTraceResult>;
	simulate?: Slot<RawTraceInput, PearlTraceResult>;
	bits?: Slot<BitsInput, BitsResult>;
	copy?: Slot<CopyInput, string>;
	importConfig?: Slot<ImportInput, ImportedConfiguration>;
	exportConfig?: Slot<Record<string, unknown>, Record<string, unknown>>;
}

export type SlotName = keyof Slots;

export interface PluginDefinition {
	apiVersion: 1;
	id: string;
	name: Text;
	version: string;
	author?: string;
	description?: Text;
	permissions?: Permission[];
	networkHosts?: string[];
	physics?: "custom";
	fileTypes?: string[];
	settings?: InputField[];
	calculatorInputs?: InputField[];
	simulatorInputs?: InputField[];
	resultColumns?: Column[];
	slots?: Slots;
	tools?: ToolDefinition<unknown, Record<string, unknown>>[];
	panels?: PanelDefinition[];
	main?(host: MainHost): unknown;
}
