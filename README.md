# Word Wrap Toggle

一个极简的 VSCode 插件：在状态栏放一个换行图标，左键打开操作菜单——可一键切换当前文件软换行（等同 `Alt+Z`），或快速跳到全局 / 工作区设置并筛选出 `Editor: Word Wrap` 与 `Editor: Word Wrap Column` 两项。

## 功能

- **状态栏图标**：右下角显示 `$(word-wrap)` 图标；当前文件处于换行状态时图标高亮，悬停提示当前模式。
- **左键点击**：弹出 QuickPick 菜单，包含三项：
  1. **切换软换行模式**（默认聚焦，回车即执行）——对当前活动编辑器执行 `editor.action.toggleWordWrap`（即 `Alt+Z`），仅临时切换当前文件，不写入配置文件。
  2. **全局配置** —— 打开「用户设置」UI，筛选到 `Editor: Word Wrap` / `Editor: Word Wrap Column`。
  3. **工作区配置** —— 打开「工作区设置」UI，筛选到同样两项。
- 切换活动编辑器、修改相关配置、关闭文档时，图标状态自动刷新。
- 所有操作也可通过命令面板（`Ctrl+Shift+P` → 搜索 `Word Wrap:`）直接调用。

## 为什么不用右键？

VSCode 1.85+ 把状态栏右键菜单重做成了「显示 / 隐藏各项」的可见性管理器，扩展通过 `menus.statusBar` 贡献的菜单项不再可靠出现；同时 `StatusBarItem` 本身只有左键一个点击事件。因此本插件采用 VSCode 标准模式——**左键打开 QuickPick 菜单**，第一项默认为切换，回车即可快速切换，与语言选择器、Tasks 按钮等原生控件的交互一致。

## 安装

### 方式一：安装打包好的 .vsix（推荐）

```bash
code --install-extension wordwrap-toggle-0.0.1.vsix
```

或在 VSCode 中：扩展面板 → 右上角 `...` → **Install from VSIX…** → 选择 `wordwrap-toggle-0.0.1.vsix`。

### 方式二：从源码调试 / 打包

```bash
cd wordwrap-toggle
npm install
npm run compile          # 编译到 out/
npx @vscode/vsce package # 生成 .vsix
```

调试：用 VSCode 打开本目录，按 `F5`（会自动启动 `npm: watch` 并打开扩展开发宿主）。

## 发布到插件商城

1. 在 [Visual Studio Marketplace](https://marketplace.visualstudio.com/) 注册发布者（Publisher），并创建 Azure DevOps Personal Access Token（PAT）。
2. 修改 `package.json` 中的 `publisher` 字段为你的发布者 ID。
3. 登录并发布：

```bash
npx @vscode/vsce login <your-publisher>
npx @vscode/vsce publish
```

更多细节参考 [Publishing Extensions](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)。

## 使用

1. 打开任意文本文件，看右下角状态栏的换行图标。
2. **左键**图标：弹出菜单，**回车**即切换当前文件换行；或用方向键选「全局配置 / 工作区配置」打开设置页。
3. 设置页会自动筛选并定位到：
   - `Editor: Word Wrap`（`editor.wordWrap`）
   - `Editor: Word Wrap Column`（`editor.wordWrapColumn`）

## 实现说明与已知边界

- **临时切换的状态显示**：`Alt+Z` 产生的是编辑器内部的临时覆盖，扩展 API 无法直接读取该内部状态。本插件在自己触发切换时维护一份按文档 URI 记录的覆盖态，用于同步图标；若用户通过快捷键 `Alt+Z` 或其他方式直接切换，图标可能短暂不同步，切换活动编辑器或修改配置后会重新以配置基线为准。
- **设置筛选**：使用搜索词 `editor.wordWrap`（按设置 ID 子串匹配），同时命中 `Editor: Word Wrap` 与 `Editor: Word Wrap Column` 两项；可能顺带显示 `Diff Editor: Word Wrap`，两项 Editor 设置始终排在最前。VSCode 设置搜索不支持对两个 `@id` 取“或”，子串匹配是同时显示两项的标准做法。
- 最低支持 VSCode `1.75.0`。

## 目录结构

```
wordwrap-toggle/
├── package.json          # 插件清单与命令贡献
├── tsconfig.json
├── src/extension.ts      # 全部逻辑
├── .vscode/              # F5 调试配置
├── LICENSE
└── README.md
```
