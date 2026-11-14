/**
 * Conversation terminal tab: one persistent shell per Session rendered as a
 * Conversation view, driven entirely by the shared webTerminals client service.
 *
 * Holds contract: the sidebar terminal plugin owns the window membership table
 * and replaces it wholesale on every layout change, so this plugin rewrites
 * sidebar ∪ own on the same signals and once more in a microtask, making the
 * union the final write regardless of subscription order. Own create/close
 * re-assert it directly, and teardown hands the table back to the sidebar.
 * package.json's dsh.client.inject lists the sidebar-terminal package so it is
 * active whenever this plugin is; this plugin imports nothing from it.
 */
import type { Context } from '@deepseek-ai/cordis'
import type { TerminalView } from '@deepseek-ai/dsh-api-terminal-controller/client'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import type {} from '@deepseek-ai/dsh-api-session-controller/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type {} from '@deepseek-ai/dsh-client-ui-plugin-manager/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar-right/client'
import type { HostObservable } from '@deepseek-ai/dsh-client-ui-slots'
import type { ThemeSnapshot } from '@deepseek-ai/dsh-client-ui-theme/client'
import { SettingsCard } from './SettingsCard.tsx'
import { TerminalTabView } from './TerminalTabView.tsx'
import { en, NS, zh } from './locales.ts'
import { installStyles } from './styles.ts'

/** Client services this plugin needs before apply runs. */
export const inject = ['slots', 'locale', 'sessions', 'theme', 'webTerminals', 'sidebarRight']

/** View-model key within the webTerminals service, one per Session. */
const KEY = 'terminal-tab'

/**
 * Marks the Sessions whose terminal the person closed on purpose. It lives in
 * storage so a page reload does not resurrect a shell; creating a terminal (or
 * the Session leaving the list) clears it.
 */
const CLOSED_PREFIX = 'dsh-terminal-tab.closed.v1.'

/**
 * Register the locale dictionaries, the hold union, the Conversation view and the
 * settings section.
 * @param ctx - client root context.
 */
