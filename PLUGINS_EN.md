# Plugin Development Guide

[中文](PLUGINS.md)

Plugins let you layer your own calculation protocol on top of PearlCalculatorRS: add standalone tools and pages, put your own UI on the calculator, trace and simulator pages, add result columns or rewrite built-in ones, rewrite copied text, or take over solving, tracing, simulation, Bit calculation and config import/export. Plugins are saved inside config files and take effect when the config is opened; the desktop, web and Android versions run the same plugins.

By default a plugin runs in an isolated sandbox with no network and no access to your other data. A plugin that needs more declares permissions; the app lists each one and its risk when the plugin loads and lets the user decide. See "Permissions and security".

## Quick start

1. In the plugin section at the bottom of the calculator's Config tab, click "Download type definitions (.d.ts)" and put `pearlcalc-plugin.d.ts` next to your plugin.
2. Create `my-plugin.js`:

   ```js
   // @ts-check

   /** @type {import("./pearlcalc-plugin").PluginDefinition} */
   export default {
   	apiVersion: 1,
   	id: "me.hello",
   	name: "Hello",
   	version: "1.0.0",
   	resultColumns: [{ key: "hello", label: "Hello" }],
   	slots: {
   		async solve(input, next) {
   			const results = await next(input);
   			return results.map((row) => ({ ...row, hello: `B${row.blue}/R${row.red}` }));
   		},
   	},
   };
   ```

3. Load your cannon config, open the calculator's Config tab and click "Attach .js" at the bottom, or simply drop the file onto the window. The calculator results get a "Hello" column.
4. Export the config from the config menu. The plugin and its parameters are written into the config JSON. Whenever that config is opened later, the app lists its plugins and asks whether to load them.

A plugin is one ES module whose default export is the plugin definition. No npm or build step is needed; bundle third-party libraries into the file first. VS Code understands `// @ts-check` and the JSDoc type, so you get completion and type checking.

## Runtime

- Each plugin runs in Web Workers inside its own sandboxed iframe. It has no DOM, no Tauri commands and no access to local files; everything else goes through `ctx.pc`, which only works while the app is calling one of the plugin's functions. Calls from background timers are rejected.
- The app validates the plugin definition again, and plugins outside these limits do not load: the id and the keys of tools, panels, fields and columns use letters, digits, `_`, `.` and `-`, up to 64 characters; names and titles up to 80 characters, labels up to 200, descriptions up to 2000; at most 32 tools and 32 panels, 200 fields and 100 columns per group; `digits` is an integer from 0 to 20.
- Each plugin can log at most 50 lines per second; a worker that sends more than 5000 messages in one second is stopped.
- Without network access, `fetch`, `XMLHttpRequest`, `WebSocket` and `EventSource` are unavailable, and the content security policy blocks all connections as well.
- Plugins can run their own wasm modules with `WebAssembly` (embed the bytes as base64).
- Plugins cannot create their own `Worker`s. Use tool shards for parallel work; the app controls the thread count.
- `console.log` and friends go to the log in the plugin's details (expand the plugin by clicking its name in the plugin list at the bottom of the calculator's Config tab).
- The app is portable and stores nothing. Plugins belong to configs: opening a config activates its plugins, and switching to another config switches the plugins too. See "Saved with configs".
- One plugin may run as several instances: slots and the tool functions `plan`/`finalize`/`detail` share one long-lived worker, and every parallel tool thread loads its own copy. Do not rely on module-level variables to share state between calls.

## Plugin definition

