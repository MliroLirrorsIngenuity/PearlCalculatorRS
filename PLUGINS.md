# 插件开发指南

[English](PLUGINS_EN.md)

插件让你在 PearlCalculatorRS 上叠加自己的计算协议：新增独立的计算工具和页面，在计算页、轨迹页、模拟页里放自己的界面，给计算结果加列或改写内置列，改写复制出去的文本，或者整段接管求解、轨迹、模拟、Bit 计算和配置导入导出。插件保存在配置文件里，打开配置就生效；桌面版、网页版和安卓版用的是同一套插件。

插件默认运行在隔离的沙箱里，不能联网，也碰不到你的其他数据。需要更多能力时插件要声明权限，软件在加载时逐项列出风险，由用户决定是否启用，见「权限与安全」。

## 快速开始

1. 在软件计算页「配置」标签底部的插件区点「下载类型定义（.d.ts）」，得到 `pearlcalc-plugin.d.ts`，和你的插件放在同一目录。
2. 新建 `my-plugin.js`：

   ```js
   // @ts-check

   /** @type {import("./pearlcalc-plugin").PluginDefinition} */
   export default {
   	apiVersion: 1,
   	id: "me.hello",
   	name: "Hello",
   	version: "1.0.0",
   	resultColumns: [{ key: "hello", label: "问候" }],
   	slots: {
   		async solve(input, next) {
   			const results = await next(input);
   			return results.map((row) => ({ ...row, hello: `蓝${row.blue}/红${row.red}` }));
   		},
   	},
   };
   ```

3. 在软件里载入你的炮配置，到计算页「配置」标签底部点「附加 .js」，或者直接把文件拖进窗口。计算页的结果表会多出「问候」一列。
4. 从配置菜单导出配置。插件和它的参数一起写进配置 JSON。以后打开这份配置时，软件会先列出插件、问你是否加载。

插件是一个 ES 模块，`export default` 一个插件定义对象。不需要 npm，也不需要构建；要用第三方库，请先打包成单个文件。VS Code 识别 `// @ts-check` 和 JSDoc 类型，写的时候有补全和类型检查。

## 运行环境

- 每个插件运行在自己独立的沙箱 iframe 里的 Web Worker 中。它碰不到页面 DOM，调不到 Tauri 命令，也读不到本地文件；需要的能力都通过 `ctx.pc` 向软件申请，而且只能在软件调用插件函数期间使用，后台定时器里调用会被拒绝。
- 插件定义由软件再校验一遍，超出下面这些限制的插件无法加载：id 和工具、面板、字段、列的 key 只能用字母、数字、`_`、`.`、`-`，最长 64 位；名称、标题最长 80 字，标签最长 200 字，说明最长 2000 字；最多 32 个工具、32 个面板，每组字段最多 200 个，每组列最多 100 个，`digits` 为 0–20 的整数。
- 日志每个插件每秒最多 50 条；一秒内向软件发送超过 5000 条消息的 Worker 会被停止。
- 没有获得联网权限时，`fetch`、`XMLHttpRequest`、`WebSocket`、`EventSource` 都不可用，内容安全策略同时拦截所有网络连接。
- 插件可以用 `WebAssembly` 运行自带的 wasm 模块（把字节以 base64 写在源码里）。
- 插件不能自己创建 `Worker`。需要并行计算请用工具的分片，线程数由软件控制。
- `console.log` 等输出显示在插件详情的「日志」里（计算页「配置」标签底部的插件列表，点插件名展开）。
- 软件是便携的，不保存任何状态。插件属于配置：打开配置时它附带的插件生效，换成另一份配置时插件也随之更换，见「随配置保存」。
- 同一个插件可能同时有多个实例：槽和工具的 `plan`/`finalize`/`detail` 在一个常驻 Worker 里运行，工具的每个并行线程各自加载一份插件。不要依赖模块级变量在不同调用之间共享状态。

## 插件定义

