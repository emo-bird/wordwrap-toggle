import * as vscode from 'vscode';

/** 需要监听变化的编辑器换行相关配置 */
const WORD_WRAP_CONFIGS = ['editor.wordWrap', 'editor.wordWrapColumn'] as const;

interface ExtensionState {
  readonly bar: vscode.StatusBarItem;
  /**
   * 本扩展通过状态栏左键触发的“临时覆盖”状态。
   * key = document.uri.toString()，value = 当前是否处于换行状态。
   * 仅用于在扩展无法直接读取编辑器内部 Alt+Z 覆盖态时，保持图标与实际操作同步。
   */
  readonly overrides: Map<string, boolean>;
}

export function activate(context: vscode.ExtensionContext): void {
  const bar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 120);
  bar.name = 'Word Wrap Toggle';
  bar.command = 'wordwrap.showMenu';
  bar.accessibilityInformation = { label: '打开换行菜单（切换 / 全局配置 / 工作区配置）', role: 'button' };

  const state: ExtensionState = { bar, overrides: new Map() };

  const refresh = (): void => updateStatusBar(state);
  refresh();

  context.subscriptions.push(
    bar,
    vscode.commands.registerCommand('wordwrap.toggle', () => void toggleWrap(state)),
    vscode.commands.registerCommand('wordwrap.showMenu', () => void showMenu(state)),
    vscode.commands.registerCommand('wordwrap.openSettingsGlobal', () => void openWordWrapSettings('user')),
    vscode.commands.registerCommand('wordwrap.openSettingsWorkspace', () => void openWordWrapSettings('workspace')),
    vscode.window.onDidChangeActiveTextEditor(refresh),
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (WORD_WRAP_CONFIGS.some((id) => e.affectsConfiguration(id))) {
        // 配置被改动后以配置为准，清除当前活动文档的临时覆盖记录
        const active = vscode.window.activeTextEditor;
        if (active) {
          state.overrides.delete(active.document.uri.toString());
        }
        refresh();
      }
    }),
    vscode.workspace.onDidCloseTextDocument((doc) => {
      state.overrides.delete(doc.uri.toString());
    })
  );
}

/** 读取某个文档生效的 editor.wordWrap 配置，判断基线是否为换行 */
function isConfigWordWrapOn(document?: vscode.TextDocument): boolean {
  const cfg = document
    ? vscode.workspace.getConfiguration('editor', document.uri)
    : vscode.workspace.getConfiguration('editor');
  // 取值：off | on | wordWrapColumn | bounded；除 off 外都视为已换行
  return cfg.get<string>('wordWrap', 'off') !== 'off';
}

/** 综合“配置基线 + 本扩展记录的临时覆盖”得到当前显示状态 */
function getEffectiveWrap(state: ExtensionState, editor?: vscode.TextEditor): boolean {
  if (!editor) {
    return false;
  }
  const key = editor.document.uri.toString();
  const override = state.overrides.get(key);
  if (override !== undefined) {
    return override;
  }
  return isConfigWordWrapOn(editor.document);
}

function updateStatusBar(state: ExtensionState): void {
  const editor = vscode.window.activeTextEditor;
  state.bar.text = '$(word-wrap)';

  if (!editor) {
    state.bar.tooltip = '软换行模式（当前无活动编辑器）';
    state.bar.color = undefined;
    state.bar.show();
    return;
  }

  const wrapped = getEffectiveWrap(state, editor);
  const tooltip = new vscode.MarkdownString();
  tooltip.isTrusted = true;
  tooltip.appendMarkdown(`**软换行模式：${wrapped ? '已开启' : '已关闭'}**\n\n`);
  tooltip.appendText('左键：打开菜单（切换 / 全局配置 / 工作区配置）\n');
  tooltip.appendText('回车：快速切换当前文件（等同 Alt+Z）');
  state.bar.tooltip = tooltip;
  // 开启时用主题色高亮，关闭时恢复默认色
  state.bar.color = wrapped ? new vscode.ThemeColor('charts.blue') : undefined;
  state.bar.show();
}

interface WrapMenuPickItem extends vscode.QuickPickItem {
  action: 'toggle' | 'global' | 'workspace';
}

/** 状态栏左键：打开操作菜单（QuickPick），第一项为切换且默认聚焦，回车即执行 */
async function showMenu(state: ExtensionState): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  const wrapped = getEffectiveWrap(state, editor);

  const items: WrapMenuPickItem[] = [
    {
      label: '$(word-wrap) 切换软换行模式',
      description: wrapped ? '当前已开启，点击后关闭' : '当前已关闭，点击后开启',
      detail: '仅作用于当前文件，等同 Alt+Z（默认项，回车直接执行）',
      action: 'toggle',
    },
    {
      label: '$(settings-gear) 全局配置',
      description: '打开用户设置（UI）',
      detail: '筛选 Editor: Word Wrap / Word Wrap Column',
      action: 'global',
    },
    {
      label: '$(folder) 工作区配置',
      description: '打开工作区设置（UI）',
      detail: '筛选 Editor: Word Wrap / Word Wrap Column',
      action: 'workspace',
    },
  ];

  const picked = await vscode.window.showQuickPick(items, {
    title: 'Word Wrap',
    placeHolder: '选择操作（第一项默认聚焦，回车直接切换）',
  });

  if (!picked) {
    return;
  }

  switch (picked.action) {
    case 'toggle':
      await toggleWrap(state);
      break;
    case 'global':
      await openWordWrapSettings('user');
      break;
    case 'workspace':
      await openWordWrapSettings('workspace');
      break;
  }
}

/** 临时切换当前文件的软换行（调用 editor.action.toggleWordWrap，即 Alt+Z） */
async function toggleWrap(state: ExtensionState): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    void vscode.window.showWarningMessage('当前没有打开的文件，无法切换换行模式。');
    return;
  }

  const key = editor.document.uri.toString();
  const next = !getEffectiveWrap(state, editor);
  state.overrides.set(key, next);
  updateStatusBar(state);

  // 真正执行 VSCode 内置的“切换换行”命令（Alt+Z 的默认绑定）
  await vscode.commands.executeCommand('editor.action.toggleWordWrap');
}

/**
 * 菜单的两个入口：打开设置 UI 并按设置 ID 子串筛选，同时命中：
 *   - Editor: Word Wrap        (editor.wordWrap)
 *   - Editor: Word Wrap Column (editor.wordWrapColumn)
 */
async function openWordWrapSettings(target: 'user' | 'workspace'): Promise<void> {
  const query = 'editor.wordWrap';
  const command =
    target === 'user' ? 'workbench.action.openGlobalSettings' : 'workbench.action.openWorkspaceSettings';

  // openGlobalSettings / openWorkspaceSettings 均接受 IOpenSettingsActionOptions，
  // query 字段会直接填入设置 UI 搜索框并立即过滤。
  await vscode.commands.executeCommand(command, { query });
}

export function deactivate(): void {
  // 无额外资源需要释放（StatusBarItem 与监听器已通过 context.subscriptions 管理）
}