| Field | Meaning |
|---|---|
| `apiVersion` | Always `1` |
| `id` | 2–64 characters: letters, digits, `.`, `_`, `-`; `author.name` is a good pattern. Attaching a plugin with the same id replaces the old version and keeps its input values and logs |
| `name`, `version` | Required, shown in the UI. `name` can be localized text |
| `author` | Optional |
| `description` | Optional, can be localized text |
| `permissions` | Optional: `"network"`, `"clipboard-read"`, `"full-access"`. See "Permissions and security" |
| `networkHosts` | Optional; limits network access to these origins. See "Permissions and security" |
| `physics` | Optional; `"custom"` means the plugin changes physics. The app checks that it also takes over `solve`, `trace` and `simulate`, and warns in the plugin's details about the ones it does not |
| `fileTypes` | Optional extra extensions handled by the `importConfig` slot, e.g. `["litematic"]`; they are added to the import dialog and drag-and-drop |
| `settings` | Optional settings fields, shown in the plugin's details and saved with the config on export |
| `calculatorInputs` | Optional fields shown at the bottom of the calculator's General tab |
| `simulatorInputs` | Optional fields shown at the bottom of the simulator's inputs |
| `resultColumns` | Optional columns appended to the calculator results; values come from the same-named field of each result. They can also rewrite or hide built-in columns, see "Columns" |
| `slots` | Optional overrides of built-in features, see "Slots" |
| `tools` | Optional standalone tools, see "Tools" |
| `panels` | Optional plugin UI, see "Panels" |
| `main` | Optional; runs in the app window once `full-access` is granted, see "Full control" |

### Localized text

`name`, `description`, field `label`/`description`/option `label`, column `label`, tool `title`/`description` and panel `title` accept a string or an object keyed by language:

```js
name: { zh: "上炸查找器", en: "Upward blast finder" }
```

The app picks the UI language and falls back to `en`, then `zh`, then the first value. `ctx.locale` holds the current UI language (`"zh"` or `"en"`), so panels and views can switch their own text.

### Fields

`settings`, `calculatorInputs`, `simulatorInputs`, tool `inputs` and the panel `fields` node share one field format:

| `type` | Value | Extra properties |
|---|---|---|
| `number` / `integer` | number | `min`, `max`, `step` |
| `boolean` | boolean | — |
| `text` | string | `multiline` |
| `select` | string | `options: [{ value, label }]` (required) |
| `range` | `[low, high]` | `integer` |
| `vec3` | `{ x, y, z }` | — |

Common properties: `key`, `label` (required), `description` (shown as a tooltip), `required`, `default`, `from`. `default` must match the field type.

`from` takes the default from the current environment. The path starts at `{ config, calculator, version, mode }`, so `from: "config.north_west_tnt.y"` reads the north-west TNT Y of the loaded config and `from: "calculator.destX"` reads the calculator's target X. Once the user edits the field, their value wins.

### Columns

```js
{ key: "dist", label: "Distance", digits: 4, format: "exp", width: 11 }
```

`digits` sets the decimals, `format: "exp"` switches to scientific notation, `width` is a relative width (default 10).

A `resultColumns` entry whose `key` matches a built-in column rewrites it. The built-in keys are `distance`, `ticks`, `blue`, `red`, `vertical` and `total`. You can change `label`, `digits` and `format`, or hide the column with `hidden: true`:

```js
resultColumns: [
	{ key: "ticks", label: "tick", hidden: true },
	{ key: "distance", label: { zh: "水平距离", en: "Horizontal" }, digits: 3 },
]
```

## Context `ctx`

Every plugin function receives `ctx`:

| Property | Meaning |
|---|---|
| `pc` | Host API, see below |
| `locale` | UI language: `"zh"` or `"en"` |
| `version` | Selected game version: `"Legacy"`, `"Post1205"`, `"Post1212"` |
| `mode` | Calculation mode: `"Standard"`, `"Accumulation"`, `"Vector3D"` |
| `config` | Loaded cannon config, or `null` |
| `calculator` | Calculator page inputs (as strings) |
| `settings` | Values of this plugin's `settings` |
| `inputs` | Values of this plugin's `calculatorInputs` |
| `simulatorInputs` | Values of this plugin's `simulatorInputs` |
| `input` | In tool functions, the input of the current run |
| `panel`, `view` | In panel functions, the panel id and the data its mount point provides, see "Panels" |
| `log(...args)` | Write to the plugin log |

## Host API `ctx.pc`

### `pc.physics`

The physics primitives call the app's core directly (the same WebAssembly code the calculator uses). They follow `ctx.version`; the last argument can override it.

