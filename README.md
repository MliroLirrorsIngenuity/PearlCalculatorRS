<div align="center">
  <h1 align="center">PearlCalculatorRS</h1>
  <p align="center">
    一款基于 <a href="https://tauri.app/"><strong>Tauri</strong></a> 和 <a href="https://www.rust-lang.org/"><strong>Rust</strong></a> 开发的高性能 Minecraft 矢量珍珠炮计算器。
    <br />
    <br />
    <a href="https://github.com/MliroLirrorsIngenuity/PearlCalculatorRS/blob/main/README.md">简体中文</a>
    |
    <a href="https://github.com/MliroLirrorsIngenuity/PearlCalculatorRS/blob/main/README_EN.md">English</a>
  </p>
</div>

<details>
  <summary>目录</summary>

  - [特性](#特性)
  - [使用方式](#使用方式)
  - [提问前必看](#提问前必看)
  - [贡献者](#贡献者)
  - [开源协议](#开源协议)
  - [致谢](#致谢)

</details>

## 特性

- **高性能计算核心**：利用 Rust 编写的 `pearl_calculator_core` 提供快速、精确的珍珠轨迹与 TNT 爆炸计算。
- **现代化用户界面**：基于 React + TailwindCSS 构建的现代化 UI，提供流畅的交互体验。
- **多功能集成**：
    - **TNT 计算**：支持多种 TNT 配置与排列方式的计算。
    - **模拟器**：内置珍珠轨迹模拟，可快速预测动量及落点。
    - **配置向导**：提供直观的配置流程，轻松设置大炮参数。
- **跨平台支持**：得益于 Tauri 框架，支持 Windows、macOS 和 Linux 平台。无需任何依赖。

## 使用方式

前往 [Releases](https://github.com/MliroLirrorsIngenuity/PearlCalculatorRS/releases) 页面下载对应平台的最新版本即可使用。

## 提问前必看

在提问之前，请确保：

- 已经尝试了所有可能的解决方案
- 已经尝试搜索了解决方案（包括但不限于本仓库的 [Issues](https://github.com/MliroLirrorsIngenuity/PearlCalculatorRS/issues)）
- 你提供了**足够的信息**帮助开发人员定位问题，包括但不限于下列：
  - 软件版本
  - 复现步骤

- 提问渠道说明
  - **使用问题/配置疑问/其他问题** → [Discussions](https://github.com/MliroLirrorsIngenuity/PearlCalculatorRS/discussions)
  - **Bug/功能请求** → [Issues](https://github.com/MliroLirrorsIngenuity/PearlCalculatorRS/issues)

## 贡献者
<a href="https://github.com/MliroLirrorsIngenuity/PearlCalculatorRS/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=MliroLirrorsIngenuity/PearlCalculatorRS&" alt="Contributors" />
</a>

## 开源协议

本项目遵循 [MIT License](LICENSE) 开源协议。

### 协议注意事项

MIT 协议是一个宽松的许可协议，但您在使用本项目的代码时仍需注意以下事项：

1. **保留版权声明**：在您分发本项目的副本或基于本项目衍生的软件中，必须包含原作者的版权声明和许可声明（即 `LICENSE` 文件中的内容）。
2. **免责声明**：本项目按“原样”提供，作者不承担任何因使用本项目而产生的法律责任或担保。
3. **商业使用**：您被允许免费使用、复制、修改、合并、出版发行、散布、再授权及贩售本软件及其副本。

**简而言之，您可以自由地使用和修改代码，但必须保留原作者的署名。**

## 致谢

- [LegendsOfSky/PearlCalculatorCore](https://github.com/LegendsOfSky/PearlCalculatorCore)：本项目物理计算核心逻辑移植自该项目
- [Tauri](https://tauri.app/)：构建跨平台桌面应用的优秀框架
- [React](https://react.dev/)：用于构建用户界面的 JavaScript 库
- [shadcn/ui](https://ui.shadcn.com/)：设计精美的 UI 组件库
