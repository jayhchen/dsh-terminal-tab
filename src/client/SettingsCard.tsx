/** This bundle's configuration on its Plugins page: the shell a new terminal starts with. */
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { IconChevronDownOutlineRegular, Menu } from './controls.tsx'
import type { TerminalLaunchShells } from '@deepseek-ai/dsh-api-terminal-controller/client'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-plugin-manager/client'
import { css } from './styles.ts'
import type { NS } from './locales.ts'

/** Shell discovery and the browser preference write. */
interface SettingsCardInjected {
  /** @param signal - menu lifetime. @returns installed shells and the remembered choice. */
  readonly loadShells: (signal: AbortSignal) => Promise<TerminalLaunchShells>
  /** @param path - shell the next terminal starts. */
  readonly selectShell: (path: string) => void
}

/** This bundle's configuration props: injected commands and copy. */
type SettingsCardProps = PropsRuntime<'plugins.bundle.config'> & PropsLocale<typeof NS> & InjectFace<SettingsCardInjected>

type MenuState =
  | { phase: 'loading' }
  | { phase: 'ready'; choices: TerminalLaunchShells }
  | { phase: 'failed'; message: string }

/** Ids the labelled control reads; one page renders one of these sections. */
const TITLE_ID = 'dsh-terminal-tab-shell-section'
const SELECT_ID = 'dsh-terminal-tab-shell-select'
const VALUE_ID = 'dsh-terminal-tab-shell-value'

/**
 * One labelled selector for the shell a new terminal starts with, laid out like
 * the shipped settings pages: a small section title, a full-width selector and a
 * muted hint, with no card of its own.
 * @param props - discovery, the preference write and localized copy.
 * @returns the bundle's configuration section.
 */
export function SettingsCard({ loadShells, selectShell, useSessions, t }: SettingsCardProps): ReactNode {
  const [open, setOpen] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState<MenuState>({ phase: 'loading' })
  const trigger = useRef<HTMLButtonElement>(null)
  // Discovery borrows an open Session; a Session opened later must retry it.
  const sessions = useSessions(snapshot => snapshot.ids.length)
  useEffect(() => {
    const lifetime = new AbortController()
    void loadShells(lifetime.signal).then((choices) => {
      if (!lifetime.signal.aborted) setState({ phase: 'ready', choices })
    }, (error: unknown) => {
      if (!lifetime.signal.aborted) setState({ phase: 'failed', message: error instanceof Error ? error.message : String(error) })
    })
    return () => { lifetime.abort() }
  }, [attempt, loadShells, sessions])
  const items = state.phase === 'ready'
    ? state.choices.shells.map(shell => ({ id: shell.path, label: shell.name }))
    : state.phase === 'loading'
      ? [{ id: 'loading', label: t('shellLoading'), disabled: true }]
      : [{ id: 'error', label: t('failed', { message: state.message }), disabled: true }, { id: 'retry', label: t('retry') }]
  const selected = state.phase === 'ready' ? state.choices.selectedShell : undefined
  const selectedName = state.phase === 'ready'
    ? state.choices.shells.find(shell => shell.path === selected)?.name ?? t('shellEmpty')
    : state.phase === 'failed' ? state.message : t('settings.loading')
  const anchor = <button ref={trigger} id={SELECT_ID} type="button" className={css.settingsSelect}
    aria-haspopup="menu" aria-expanded={open} aria-labelledby={`${TITLE_ID} ${VALUE_ID}`}
    onClick={() => {
      setOpen(value => !value)
      // Opening the menu is also the moment to retry after "open a session
      // first": the session count cannot see a listed session becoming bound.
      if (state.phase === 'failed') { setState({ phase: 'loading' }); setAttempt(value => value + 1) }
    }}>
    <span id={VALUE_ID} className={css.settingsSelectName}>{selectedName}</span>
    <IconChevronDownOutlineRegular className={css.settingsChevron} />
  </button>
  return <section className={css.settings} aria-labelledby={TITLE_ID}>
    <h4 id={TITLE_ID} className={css.settingsTitle}>{t('settings.shell')}</h4>
    <div className={css.settingsField}>
      <Menu
        open={open}
        onClose={() => { setOpen(false) }}
        items={items.length === 0 ? [{ id: 'empty', label: t('shellEmpty'), disabled: true }] : items}
        selectedId={selected}
        onSelect={(path) => {
          trigger.current?.focus({ preventScroll: true })
          setOpen(false)
          if (state.phase === 'failed') { setState({ phase: 'loading' }); setAttempt(value => value + 1); return }
          // Write unconditionally: the stored preference may name a shell the Host
          // no longer discovers, so an equal display value is still a real choice.
          selectShell(path)
          setState(prev => prev.phase === 'ready'
            ? { phase: 'ready', choices: { ...prev.choices, selectedShell: path } }
            : prev)
        }}
        autoFocus
        minWidthFromAnchor
        anchor={anchor}
      />
      <p className={css.settingsHint}>{t('settings.hint')}</p>
    </div>
  </section>}