- `tntImpulse(pearl, tnt)`: momentum one TNT gives the pearl. `pearl` is the pearl's feet position, `tnt` the TNT entity position (bottom centre).
- `flight(state, ticks, version?)`: collision-free flight from `{ position, motion }`. Returns a `Float64Array` with 6 numbers per tick `[x, y, z, vx, vy, vz]`, tick 0 being the start. Tick `t`'s Y is `values[t * 6 + 1]` and its Y momentum `values[t * 6 + 4]`.
  - The array points straight into core memory and **becomes invalid after the next call to any `pc.physics` function**. Use `.slice()` to keep it.
  - At most 100000 ticks per call.
- `step(state, version?)`: one tick, returns the new `{ position, motion }`.
- `trace(state, ticks, version?)`: array of states per tick (copies data; use `flight` in hot loops).

`pc.constants` exposes the core constants: `GRAVITY`, `DRAG`, `PEARL_HEIGHT`, `PEARL_EYE_HEIGHT`, `PEARL_RADIUS`, `TNT_HALF_WIDTH`, `TNT_HEIGHT`, `TNT_EXPLOSION_Y_OFFSET`, `TNT_EXPLOSION_RADIUS`, `FLIGHT_STRIDE`.

### `pc.calc`

Runs the full built-in calculations, bypassing every plugin slot, and returns Promises. Inputs are kept within the ranges the app itself uses: `maxTicks` up to 10000, `maxDistance` up to 1000, at most 64 `tntGroups`, Bit templates up to 64 sides.

- `tntAmount(input)`: the calculator's TNT solver; same input and output as the `solve` slot.
- `pearlTrace(input)`: pearl trace; same as the `trace` slot.
- `rawTrace(input)`: the simulator's raw trace; same as the `simulate` slot.

### `pc.run`

Runs the whole plugin chain the way a user action does, including slots taken over by other plugins, and ends at the built-in: `solve(input)`, `trace(input)`, `simulate(input)`, `bits(input)`. Use it to get results as other plugins changed them. Calling `pc.run` from a slot enters the chain again; nesting deeper than 8 levels, or more than 8 unfinished `pc.run` calls from one plugin, fails. Inputs are bounded like `pc.calc`, and so are inputs a plugin passes to the built-in through `next`.

### `pc.storage`

The plugin's own data. It is written to `Params.data` when the config is exported and restored when the config is opened:

- `get(key)`, `set(key, value)`, `remove(key)`, `keys()`, all returning Promises.
- Values must be JSON-serializable, and strings must be well-formed Unicode (no lone surrogates). At most 1 MB per plugin; keys up to 200 characters.

The app is portable, so this data lives only in the config file.

### `pc.app`

- `notify(message, level?)`: show a toast titled `Plugin "name" (id)`. `level` is `"info"`, `"success"`, `"warning"` or `"error"`. At most 3 per plugin and 6 across all plugins every 10 seconds; the message is cut at 500 characters. Plugin toasts are not shown while a confirmation dialog is open.
- `navigate(path)`: go to `/`, `/simulator`, `/configuration`, or any tool or page of an enabled plugin.
- `setCalculator(patch)`: change calculator inputs: `pearlX`, `pearlZ`, `destX`, `destY`, `destZ`, `cannonY` (number or string), `planeInterceptY` (boolean), `tickRange`, `distanceRange` (`[low, high]`).

`navigate` and `setCalculator` only work inside a panel `on` handler within 5 seconds of the user's click, see "Permissions and security".

### `pc.clipboard`

- `write(text)`: write to the clipboard; the app shows which plugin did it. Like `navigate`, it only works in a handler right after the user's click.
- `read()`: read the clipboard; needs the `clipboard-read` permission.

### `pc.files`

Every call opens the system file dialog and the user picks the file; only one dialog can be open at a time. They only work inside a panel `on` handler within 5 seconds of the user's click.

- `open({ title?, extensions? })`: read a text file; returns `{ name, text }`, or `null` if the user cancels.
- `save(text, { name?, extensions? })`: save text; returns whether it was saved. Extensions are limited to `txt`, `json`, `csv`, `tsv`, `md`, `log`, `xml`, `yaml`, `yml`, `toml`, `snbt` and `mcfunction`, so a plugin cannot talk users into saving an executable.