| 字段 | 说明 |
|---|---|
| `apiVersion` | 固定为 `1` |
| `id` | 2–64 位，字母、数字、`.`、`_`、`-`，建议用 `作者.名字`。再次附加同 id 的插件会替换旧版本，并保留输入值和日志 |
| `name`、`version` | 必填，显示在界面上。`name` 可以写成多语言文字 |
| `author` | 可选 |
| `description` | 可选，可以写成多语言文字 |
| `permissions` | 可选，`"network"`、`"clipboard-read"`、`"full-access"`，见「权限与安全」 |
| `networkHosts` | 可选，把联网权限限定在这些地址，见「权限与安全」 |
| `physics` | 可选，填 `"custom"` 表示插件改了物理。软件会检查它是否同时接管了 `solve`、`trace`、`simulate`，没接管的会在插件详情里提示 |
| `fileTypes` | 可选，`importConfig` 槽能处理的额外扩展名，例如 `["litematic"]`。这些扩展名会加入导入对话框和拖放 |
| `settings` | 可选，插件设置字段，显示在插件详情里，导出配置时一并保存 |
| `calculatorInputs` | 可选，显示在计算页「常规」标签底部的输入字段 |
| `simulatorInputs` | 可选，显示在模拟页输入区底部的输入字段 |
| `resultColumns` | 可选，计算页结果表追加的列，值取自每条结果的同名字段；也可以改写或隐藏内置列，见「列」 |
| `slots` | 可选，接管内置功能，见「槽」 |
| `tools` | 可选，独立的计算工具，见「工具」 |
| `panels` | 可选，插件自己的界面，见「面板」 |
| `main` | 可选，获得 `full-access` 权限后在主窗口运行，见「完全控制」 |

### 多语言文字

`name`、`description`、字段的 `label`/`description`/选项 `label`、列的 `label`、工具的 `title`/`description`、面板的 `title` 既可以写字符串，也可以写成按语言区分的对象：

```js
name: { zh: "上炸查找器", en: "Upward blast finder" }
```

软件按界面语言取值，缺失时依次退回 `en`、`zh`、第一个值。插件函数里的 `ctx.locale` 是当前界面语言（`"zh"` 或 `"en"`），面板和视图里的文字可以据此切换。

### 字段

`settings`、`calculatorInputs`、`simulatorInputs`、工具的 `inputs` 和面板的 `fields` 节点用同一种字段描述：

| `type` | 值 | 额外属性 |
|---|---|---|
| `number` / `integer` | 数字 | `min`、`max`、`step` |
| `boolean` | 布尔 | — |
| `text` | 字符串 | `multiline` |
| `select` | 字符串 | `options: [{ value, label }]`（必填） |
| `range` | `[下限, 上限]` | `integer` |
| `vec3` | `{ x, y, z }` | — |

通用属性：`key`、`label`（必填），`description`（显示为提示），`required`，`default`，`from`。`default` 的类型必须和字段类型一致。

`from` 让字段默认取当前环境的值，路径从下面这个对象开始：

```
{ config, calculator, version, mode }
```

例如 `from: "config.north_west_tnt.y"` 取当前配置西北 TNT 的 Y，`from: "calculator.destX"` 取计算页填的目标 X。用户改过字段后就以用户的值为准。

### 列

```js
{ key: "dist", label: "距离差", digits: 4, format: "exp", width: 11 }
```

`digits` 控制小数位，`format: "exp"` 改用科学计数法，`width` 是相对宽度（默认 10）。

`resultColumns` 里 `key` 与内置列相同的条目会改写内置列，内置列的 key 是 `distance`、`ticks`、`blue`、`red`、`vertical`、`total`。可以换 `label`、`digits`、`format`，写 `hidden: true` 则隐藏该列：

```js
resultColumns: [
	{ key: "ticks", label: "tick", hidden: true },
	{ key: "distance", label: { zh: "水平距离", en: "Horizontal" }, digits: 3 },
]
```

## 上下文 `ctx`

所有插件函数都会收到 `ctx`：

| 属性 | 说明 |
|---|---|
| `pc` | 宿主 API，见下节 |
| `locale` | 界面语言：`"zh"` 或 `"en"` |
| `version` | 当前选择的游戏版本：`"Legacy"`、`"Post1205"`、`"Post1212"` |
| `mode` | 计算模式：`"Standard"`、`"Accumulation"`、`"Vector3D"` |
| `config` | 当前炮配置（没有加载配置时为 `null`） |
| `calculator` | 计算页的输入（字符串形式） |
| `settings` | 本插件 `settings` 的值 |
| `inputs` | 本插件 `calculatorInputs` 的值 |
| `simulatorInputs` | 本插件 `simulatorInputs` 的值 |
| `input` | 工具函数里是本次运行的输入 |
| `panel`、`view` | 面板函数里是面板 id 和挂载位置提供的数据，见「面板」 |
| `log(...args)` | 写插件日志 |

