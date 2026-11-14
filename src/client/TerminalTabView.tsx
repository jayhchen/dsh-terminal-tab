/** Conversation "terminal" view: the retained screen with a floating close control. */
import { useCallback, useEffect, useState, useSyncExternalStore, type ReactNode } from 'react'
import { Button, IconCloseOutlineRegular } from './controls.tsx'
import type { TerminalView, TerminalViewState } from '@deepseek-ai/dsh-api-terminal-controller/client'
import type { ConvViewProps } from '@deepseek-ai/dsh-client-ui-conversation/client'
import type { HostObservable, InjectFace, PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import type { ThemeSnapshot } from '@deepseek-ai/dsh-client-ui-theme/client'
import { css } from './styles.ts'
import { TerminalScreen } from './TerminalScreen.tsx'
import type { NS } from './locales.ts'

/** The session's live terminal model and its observable state. */
interface TerminalTabEntry {
  readonly view: TerminalView
  readonly state: HostObservable<TerminalViewState>
}

/** Commands and observables injected by the plugin entry. */
interface TerminalTabInjected {
  readonly hooks: { readonly theme: HostObservable<ThemeSnapshot> }
  /** Adopt the terminal a saved binding names, or undefined when this session has none. */
  readonly resolve: () => TerminalTabEntry | undefined
  /** Allocate a terminal, ending any previous one for this session. */
  readonly create: () => TerminalTabEntry
  /** End the process and clear the saved binding. */
  readonly discard: () => void
  /** Whether this Session's terminal was closed on purpose; survives remounts. */
  readonly isClosed: () => boolean
  /** Rewrite the window's hold membership after a write this plugin cannot observe. */
  readonly reassertHolds: () => void
}

/** Conversation View props: owner share, injected commands and translated copy. */
type TerminalTabProps = ConvViewProps & InjectFace<TerminalTabInjected> & PropsLocale<typeof NS>

/** Subscribe a component to one observable source; undefined sources render undefined. */
function useObservable<T>(source: HostObservable<T> | undefined): T | undefined {
  const subscribe = useCallback((onStoreChange: () => void): (() => void) =>
    source?.subscribe(onStoreChange) ?? (() => {}), [source])
  const getSnapshot = useCallback((): T | undefined => source?.getSnapshot(), [source])
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

/**
 * Render the session terminal as a Conversation view. The tab opens straight into
 * a shell: an existing binding is adopted, otherwise one is allocated with the
 * configured default shell. Process lifecycle — retention, recovery, directory —
 * belongs to the shared terminal service; this component renders and relays.
 * @param props - injected commands, theme and localized copy.
 * @returns the terminal tab body.
 */
export function TerminalTabView({ resolve, create, discard, isClosed, reassertHolds, viewRequest, completeViewRequest, useTheme, t }: TerminalTabProps): ReactNode {
  const [entry, setEntry] = useState<TerminalTabEntry | undefined>(undefined)
  // Read from plugin scope at render: the flag outlives this component's mounts,
  // and every write to it happens in the handler that also sets `entry`.
  const closed = isClosed()
  const state = useObservable(entry?.state)
  const theme = useTheme(value => value)
  useEffect(() => {
    if (entry === undefined && !closed) setEntry(resolve() ?? create())
  }, [entry, closed, resolve, create])
  // Attach the DOM lifetime: starts or reconnects the shell, and detaches on
  // unmount while leaving the process alive.
  useEffect(() => entry?.view.mount(), [entry])
  // The sidebar owns the same membership table; re-assert on mount and on
  // connection (the `phase` dep re-runs this once the shell connects) so a
  // write this plugin never saw cannot strand the terminal.
  const phase = state?.phase
  useEffect(() => {
    if (entry === undefined) return
    reassertHolds()
  }, [entry, phase, reassertHolds])
  // A one-shot focus request addressed to this view must not stay pending; the
  // focus itself lands through the screen's mount/writable focus effect.
  useEffect(() => { if (viewRequest !== null) completeViewRequest() }, [viewRequest, completeViewRequest])
  const spawn = (): void => { setEntry(create()) }
  const newTerminal = <Button variant="primary" size="sm" onClick={spawn}>{t('new')}</Button>
  if (entry === undefined || state === undefined) {
    // The start effect runs immediately after the first paint; only an explicit
    // close leaves this state for longer, and then the tab offers a new terminal.
    return closed
      ? <section className={css.root}><div className={css.empty}><p>{t('closed')}</p>{newTerminal}</div></section>
      : null
  }
  const close = (): void => { discard(); setEntry(undefined) }
  const closeButton = <span className={css.close}>
    <Button variant="ghost" size="sm" aria-label={t('close')} title={t('close')} onClick={close}>
      <IconCloseOutlineRegular />
    </Button>
  </span>
  if (state.issue === 'missingTerminal') {
    return <section className={css.root}>
      <div className={css.empty}>
        <p role="alert">{t('missingTerminal')}</p>
        {newTerminal}
      </div>
    </section>
  }
  const error = state.phase === 'disconnected' ? undefined : state.issue === undefined ? state.error ?? state.info?.error : t(state.issue)
  let status: string | undefined
  if (state.phase === 'idle' || state.phase === 'loading') status = t('loading')
  else if (state.phase === 'creating' || state.phase === 'connecting' || state.phase === 'disconnected') status = t(state.phase)
  else if (state.info?.state === 'exited') status = t('exited', { code: String(state.info.exitCode ?? '—') })
  else if (state.info?.state === 'failed') status = t('unavailable')
  else if (state.phase === 'closed') status = t('closed')
  const ended = state.info?.state === 'exited' || state.phase === 'closed'
  const retry = !ended && (state.phase === 'failed' || state.phase === 'disconnected')
  const readOnly = state.phase === 'connected' && state.info?.state === 'running' && !state.writable
  const notices = status !== undefined || retry || readOnly || error !== undefined
  return (
    <section className={css.root}>
      {closeButton}
      {notices && <div className={css.status} role="status">
        {status}
        {readOnly && <>{t('readonly')} <Button variant="outline" size="sm" onClick={() => { entry.view.connect() }}>{t('control')}</Button></>}
        {retry && (state.info === undefined
          ? <Button variant="outline" size="sm" onClick={() => { void entry.view.refresh() }}>{t(state.phase === 'disconnected' ? 'reconnect' : 'retry')}</Button>
          : <Button variant="outline" size="sm" onClick={() => { entry.view.connect() }}>{t('reconnect')}</Button>)}
        {ended && newTerminal}
        {error !== undefined && <span>{t('failed', { message: error })}</span>}
      </div>}
      {state.info !== undefined && <TerminalScreen state={state} model={entry.view} label={t('title')} theme={theme} />}
    </section>
  )
}