## Slots

A slot is middleware: `(input, next, ctx) => output`. A plugin can change the input before calling `next`, post-process what `next` returns, replace the whole step (never calling `next`), or hand back to the built-in conditionally.

```js
slots: {
	solve: async (input, next, ctx) =>
		ctx.settings.custom ? mySolver(input, ctx) : next(input),
}
```

| Slot | Where it runs | Input | Output |
|---|---|---|---|
| `solve` | Calculator "Calculate TNT" | `CalculationInput` | `TNTResult[]` |
| `trace` | Result previews, pearl trace page | `PearlTraceInput` | `PearlTraceResult` |
| `simulate` | Simulator page | `RawTraceInput` | `PearlTraceResult` |
| `bits` | Bit calculation page | `BitsInput` | `BitsResult` |
| `copy` | Copying Bit results, config codes, tool results, a row of the trace table | `{ kind, text, data }` | string |
| `importConfig` | Opening config files (dialog, drop, simulator import) | `{ name, content }` | `ImportedConfiguration` |
| `exportConfig` | Exporting config JSON | config object | config object |

The full types are in `pearlcalc-plugin.d.ts`. Conventions:

- Every result returned by `solve` needs `distance`, `tick`, `blue`, `red`, `total`, `pearl_end_pos`, `pearl_end_motion` and `direction`; extra fields are allowed and can be shown via `resultColumns`.
- `copy` gets `kind` = `"bits"`, `"configCode"`, `"row"` or `"trace"`, the built-in `text`, and the raw `data`. `"trace"` comes from the trace table on the pearl trace and simulator pages: `text` is three space-separated values and `data` is `{ tick, view, x, y, z }`, where `view` is `"trajectory"` (position) or `"momentum"`.
- Embedded plugins are only read from the original bytes of the file the user picked or the config code the user pasted. Any `Plugins` field in the `exportConfig` output is removed. `pc.files.save`, `pc.clipboard.write`, the `copy` slot and tool `copy()` output are rejected whenever they could be read as a config containing plugins (a `Plugins` key anywhere counts, including escaped spellings and text with a BOM) or contain a config-code plugin segment (`#~`). The app appends the plugin segment after the `copy` slot runs, so the `text` the slot sees has no plugins in it. A plugin cannot plant itself or other code into other configs.
- Import, export and config-code copying on the Configuration page (wizard) never pass through plugins. Plugins carried into the wizard are only kept as-is on export and never run there.
- `importConfig` only handles the extensions a plugin declares in `fileTypes`; the app's own `.json` configs never pass through it. Plugins with any permission cannot take over `importConfig`, since it would see other files you open. `name` is just the file name without the path. A custom format is usually converted to this app's config JSON and passed on:

  ```js
  fileTypes: ["mycfg"],
  slots: {
  	importConfig: (input, next) =>
  		input.name.endsWith(".mycfg")
  			? next({ name: input.name, content: JSON.stringify(convert(input.content)) })
  			: next(input),
  },
  ```

- When several plugins take over the same slot, they form a chain in the order they were attached to the config; the first runs first and its `next` enters the next plugin.
- A slot call that takes longer than 120 seconds is treated as hung: the plugin's worker is restarted and the operation fails.
- In the `simulate` slot, `ctx.simulatorInputs` holds the plugin's simulator inputs.

## Tools

Every tool of the current config shows up in the app's left navigation bar. It opens its own page: a form built from `inputs` on the left, a results table on the right, and a detail view per row. For a fully custom page, use a panel with `mount: "page"`.

```js
tools: [{
	id: "search",
	title: "TNT search",
	inputs: [...],
	columns: [...],
	sortBy: ["dist", "v"],
	limit: "outputCount",
	validate(input, ctx) {},
	plan(input, ctx) {},
	runShard(shard, ctx) {},
	finalize(rows, ctx) {},
	detail(row, ctx) {},
	copy(row, ctx) {},
	actions: { name(payload, ctx) {} },
}]
```

Flow:

1. `validate(input)`: return a string to report invalid input; it is shown in the results area.
2. `plan(input)`: split the work into an array of shards. Shards must be structured-cloneable (no functions). Without `plan`, the whole input is the only shard.
3. `runShard(shard, ctx)`: the app processes shards in parallel, one thread per CPU core (up to 16). Call `ctx.emit(row)` to output rows.
4. When all shards are done, `finalize(rows)` receives the final top N and can add expensive fields.
5. Opening a row calls `detail(row)` for its views; the Copy button calls `copy(row)` and then passes the text through the `copy` slot.

The app sorts and deduplicates:

- `sortBy`: sort keys; a string sorts ascending, `{ key, order: "desc" }` descending.
- `limit`: how many rows to keep; a number, or the key of an input field so users choose. Default 100, at most 10000.
- Rows with a `key` field (string or number) are deduplicated by it; only the best-ranked row per key is kept.

`runShard`'s `ctx` also has:

| Property | Meaning |
|---|---|
| `emit(row)` | Output a row. Each thread keeps its own top N and drops rows that do not make it |
| `accepts(partial)` | Pass only the sort keys (e.g. `{ dist, v }`) to learn whether the row would make the top N. Check this before building row objects to save a lot of work |
| `progress(fraction)` | Report shard progress from 0 to 1 |
| `signal.aborted` | The user pressed Stop |

Stop sets `signal.aborted` and terminates the threads 0.4 seconds later. A synchronous long loop cannot receive messages, so checking `signal.aborted` only works in an `async` `runShard` that `await`s inside the loop; synchronous loops are terminated after 0.4 seconds, and rows already emitted are kept. Fine-grained shards (for example one per tick) make progress and stopping more responsive.

## Panels

Panels are the plugin's own UI. They can be mounted here:

| `mount` | Where | `ctx.view` |
|---|---|---|
| `calculator.general` | Bottom of the calculator's General tab | `{}` |
| `calculator.config` | Calculator's Config tab, above the plugin list | `{}` |
| `trace` | Pearl trace page, below the summary | `{ trace, tnt: { blue, red, vertical, direction } }` |
| `simulator.inputs` | Bottom of the simulator's inputs | `{}` |
| `simulator.results` | Below the simulator results | `{ trace }`, `null` before a run |
| `page` | A page of its own in the left navigation bar; `title` is required | `{}` |

```js
panels: [{
	id: "counter",
	mount: "calculator.general",
	title: { zh: "计数器", en: "Counter" },
	state: (ctx) => ({ count: 0 }),
	render: (state, ctx) => ({
		type: "row",
		children: [
			{ type: "text", text: `Clicked ${state.count} times` },
			{ type: "button", label: "+1", on: "add" },
		],
	}),
	on: {
		add: (state, event, ctx) => ({ count: state.count + 1 }),
	},
}]
```

- Plugin code always stays in the sandbox. `render` returns a JSON tree describing the UI, and the app draws it with its own components, so it looks like the rest of the app.
- `state(ctx)` returns the initial state (default `null`). The app keeps the state, so switching pages during a session keeps it. It must be JSON-serializable and at most 1 MB. Use `pc.storage` to keep data across sessions.
- User actions call the same-named function in `on` as `(state, event, ctx)`, where `event` is `{ on, value?, payload? }`. Return the new state, or `undefined` to keep it. The panel renders again afterwards.
- The panel also renders again when app state, UI language, plugin settings or inputs, `pc.storage` data or `ctx.view` change.
- Each call may take up to 30 seconds; the UI tree may have up to 50,000 values (strings and numbers count), 2,000,000 characters and 48 levels, and a `table` shows at most 50,000 cells.
- The plugin's name is always shown above its panel (`name · title` when a `title` is set). If a panel fails to render, the error is shown in its place without affecting the rest of the app.

### UI nodes

Strings and numbers in `children` render as text; `null` and `false` are skipped. `render` may also return an array of nodes.