## 宿主 API `ctx.pc`

### `pc.physics`

物理原语直接调用软件内核（与计算页同一份 WebAssembly 代码），按 `ctx.version` 选择版本，也可以在最后一个参数传入版本。

- `tntImpulse(pearl, tnt)`：一颗 TNT 给珍珠的动量。`pearl` 是珍珠脚底坐标，`tnt` 是 TNT 实体坐标（底部中心）。
- `flight(state, ticks, version?)`：从 `{ position, motion }` 开始无碰撞飞行 `ticks` 刻，返回 `Float64Array`，每刻 6 个数 `[x, y, z, vx, vy, vz]`，第 0 刻是初始状态。第 `t` 刻的 Y 在 `values[t * 6 + 1]`，Y 动量在 `values[t * 6 + 4]`。
  - 返回值直接指向内核内存，**下一次调用任何 `pc.physics` 函数后就失效**，需要保留请 `.slice()`。
  - 单次最多 100000 刻。
- `step(state, version?)`：飞行一刻，返回新的 `{ position, motion }`。
- `trace(state, ticks, version?)`：返回每刻状态的数组（会复制数据，热循环里用 `flight`）。

`pc.constants` 提供内核使用的常量：`GRAVITY`、`DRAG`、`PEARL_HEIGHT`、`PEARL_EYE_HEIGHT`、`PEARL_RADIUS`、`TNT_HALF_WIDTH`、`TNT_HEIGHT`、`TNT_EXPLOSION_Y_OFFSET`、`TNT_EXPLOSION_RADIUS`、`FLIGHT_STRIDE`。

### `pc.calc`

调用内置的完整计算（不经过任何插件的槽），返回 Promise。输入会被限制在软件自身使用的范围内：`maxTicks` 最多 10000，`maxDistance` 最多 1000，`tntGroups` 最多 64 组，Bit 模板最多 64 位。

- `tntAmount(input)`：计算页的 TNT 求解，输入输出与 `solve` 槽相同。
- `pearlTrace(input)`：珍珠轨迹，输入输出与 `trace` 槽相同。
- `rawTrace(input)`：模拟页的原始轨迹，输入输出与 `simulate` 槽相同。

### `pc.run`

和用户在界面上操作一样走完整条插件链（包括其他插件接管的槽），最后才到内置实现：`solve(input)`、`trace(input)`、`simulate(input)`、`bits(input)`。想拿到被其他插件改过的结果就用它。在槽里调用 `pc.run` 会再次进入槽链，嵌套超过 8 层或同一插件同时有超过 8 个 `pc.run` 未完成时报错。输入范围限制同 `pc.calc`；插件通过 `next` 传给内置实现的输入也一样受限。

### `pc.storage`

插件自己的数据，导出配置时写进 `Params.data`，打开配置时恢复：

- `get(key)`、`set(key, value)`、`remove(key)`、`keys()`，都返回 Promise。
- 值必须能转成 JSON，字符串必须是完整的 Unicode 文本（不能含单独的代理字符）。每个插件合计最多 1 MB，key 最长 200 个字符。

软件是便携的，这份数据只随配置文件保存。

### `pc.app`

- `notify(message, level?)`：弹出提示，标题固定写着「插件「名称」（id）」，`level` 为 `"info"`、`"success"`、`"warning"`、`"error"`。每个插件 10 秒内最多 3 条，所有插件合计最多 6 条，正文最长 500 字；有确认框打开时插件的提示不会显示。
- `navigate(path)`：跳到 `/`、`/simulator`、`/configuration`，或任意已启用插件的工具和页面。
- `setCalculator(patch)`：修改计算页的输入，可用字段：`pearlX`、`pearlZ`、`destX`、`destY`、`destZ`、`cannonY`（数字或字符串）、`planeInterceptY`（布尔）、`tickRange`、`distanceRange`（`[下限, 上限]`）。

`navigate` 和 `setCalculator` 只能在面板的 `on` 事件函数里调用，而且必须在用户点击后 5 秒内，见「权限与安全」。

### `pc.clipboard`

- `write(text)`：写入剪贴板，软件会提示是哪个插件写入的。和 `navigate` 一样只能在用户点击后的事件函数里调用。
- `read()`：读取剪贴板，需要 `clipboard-read` 权限。

