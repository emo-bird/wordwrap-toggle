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