| `type` | Properties |
|---|---|
| `stack` | `gap`, `children`; vertical |
| `row` | `gap`, `align` (`start`/`center`/`end`/`baseline`/`stretch`), `justify` (`start`/`center`/`end`/`between`), `wrap`, `children` |
| `grid` | `columns` (1–6), `gap`, `children` |
| `section` | `title`, `children` |
| `text` | `text`, `tone`, `size` (`xs`/`sm`/`md`/`lg`/`xl`), `weight` (`normal`/`medium`/`semibold`), `mono`, `align` |
| `badge` | `text`, `tone` |
| `alert` | `text`, `title`, `tone` |
| `metric` | `label`, `value`, `sub`, `tone`; the app's large metric style |
| `kv` | `items: [{ label, value, tone }]` |
| `table` | `columns` (see "Columns"), `rows`, `onRowClick`, `selected` (highlighted row index), `maxHeight` |
| `code` | `text`, `maxHeight` |
| `progress` | `value` (0–1), `label` |
| `separator` | — |
| `button` | `label`, `on`, `payload`, `variant` (`default`/`secondary`/`outline`/`ghost`/`destructive`), `size` (`sm`/`default`), `disabled`, `fill` |
| `fields` | `fields` (see "Fields"), `values`, `on` |
| `trajectory` | `points`, `targetY`, `target`, `view`, `height`; the app's trajectory chart |
| `svg` | `viewBox`, `height`, `title`, `children`, see below |
| `image` | `src`, `alt`, `height`; only base64 `data:image/png`, `jpeg`, `gif`, `webp` or `svg+xml` URLs |
| `html` | `html`, `height`; same rules as the `html` view |

`gap` is 0–12 in steps of 4 pixels. `tone` is `default`, `muted`, `info`, `success`, `warning` or `danger`.

Event contents:

- `button`: `payload` is the button's `payload`.
- `table` `onRowClick`: `value` is the row index, `payload` the row.
- `fields`: `value` holds all validated field values, sent 150 ms after typing stops. What the user is typing is kept until `values` changes. Typing is not a click, so this handler cannot use the click-only APIs.
- `svg` shapes: `payload` is the shape's `payload`.
- `pc.action(name, payload)` inside `html`: `on` is `name`.

`svg` children can be `path` (`d`), `line` (`x1`, `y1`, `x2`, `y2`), `rect` (`x`, `y`, `width`, `height`, `rx`), `circle` (`cx`, `cy`, `r`), `ellipse`, `polyline`/`polygon` (`points: [[x, y], …]`), `text` (`x`, `y`, `text`, `fontSize`, `anchor`) and `g` (`children`). Shared properties are `fill`, `stroke`, `strokeWidth`, `strokeDasharray`, `opacity`, `transform`, plus `on` and `payload` for clicks. Colours can be `#hex`, `rgb()`/`hsl()`, CSS colour names, or the theme colours `foreground`, `muted`, `primary`, `border`, `blue`, `red`, `green`, `amber`.

## Views

`detail(row)` returns an array of views:

```js
[
	{ type: "text", title: "Details", text: "multi-line text" },
	{ type: "kv", title: "Layout", items: [{ label: "TNT", value: "x=21, y=46, z=64 ×4" }] },
	{ type: "trajectory", title: "Trajectory", points: [{ x, y, z }], targetY: 119.85, view: "side" },
	{ type: "html", title: "Custom", html: "<button id=b>Compute</button>", height: 240 },
]
```

- `trajectory` reuses the app's trajectory chart with side and top views; `target: { x, z }` marks a target on the top view.
- `html` renders inside two nested sandboxed iframes. The outer one forbids navigation, so the content cannot carry data out by navigating away. Static `html` is first cleaned with an allowlist: `script`, `link`, `meta`, `base`, `iframe`, `form` and similar elements, link targets and event attributes are removed, and images keep only `data:image` URLs, so DNS prefetching and similar tricks cannot carry data out.
  - Scripts only run in the page for plugins granted full control: `pc.action(name, payload)` calls the same-named function in the tool's `actions` (a panel's `on`) and returns a Promise.
  - For every other plugin, including ones with network access, `html` shows static content and scripts do not run. The Android and Windows WebViews inject the app's internal interface scripts into every iframe on the page, and on Android iframes can call those interfaces directly, so plugin scripts running in an iframe could get around the sandbox; plugin code therefore only runs in workers. Use panels for interactive UI.

## Saved with configs