### `pc.files`

每次都会弹出系统文件对话框，由用户选择文件；同一时间只能开一个。只能在面板的 `on` 事件函数里、用户点击后 5 秒内调用。

- `open({ title?, extensions? })`：读入一个文本文件，返回 `{ name, text }`，用户取消时返回 `null`。
- `save(text, { name?, extensions? })`：保存文本，返回是否保存成功。扩展名限于 `txt`、`json`、`csv`、`tsv`、`md`、`log`、`xml`、`yaml`、`yml`、`toml`、`snbt`、`mcfunction`，用来防止插件诱导用户保存可执行文件。

## 槽

槽是中间件：`(input, next, ctx) => output`。插件可以先改输入再调用 `next`，也可以拿到 `next` 的结果再加工，可以整段替换（不调用 `next`），也可以按条件交回内置实现。

```js
slots: {
	solve: async (input, next, ctx) =>
		ctx.settings.custom ? mySolver(input, ctx) : next(input),
}
```

| 槽 | 触发位置 | 输入 | 输出 |
|---|---|---|---|
| `solve` | 计算页「计算 TNT 数量」 | `CalculationInput` | `TNTResult[]` |
| `trace` | 结果预览、珍珠轨迹页 | `PearlTraceInput` | `PearlTraceResult` |
| `simulate` | 模拟页 | `RawTraceInput` | `PearlTraceResult` |
| `bits` | Bit 计算页 | `BitsInput` | `BitsResult` |
| `copy` | 复制 Bit 结果、复制神秘代码、复制工具结果 | `{ kind, text, data }` | 字符串 |
| `importConfig` | 导入配置文件（打开、拖放、模拟页导入） | `{ name, content }` | `ImportedConfiguration` |
| `exportConfig` | 导出配置 JSON | 配置对象 | 配置对象 |

类型的完整定义见 `pearlcalc-plugin.d.ts`。几点约定：

- `solve` 返回的每条结果必须包含 `distance`、`tick`、`blue`、`red`、`total`、`pearl_end_pos`、`pearl_end_motion`、`direction`，可以附加任意字段，配合 `resultColumns` 显示。
- `copy` 的 `kind` 是 `"bits"`、`"configCode"` 或 `"row"`，`text` 是内置生成的文本，`data` 是对应的原始数据。
- 配置附带的插件只从用户选择的文件原文里读取。`exportConfig` 返回值里的 `Plugins` 字段会被移除；`pc.files.save`、`pc.clipboard.write` 以及 `copy` 槽和工具 `copy()` 的输出，只要能被读成带插件的配置（任何位置出现 `Plugins` 键都算，包括转义写法和带 BOM 的文本），就会被拒绝。插件没办法把自己或别的代码塞进其他配置。
- 配置页（向导）里的导入、导出和复制神秘代码不经过任何插件；向导里带进来的插件只会在导出时原样保留，不会运行。
- `importConfig` 只处理插件在 `fileTypes` 里声明的扩展名，本软件自己的 `.json` 配置不经过它；申请了任何权限的插件不能接管 `importConfig`（它会看到你打开的其他文件）；插件拿到的 `name` 只是文件名，不含路径。常见写法是把内容转换成本软件的配置 JSON，再交给 `next`：

  ```js
  fileTypes: ["mycfg"],
  slots: {
  	importConfig: (input, next) =>
  		input.name.endsWith(".mycfg")
  			? next({ name: input.name, content: JSON.stringify(convert(input.content)) })
  			: next(input),
  },
  ```

- 多个插件接管同一个槽时，按它们附加到配置的顺序串成一条链，先附加的先执行，它的 `next` 进入下一个插件。
- 槽调用超过 120 秒视为卡死，插件的常驻 Worker 会被重启，本次操作报错。
- `simulate` 槽里可以用 `ctx.simulatorInputs` 读到插件在模拟页的输入。

## 工具

配置附带的每个工具都会出现在软件左侧导航栏里，点开是一个独立页面：左侧是由 `inputs` 生成的表单，右侧是结果表，行可以点开看详情。需要完全自定义的页面请用 `mount: "page"` 的面板。

