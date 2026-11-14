/** Copy owned by the conversation terminal tab and its settings section. */
import type {} from '@deepseek-ai/dsh-client-ui-slots'

/** Locale namespace of this plugin. */
export const NS = 'dsh-terminal-tab'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    'dsh-terminal-tab': keyof typeof zh
  }
}

/** Simplified Chinese copy. */
export const zh = {
  title: '终端',
  view: '终端',
  new: '新建终端',
  close: '关闭终端',
  loading: '正在读取终端环境…',
  creating: '正在启动…',
  connecting: '正在连接…',
  disconnected: '连接已断开。',
  reconnect: '重新连接',
  readonly: '此页面当前只读。',
  control: '接管输入',
  closed: '终端已关闭。',
  exited: '进程已退出（{code}）',
  failed: '终端错误：{message}',
  unavailable: '不可用',
  retry: '重试',
  missingTerminal: '此终端已不存在，请新建终端。',
  inputFull: '输入缓冲区已满，请重新连接后重试。',
  attachmentEnded: '终端连接已结束，请重新连接。',
  invalidOutput: '终端画面传输异常，请重新连接。',
  terminalLimit: '终端数量已达上限，请关闭不用的终端后重试。已退出的终端也计入数量。',
  'settings.shell': '默认 Shell',
  'settings.hint': '新建终端时使用该 Shell，侧栏终端同样适用；已打开的终端保持原样。',
  'settings.loading': '读取中…',
  'settings.noSession': '先打开任意会话，才能读取可用的 Shell。',
  shellLoading: '正在读取 Shell…',
  shellEmpty: '没有可用的 Shell',
} satisfies Record<string, string>

/** English copy. */
export const en = {
  title: 'Terminal',
  view: 'Terminal',
  new: 'New terminal',
  close: 'Close terminal',
  loading: 'Reading terminal environment…',
  creating: 'Starting…',
  connecting: 'Connecting…',
  disconnected: 'Disconnected.',
  reconnect: 'Reconnect',
  readonly: 'This view is read-only.',
  control: 'Take control',
  closed: 'Terminal closed.',
  exited: 'Process exited ({code})',
  failed: 'Terminal error: {message}',
  unavailable: 'Unavailable',
  retry: 'Retry',
  missingTerminal: 'This terminal no longer exists. Open a new terminal.',
  inputFull: 'The input buffer is full. Reconnect and try again.',
  attachmentEnded: 'The terminal connection ended. Reconnect to continue.',
  invalidOutput: 'The terminal screen could not be received. Reconnect to recover it.',
  terminalLimit: 'The terminal limit has been reached. Close unused terminals and try again. Exited terminals also count toward the limit.',
  'settings.shell': 'Default shell',
  'settings.hint': 'New terminals start with this shell, including sidebar terminals; open terminals keep theirs.',
  'settings.loading': 'Loading…',
  'settings.noSession': 'Open a session first to list available shells.',
  shellLoading: 'Loading shells…',
  shellEmpty: 'No shells available',
} satisfies Record<keyof typeof zh, string>