Plugins belong to the config file. Attach or replace them in the Plugins section at the bottom of the calculator's Config tab (dropping a `.js` file does the same). Like any other config edit, the change is written to the file when you export the config:

```json
{
	"NorthWestTNT": { "X": -0.625, "Y": 256.52, "Z": -0.625 },
	"...": "existing fields",
	"Plugins": [
		{
			"Id": "me.tnt-search",
			"Version": "1.1.0",
			"ApiVersion": 1,
			"Sha256": "9f2c41d0…",
			"Params": {
				"settings": {},
				"calculatorInputs": {},
				"simulatorInputs": {},
				"tools": { "search": { "floorY": 118, "maxY": 40 } },
				"data": { "lastRun": 3 }
			},
			"Source": "export default { … }"
		}
	]
}
```

- `Source` is the plain plugin source, so recipients can read the code.
- `Params` holds the plugin's settings, calculator and simulator inputs, every tool's inputs and its `pc.storage` data; they are filled in when the config is opened. Only values the user changed are exported: defaults taken with `from` (such as the calculator's target coordinates) are never written to the file and are looked up again on the recipient's side. Cannon-specific private constants travel with the config this way.
- Before saving, the app parses the export once more; if it would not open again, export fails instead of writing a broken config.
- `Sha256` is computed by the app; the plugin's details show a warning when the content does not match.
- `Plugins` may live inside the cannon object or at the top level next to `CannonSettings`. Older versions of the app ignore the field and read the config as usual.
- Copying a config code compresses the config's plugins (including ones that are not loaded) and their `Params` into a segment starting with `#~` after the cannon parameters. Pasting such a code asks whether to load the plugins, the same as opening a config with plugins. Older versions of the app only read the cannon parameters at the front. Replacing the current config with a code or config that has no plugins removes the plugins too.

When a config with plugins is opened, the app first lists them and the user picks "Load plugins" or "Don't load"; no plugin code runs before that. Plugins with permissions then ask again individually, see "Permissions and security". Plugins that are not loaded stay in the config, are written back on export, and can be loaded later from the plugin list. If the opened config contains a plugin without permissions that is already loaded in this session, the running instance is kept and only the new `Params` are applied. Plugins with permissions ask again every time a config is opened, so someone else's config cannot borrow permissions you granted earlier.

The source is written into the config in plain text, so everyone who receives the config can read it. Obfuscation or compiling to WebAssembly only makes recovery harder: code that runs on someone's machine can be recovered.

## Permissions and security

Plugins arrive in configs shared by other people, so the app treats every plugin as untrusted:

- Plugins in someone else's config never start on their own. The app lists the config's plugins first and runs their code only after the user clicks "Load plugins".
- A plugin without permissions can only compute inside its own sandbox. It has no network and cannot reach the page, other plugins or local files; everything it does goes through `ctx.pc`, which the app checks call by call.
- A plugin with permissions asks when it loads (opening a config or attaching a `.js`), listing each permission and its risk. Until the user picks "Allow and enable", none of its slots, tools or panels run; its code has only been read once, in a sandbox without network, to get its definition.
- If the user declines, the plugin stays in the config without running. Expand it in the plugin list and click "Review permissions" to decide again.
- Every launch is a fresh instance, so grants only last for the session; opening the config again asks again.
- All checks happen on the app's side, so a plugin cannot raise its own permissions. The whole definition a plugin reports from its sandbox is validated again by the app with the rules above.
- After a confirmation dialog appears or moves to the next plugin, its Allow button needs 0.8 seconds before it can be clicked, so double clicks cannot approve something unseen. If other plugins in the same config have permissions, the dialog lists them: plugins can pass information to each other through features they both take over or data shared in the app, so their permissions should be considered together.
- Only one plugin per id can be loaded at a time. The `Id` a config declares must match the `id` in the plugin's code, otherwise the plugin is not loaded, so the load prompt cannot show a different name from the plugin that runs.
- Each plugin worker checks its sandbox before loading the plugin: it confirms the content security policy is in effect (using a `data:` URL, without touching the network) and refuses to run the plugin otherwise, so a platform where the policy fails never silently opens the network.
- Navigating, changing calculator inputs, writing the clipboard and opening or saving files only work inside the handler of the user's click on the plugin's UI. Automatic `render` calls, slots and tools cannot do them, so a plugin cannot lock up or spam the UI.
- The app stores nothing; closing and reopening it starts clean, and plugins leave no trace.

| Permission | Allows | Risk |
|---|---|---|
| `network` | Network access, optionally limited to `networkHosts` | Can send your config, inputs and results to external servers |
| `clipboard-read` | `pc.clipboard.read()` | Can read anything the user copied |
| `full-access` | The plugin's `main()` runs directly in the app window without a sandbox; includes both permissions above | Can read and change everything in the app, see below |

`networkHosts` entries look like `scheme://host[:port]` with `http`, `https`, `ws` or `wss`. Only exact host names are accepted, no `*.` wildcards: anyone can register a subdomain under shared hosting suffixes such as `*.workers.dev` or `*.github.io`, so a wildcard would turn a seemingly narrow grant into access to anyone's server.

```js
permissions: ["network"],
networkHosts: ["https://api.example.com", "wss://live.example.org"],
```

The consent dialog shows these origins to the user, and the sandbox only lets connections to them through. Without `networkHosts` the plugin may connect anywhere.

### Full control

```js
permissions: ["full-access"],
main(host) {
	const unmount = host.mount("calculator.general", (element, view) => {
		element.textContent = "From the app window";
		return () => element.replaceChildren();
	});
	return () => unmount();
},
```

`main(host)` runs in the app window after the user allows it and can work with the page directly. `host` provides:

- `pc`: same as `ctx.pc`.
- `context()`: the current `locale`, `version`, `mode`, `config`, `calculator`, `settings`, `inputs` and `simulatorInputs`.
- `onContextChange(listener)`: called when those values change; returns an unsubscribe function.
- `mount(point, render)`: places an empty element at a panel mount point for you to render into. `render(element, view)` may return a cleanup function; `mount` returns an unmount function.
- `log(...args)`: write to the plugin log.

`main` may return a cleanup function, called when the plugin is removed or the config changes. Code in the app window cannot be force-unloaded, so stopping it completely needs a restart; the consent dialog tells the user so.

Full control hands the whole app to the plugin. Only ask for it when nothing else works. The user has to tick "I understand the risk" before allowing it.

### Risks that cannot be removed

- **Hanging the app**: a plugin can burn CPU or memory inside its sandbox and slow down or crash the app. Slots and panels time out and restart the plugin's worker, calculation inputs handed to the app are bounded, and logs and messages are rate-limited, but browsers cannot stop a memory blow-up in advance. If a config does this, restart the app and don't open it again, or pick "Don't load" in the load prompt.
- **Leaking data through sharing**: a plugin can read the config and calculator inputs (including target coordinates) and hide them in `pc.storage`, the `exportConfig` output or copied text, so they leave when the user shares the config or text. The plugin list shows how much data each plugin stores and can clear it; plugins taking over `exportConfig` or `copy` are listed under the features they take over.
- **Misleading text**: panels can show any text, for example something posing as the app. Plugin UI is always labelled with the plugin's name, and the app's own confirmations only appear as dialogs.
- **Unverifiable origin**: `Sha256` lives in the same file, so it only catches accidental corruption and says nothing about the author. Only open configs from sources you trust.

## Debugging

- Attach the edited file again (or drop it again); the old version with the same id is replaced and input values, settings, `pc.storage` data and logs are kept. Plugins with permissions ask again.
- Panel errors are shown in place of the panel and written to the log.
- Stack traces and `console` output are in the log in the plugin's details.
- Slot errors name the plugin and the slot that failed.

## A note on physics constants

`pc.physics` uses the same core constants as the calculator (drag 0.99, pearl eye height 0.2125, TNT explosion offset 0.06125). The game uses float-derived values: drag `(double)0.99f`, eye height `(double)(0.25f*0.85f)`, explosion point `y + (double)0.98f*0.0625`. The two differ around 1e-8. Plugins that need bit-exact vanilla behaviour can implement that part in JS themselves.