```js
tools: [{
	id: "search",
	title: "TNT 搜索",
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

运行流程：

1. `validate(input)`：返回字符串表示输入有误，显示在结果区。
2. `plan(input)`：把任务拆成分片数组，每个分片必须能被结构化克隆（不能含函数）。没有 `plan` 时整个输入就是唯一的分片。
3. `runShard(shard, ctx)`：软件按 CPU 核数开线程并行处理分片（最多 16 个）。在里面调用 `ctx.emit(row)` 输出结果行。
4. 所有分片完成后，`finalize(rows)` 收到最终的前 N 条，可以补充计算较贵的字段。
5. 点开某一行时调用 `detail(row)` 生成视图，「复制」按钮调用 `copy(row)`，结果再经过 `copy` 槽。

排序和去重由软件完成：

- `sortBy`：排序键，字符串表示升序，`{ key, order: "desc" }` 表示降序。
- `limit`：保留的条数，可以是数字，也可以是某个输入字段的 key（让用户自己填）。默认 100，最多 10000。
- 行里带 `key` 字段（字符串或数字）时按它去重，同 key 只保留排序更靠前的一条。

`runShard` 里的 `ctx` 额外提供：

| 属性 | 说明 |
|---|---|
| `emit(row)` | 输出一行。软件在线程内维护前 N 条，排不进的行直接丢弃 |
| `accepts(partial)` | 只传排序键（例如 `{ dist, v }`），返回这一行能否排进前 N。构造行对象之前先判断，可以省掉大量开销 |
| `progress(fraction)` | 报告本分片进度，0 到 1 |
| `signal.aborted` | 用户点了停止 |

停止按钮的行为：软件先设置 `signal.aborted`，0.4 秒后直接终止线程。同步的长循环收不到中途消息，所以在循环里检查 `signal.aborted` 只对 `async` 的 `runShard`（循环中有 `await`）生效；同步循环会在 0.4 秒后被强行终止，已经 `emit` 的行会保留。

把分片切得足够细（例如按 tick 切），进度和停止都会更灵敏。

## 面板

面板是插件自己的界面，可以挂在软件的这些位置：

| `mount` | 位置 | `ctx.view` |
|---|---|---|
| `calculator.general` | 计算页「常规」标签底部 | `{}` |
| `calculator.config` | 计算页「配置」标签、插件列表上方 | `{}` |
| `trace` | 珍珠轨迹页、摘要下方 | `{ trace, tnt: { blue, red, vertical, direction } }` |
| `simulator.inputs` | 模拟页输入区底部 | `{}` |
| `simulator.results` | 模拟页结果下方 | `{ trace }`，模拟前为 `null` |
| `page` | 左侧导航栏里的独立页面，`title` 必填 | `{}` |

```js
panels: [{
	id: "counter",
	mount: "calculator.general",
	title: { zh: "计数器", en: "Counter" },
	state: (ctx) => ({ count: 0 }),
	render: (state, ctx) => ({
		type: "row",
		children: [
			{ type: "text", text: `已点 ${state.count} 次` },
			{ type: "button", label: "+1", on: "add" },
		],
	}),
	on: {
		add: (state, event, ctx) => ({ count: state.count + 1 }),
	},
}]
```

- 插件代码始终只在沙箱里运行。`render` 返回一棵描述界面的 JSON 树，由软件用自带的组件画出来，外观和软件其他部分一致。
- `state(ctx)` 给出初始状态，不写时为 `null`。状态由软件保管，本次运行内切换页面不会丢失；必须能转成 JSON，最大 1 MB。要跨运行保存请用 `pc.storage`。
- 用户操作会调用 `on` 里的同名函数 `(state, event, ctx)`，`event` 是 `{ on, value?, payload? }`。返回新状态；返回 `undefined` 表示状态不变。处理完后自动重新 `render`。
- 应用状态、界面语言、插件设置和输入、`pc.storage` 数据或 `ctx.view` 变化时，面板也会重新 `render`。
- 每次调用最长 30 秒；界面树最多 5 万个值（字符串、数字也算）、200 万个字符、48 层，`table` 最多显示 5 万个单元格。
- 面板上方始终显示插件名（有 `title` 时显示为「插件名 · 标题」）。面板渲染出错时只在面板位置显示错误，不会影响软件其他部分。

### 界面节点

`children` 里的字符串和数字直接显示为文字，`null`、`false` 会被跳过。`render` 也可以返回节点数组。

| `type` | 属性 |
|---|---|
| `stack` | `gap`、`children`，纵向排列 |
| `row` | `gap`、`align`（`start`/`center`/`end`/`baseline`/`stretch`）、`justify`（`start`/`center`/`end`/`between`）、`wrap`、`children` |
| `grid` | `columns`（1–6）、`gap`、`children` |
| `section` | `title`、`children` |
| `text` | `text`、`tone`、`size`（`xs`/`sm`/`md`/`lg`/`xl`）、`weight`（`normal`/`medium`/`semibold`）、`mono`、`align` |
| `badge` | `text`、`tone` |
| `alert` | `text`、`title`、`tone` |
| `metric` | `label`、`value`、`sub`、`tone`，和软件里的大号指标同款 |
| `kv` | `items: [{ label, value, tone }]` |
| `table` | `columns`（同「列」）、`rows`、`onRowClick`、`selected`（高亮的行号）、`maxHeight` |
| `code` | `text`、`maxHeight` |
| `progress` | `value`（0–1）、`label` |
| `separator` | — |
| `button` | `label`、`on`、`payload`、`variant`（`default`/`secondary`/`outline`/`ghost`/`destructive`）、`size`（`sm`/`default`）、`disabled`、`fill` |
| `fields` | `fields`（同「字段」）、`values`、`on` |
| `trajectory` | `points`、`targetY`、`target`、`view`、`height`，复用软件的轨迹图 |
| `svg` | `viewBox`、`height`、`title`、`children`，见下 |
| `image` | `src`、`alt`、`height`，只接受 `data:image/png`、`jpeg`、`gif`、`webp`、`svg+xml` 的 base64 地址 |
| `html` | `html`、`height`，规则同视图里的 `html` |

`gap` 取 0–12，单位是 4 像素。`tone` 是 `default`、`muted`、`info`、`success`、`warning`、`danger`。

事件内容：

- `button`：`payload` 是按钮的 `payload`。
- `table` 的 `onRowClick`：`value` 是行号，`payload` 是这一行。
- `fields`：`value` 是校验后的全部字段值，停止输入 150 毫秒后发送。用户正在输入的内容会一直保留，直到 `values` 发生变化。输入不算点击，这个事件函数里不能调用需要点击的接口。
- `svg` 图形：`payload` 是图形的 `payload`。
- `html` 里调用 `pc.action(name, payload)`：`on` 是 `name`。

`svg` 的子节点可以是 `path`（`d`）、`line`（`x1`、`y1`、`x2`、`y2`）、`rect`（`x`、`y`、`width`、`height`、`rx`）、`circle`（`cx`、`cy`、`r`）、`ellipse`、`polyline`/`polygon`（`points: [[x, y], …]`）、`text`（`x`、`y`、`text`、`fontSize`、`anchor`）和 `g`（`children`）。共同属性有 `fill`、`stroke`、`strokeWidth`、`strokeDasharray`、`opacity`、`transform`，以及点击用的 `on`、`payload`。颜色可以写 `#hex`、`rgb()`/`hsl()`、CSS 颜色名，或者软件主题色 `foreground`、`muted`、`primary`、`border`、`blue`、`red`、`green`、`amber`。