export function apply(ctx: Context): void {
  installStyles(ctx)
  const t = ctx.locale.bind(NS)
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-terminal-tab.dictionaries')

  const contentIdOf = (sessionId: SessionId): string => `dsh-terminal-tab/${sessionId}`
  /** Whether this browser saved a terminal for one Session's tab; owned by the service. */
  const bound = (sessionId: SessionId): boolean =>
    ctx.webTerminals.boundTerminal(sessionId, contentIdOf(sessionId)) !== undefined

  /**
   * Sessions whose terminal the person closed on purpose. It outlives the view
   * component (which unmounts whenever another Conversation view is selected) and
   * the page itself, so returning to the tab never starts a shell nobody asked for.
   */
  const closed = new Set<SessionId>()
  try {
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index)
      if (key !== null && key.startsWith(CLOSED_PREFIX)) closed.add(key.slice(CLOSED_PREFIX.length) as SessionId)
    }
  } catch { /* Unreadable storage simply yields no closed tabs. */ }
  const rememberClosed = (sessionId: SessionId): void => {
    closed.add(sessionId)
    try { localStorage.setItem(CLOSED_PREFIX + sessionId, '1') } catch { /* The marker stays in memory. */ }
  }
  const forgetClosed = (sessionId: SessionId): void => {
    if (!closed.delete(sessionId)) return
    try { localStorage.removeItem(CLOSED_PREFIX + sessionId) } catch { /* Nothing left to clean. */ }
  }
  let disposed = false

  const sidebarTerminals = (): readonly { sessionId: SessionId; tabId: string; contentId: string }[] =>
    ctx.sidebarRight.openTabs.getSnapshot().filter(tab => tab.kind === 'terminal')

  const syncHolds = (): void => {
    if (disposed) return
    const listed = ctx.sessions.list.getSnapshot().ids
    // Only prune once the list has arrived, so an empty snapshot cannot wipe markers.
    if (listed.length > 0) for (const sessionId of [...closed]) if (!listed.includes(sessionId)) forgetClosed(sessionId)
    // Own membership is the service's own binding table: a Session with a saved
    // terminal for this content id keeps it, whether or not its view is mounted.
    const ownTabs = listed.filter(bound).map(sessionId => ({ sessionId, tabId: KEY, contentId: contentIdOf(sessionId) }))
    ctx.webTerminals.retainTabs([...sidebarTerminals(), ...ownTabs])
  }
  ctx.effect(() => {
    // The sidebar replaces this whole table on every layout change, and its own
    // subscription may end up registered after ours (live plugin reload). Assert
    // the union once the burst settles so ours survive either ordering.
    const subscribe = (): void => { syncHolds(); queueMicrotask(syncHolds) }
    const unsubscribeTabs = ctx.sidebarRight.openTabs.subscribe(subscribe)
    // The Session list arrives after this plugin applies and own membership is
    // read from it, so re-assert whenever its membership changes.
    let ids = ctx.sessions.list.getSnapshot().ids.join('\n')
    const unsubscribeSessions = ctx.sessions.list.subscribe(() => {
      const next = ctx.sessions.list.getSnapshot().ids.join('\n')
      if (next === ids) return
      ids = next
      syncHolds()
    })
    subscribe()
    return () => {
      disposed = true
      unsubscribeTabs()
      unsubscribeSessions()
      // Hand the table back to its owner instead of emptying it, so unloading
      // this plugin never releases the sidebar's own holds.
      ctx.webTerminals.retainTabs(sidebarTerminals())
    }
  }, 'dsh-terminal-tab.holds')

  /** Adopt the terminal this Session already has, allocating nothing. */
  const adopt = (sessionId: SessionId): TerminalView | undefined => {
    if (!bound(sessionId)) return undefined
    forgetClosed(sessionId)
    return ctx.webTerminals.view(sessionId, KEY, contentIdOf(sessionId))
  }
  /** Drop the previous model (ending a live process) and allocate a fresh terminal. */
  const create = (sessionId: SessionId): TerminalView => {
    // close() is a no-op without an identity, and ends whatever this window or a
    // torn-down instance left behind, so view() always allocates a fresh one.
    ctx.webTerminals.close(sessionId, KEY, contentIdOf(sessionId))
    forgetClosed(sessionId)
    const view = ctx.webTerminals.view(sessionId, KEY, contentIdOf(sessionId))
    syncHolds()
    return view
  }
  /** Explicit close: end the process and clear the saved binding. */
  const discard = (sessionId: SessionId): void => {
    ctx.webTerminals.close(sessionId, KEY, contentIdOf(sessionId))
    rememberClosed(sessionId)
    syncHolds()
  }

  const theme: HostObservable<ThemeSnapshot> = {
    getSnapshot: () => ctx.theme.getTheme(),
    subscribe: listener => ctx.on('theme/change', listener),
  }

  ctx.effect(() => ctx.slots.inject('conversation.view', () => ctx.slots.register({
    name: 'conversation.view',
    id: 'terminal-tab',
    // Between conversation (0) and trajectory (10), making the tab position a
    // declared fact instead of a registration-order coincidence.
    order: 5,
    locale: NS,
    label: () => t('view'),
    inject: (sessionId: SessionId) => ({
      hooks: { theme },
      resolve: () => {
        const view = adopt(sessionId)
        return view === undefined ? undefined : { view, state: view.state }
      },
      create: () => {
        const view = create(sessionId)
        return { view, state: view.state }
      },
      discard: () => { discard(sessionId) },
      isClosed: () => closed.has(sessionId),
      // Re-assert after mount and once connected: only our own events and the
      // sidebar's layout changes rewrite the membership table, so a write this
      // plugin never hears about would otherwise drop the hold for good.
      reassertHolds: syncHolds,
    }),
  }, TerminalTabView)), 'dsh-terminal-tab.conversation-view')

  // Discovery is Session-scoped on the Host, so the card borrows any Session the
  // browser already holds open; the machine's shell list is the same for all.
  const shellSession = (): SessionId | undefined =>
    ctx.sessions.list.getSnapshot().ids.find(id => ctx.sessions.binding(id) !== undefined)

  ctx.effect(() => ctx.slots.inject('plugins.bundle.config', () => ctx.slots.register({
    name: 'plugins.bundle.config',
    key: 'dsh-terminal-tab',
    locale: NS,
    inject: () => ({
      loadShells: async (signal: AbortSignal) => {
        const sessionId = shellSession()
        if (sessionId === undefined) throw new Error(t('settings.noSession'))
        return ctx.webTerminals.launchShells(sessionId, signal)
      },
      selectShell: (path: string) => { ctx.webTerminals.selectShell(path) },
    }),
  }, SettingsCard)), 'dsh-terminal-tab.bundle-config')
}