## 视图

`detail(row)` 返回视图数组：

```js
[
	{ type: "text", title: "详细信息", text: "多行文本" },
	{ type: "kv", title: "摆放", items: [{ label: "TNT", value: "x=21, y=46, z=64 ×4" }] },
	{ type: "trajectory", title: "轨迹", points: [{ x, y, z }], targetY: 119.85, view: "side" },
	{ type: "html", title: "自定义", html: "<button id=b>算一下</button>", height: 240 },
]
```

- `trajectory` 复用软件的轨迹图，可在侧视和俯视之间切换；`target: { x, z }` 在俯视图上标出目标。
- `html` 在两层隔离的沙箱 iframe 中渲染，外层禁止页面跳转，防止内容借跳转把数据带出去。静态 `html` 先在软件里按白名单清理：去掉 `script`、`link`、`meta`、`base`、`iframe`、`form` 等元素，去掉链接地址和事件属性，图片只保留 `data:image` 地址，防止借 DNS 预解析等方式把数据带出去。
  - 只有获得完全控制权限的插件，页面里才能运行脚本：`pc.action(name, payload)` 调用工具 `actions`（面板里是 `on`）中的同名函数并返回 Promise。
  - 其他插件（包括联网的）的 `html` 只显示静态内容，脚本不会运行。安卓版和 Windows 版的 WebView 会把软件内部接口的初始化脚本注入页面里所有的 iframe，安卓上 iframe 还能直接调用这些接口，在 iframe 里运行插件脚本可能绕过沙箱，所以插件脚本只在 Worker 里运行。交互界面请用面板。

## 随配置保存

插件属于配置文件。附加或替换插件都在计算页「配置」标签底部的「插件」区操作（拖入 `.js` 文件效果相同），这和改配置里的其他参数一样，导出配置后才写进文件：

```json
{
	"NorthWestTNT": { "X": -0.625, "Y": 256.52, "Z": -0.625 },
	"...": "原有字段",
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

- `Source` 是插件源码明文，收到配置的人可以直接读到代码。
- `Params` 是插件的设置、计算页和模拟页的输入、各工具的输入和 `pc.storage` 数据，打开配置时自动填好。输入只导出用户改过的值，用 `from` 取的默认值（比如计算页的目标坐标）不会写进文件，在接收方那里重新取。炮相关的私有常量可以这样随配置分发。
- 导出前软件会把结果重新解析一遍，导出的内容打不开时直接报错，不会写出损坏的配置。
- `Sha256` 由软件计算。内容和声明不一致时，插件详情里会给出警告。
- `Plugins` 可以放在炮配置对象里，也可以放在 `CannonSettings` 旁边的顶层。旧版本软件会忽略这个字段，照常读取配置。
- 神秘代码只包含炮参数。用神秘代码或不带插件的配置替换当前配置时，插件也一起移除。

打开带插件的配置时，软件先列出插件，由用户选择「加载插件」或「不加载」，在此之前不执行任何插件代码；申请了权限的插件加载后还会再单独确认，见「权限与安全」。不加载的插件原样留在配置里，导出时照样写回，之后可以在插件列表里点「加载」。如果打开的配置里有本次运行中已经加载过的同一个不申请权限的插件，软件沿用正在运行的实例，只套用新的 `Params`；申请了权限的插件每次打开配置都重新询问，防止别人的配置借用你已经给过的授权。

源码以明文形式写进配置，收到配置的人都能读到。混淆或编译成 WebAssembly 只能增加还原难度，代码在对方机器上运行，就能被还原。

## 权限与安全

插件来自别人分享的配置文件，软件按「插件不可信」来设计：

- 打开别人的配置时，插件不会自动运行。软件先列出配置附带的插件，用户点「加载插件」之后才执行它们的代码。
- 没有申请权限的插件只能在自己的沙箱里计算。它不能联网，碰不到页面、其他插件和本机文件；能做的事都经过 `ctx.pc`，由软件逐项检查。
- 申请了权限的插件在加载时（打开配置或附加 `.js`）先弹出确认，逐项列出权限和风险。用户选「允许并启用」之前，插件的槽、工具、面板都不会运行，代码只在无网络的沙箱里读取过一次定义。
- 用户选「不启用」后，插件留在配置里但不运行。之后可以在插件列表里展开它，点「查看权限并启用」重新决定。
- 软件每次启动都是新实例，授权只在本次运行内有效，下次打开配置会重新询问。
- 授权检查都在软件一侧完成，插件无法自己提升权限。插件在沙箱里自报的整份定义，软件都会按上面的规则再校验一遍。
- 确认框出现或换到下一个插件后，「允许」按钮要等 0.8 秒才能点，防止连点误允许。同一份配置里有其他申请了权限的插件时，确认框会一并列出：插件之间可以通过接管同一功能或软件里共享的数据传递信息，它们的权限要合在一起看。
- 同一时间只能加载一个同 id 的插件。配置里声明的 `Id` 必须和插件代码里的 `id` 一致，否则不加载，防止加载提示里显示的名字和实际插件不符。
- 插件 Worker 启动时会先自检沙箱：确认内容安全策略确实生效（用不联网的 `data:` 地址测试），没生效就拒绝运行插件并提示，不会在策略失效的平台上悄悄放开网络。
- 跳转页面、修改计算页输入、写剪贴板、打开和保存文件，都只能在用户点击插件界面后的那次事件处理里进行，自动运行的 `render`、槽和工具都做不到，插件没法把界面锁死或刷屏。
- 软件不保存任何东西，关掉再打开就恢复干净，插件留不下任何痕迹。

| 权限 | 允许的事 | 风险 |
|---|---|---|
| `network` | 联网，可以配合 `networkHosts` 只开放指定地址 | 可以把配置、输入和计算结果发到外部 |
| `clipboard-read` | `pc.clipboard.read()` | 可以读到用户复制过的任何内容 |
| `full-access` | 插件的 `main()` 直接在软件主窗口运行，不受沙箱限制；同时具有上面两项权限 | 可以读改软件里的一切，见下节 |

`networkHosts` 写成 `协议://主机[:端口]`，协议可以是 `http`、`https`、`ws`、`wss`。只接受确切的主机名，不支持 `*.` 通配：`*.workers.dev`、`*.github.io` 这类共享托管域名谁都能注册子域名，通配会让看似受限的授权实际连到任何人的服务器。

```js
permissions: ["network"],
networkHosts: ["https://api.example.com", "wss://live.example.org"],
```

确认框会把这些地址展示给用户，沙箱只放行这些地址的连接。不写 `networkHosts` 表示可以连接任意地址。

### 完全控制

```js
permissions: ["full-access"],
main(host) {
	const unmount = host.mount("calculator.general", (element, view) => {
		element.textContent = "来自主窗口";
		return () => element.replaceChildren();
	});
	return () => unmount();
},
```

`main(host)` 在用户允许后于主窗口运行，可以直接操作页面。`host` 提供：

- `pc`：同 `ctx.pc`。
- `context()`：当前的 `locale`、`version`、`mode`、`config`、`calculator`、`settings`、`inputs`、`simulatorInputs`。
- `onContextChange(listener)`：上面这些值变化时回调，返回取消订阅的函数。
- `mount(point, render)`：在面板的挂载位置放一个空元素交给插件渲染，`render(element, view)` 可以返回清理函数。`mount` 返回卸载函数。
- `log(...args)`：写插件日志。

`main` 可以返回一个清理函数，插件被移除或换配置时调用。主窗口里的代码无法被强制卸载，彻底停止需要重启软件，确认框里也会这样告诉用户。

完全控制等于把整个软件交给插件，只在其他方式都做不到时才申请。用户必须先勾选「我了解风险」才能允许。

### 无法完全消除的风险

- **卡死软件**：插件可以在沙箱里耗尽 CPU 或内存，让软件变慢甚至崩溃。槽和面板有超时，超时后会重启插件的 Worker；交给软件的计算输入有上限，日志和消息有速率限制；但内存暴涨浏览器无法提前拦截。遇到这种配置，重启软件并且不要再打开它，或者在加载提示里选「不加载」。
- **借分享带出数据**：插件能读到配置和计算页输入（包括目标坐标），可以把它们藏进 `pc.storage`、`exportConfig` 的输出或复制出去的文本，等用户把配置或文本发给别人时一起带出去。插件列表里会显示每个插件存了多少数据，可以一键清除；接管了 `exportConfig`、`copy` 的插件也会在「接管的功能」里列出。
- **误导性文字**：面板可以显示任意文字，比如冒充软件的提示。插件界面都标着插件名，软件自身的确认框只会以弹窗形式出现。
- **来源无法验证**：`Sha256` 写在同一个文件里，只能发现文件意外损坏，不能证明作者是谁。只打开来源可信的配置。

## 调试

- 改完插件后再附加一次（或再拖一次文件），同 id 的旧版本会被替换，输入值、设置、`pc.storage` 数据和日志都会保留；申请了权限的插件会重新确认。
- 面板出错时，错误信息直接显示在面板位置，同时写进日志。
- 插件报错的堆栈和 `console` 输出都在插件详情的日志里。
- 槽出错时，界面上的错误提示会写明是哪个插件、哪个槽出的错。

## 物理常量说明

`pc.physics` 与计算页使用同一套内核常量（阻力 0.99、珍珠眼高 0.2125、TNT 爆炸点偏移 0.06125）。原版游戏使用由 float 计算得到的值：阻力 `(double)0.99f`、眼高 `(double)(0.25f*0.85f)`、爆炸点 `y + (double)0.98f*0.0625`，两者在 1e-8 量级上有差别。插件如果需要逐位贴合原版，可以在 JS 里自己实现这部分计算。
