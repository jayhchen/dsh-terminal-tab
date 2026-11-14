/** Conversation-view terminal screen: the retained xterm renderer, adapted from the sidebar terminal body. */
import { useEffect, useLayoutEffect, useRef, type ReactNode } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import type { TerminalView, TerminalViewState } from '@deepseek-ai/dsh-api-terminal-controller/client'
import type { ThemeSnapshot } from '@deepseek-ai/dsh-client-ui-theme/client'
import { css } from './styles.ts'
import { TerminalTheme } from './terminal-theme.ts'
import { observeTerminalCursor } from './terminal-cursor.ts'

/**
 * xterm.js reports the person's input and terminal-protocol replies through the same data event, so input that
 * follows a person's gesture within this window counts as typed; IME commits arrive in a later task. Scrolling is
 * not a gesture: xterm turns the wheel into arrow keys on the alternate screen, and reading must not take over.
 */
const TYPED_INPUT_WINDOW_MS = 250
const INPUT_GESTURES = ['keydown', 'beforeinput', 'paste', 'compositionend', 'drop', 'mousedown', 'touchstart'] as const
/** Focus-in and focus-out reports (DECSET 1004) that xterm.js sends when a click focuses the screen. */
const FOCUS_REPORTS = new Set(['\x1b[I', '\x1b[O'])

/* oxlint-disable typescript/no-non-null-assertion -- React sets the DOM ref, then these effects initialize and use the emulator. */
/**
 * Render the retained terminal with the application theme. The conversation slot
 * mounts its view one at a time, so a mounted screen is always the visible one.
 * @param props - view model, its current state, localized label and the theme snapshot.
 * @returns the fitted xterm screen.
 */
export function TerminalScreen({ state, model, label, theme }: {
  state: TerminalViewState
  model: TerminalView
  label: string
  theme: ThemeSnapshot
}): ReactNode {
  const element = useRef<HTMLDivElement>(null)
  const terminal = useRef<Terminal>()
  const fit = useRef<FitAddon>()
  const colors = useRef<TerminalTheme>()
  const lastRevision = useRef(0)
  const fontFamily = terminalFontFamily(theme.fontFamilies.terminal)
  const fontSize = theme.fontSizes.terminal
  const current = useRef({ state, fontFamily, fontSize })
  current.current = { state, fontFamily, fontSize }

  useLayoutEffect(() => {
    const node = element.current!
    const xterm = new Terminal({
      minimumContrastRatio: 4.5, cursorBlink: true, fontSize: current.current.fontSize, fontFamily: current.current.fontFamily,
      scrollback: current.current.state.environment?.scrollback ?? 0,
    })
    const addon = new FitAddon()
    xterm.loadAddon(addon)
    xterm.open(node)
    const palette = new TerminalTheme(xterm)
    colors.current = palette
    const cursor = observeTerminalCursor(xterm, node, () => palette.cursor)
    xterm.textarea?.setAttribute('aria-label', label)
    terminal.current = xterm
    fit.current = addon
    lastRevision.current = 0
    let gestureAt = Number.NEGATIVE_INFINITY
    const gesture = (): void => { gestureAt = performance.now() }
    for (const type of INPUT_GESTURES) node.addEventListener(type, gesture, { capture: true, passive: true })
    const input = xterm.onData((data) => {
      model.write(data, performance.now() - gestureAt < TYPED_INPUT_WINDOW_MS && !FOCUS_REPORTS.has(data))
    })
    const measure = (): void => {
      if (!current.current.state.writable || node.clientWidth === 0 || node.clientHeight === 0) return
      fitScreen(xterm, addon, current.current.state, model)
    }
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    return () => {
      observer.disconnect()
      for (const type of INPUT_GESTURES) node.removeEventListener(type, gesture, { capture: true })
      input.dispose()
      cursor.dispose()
      palette.dispose()
      xterm.dispose()
      terminal.current = undefined
      fit.current = undefined
    }
  }, [model])

  useLayoutEffect(() => {
    const style = getComputedStyle(element.current!)
    colors.current!.update(style.backgroundColor, style.color)
  }, [theme, model])

  useLayoutEffect(() => {
    const xterm = terminal.current!
    if (xterm.options.fontFamily === fontFamily && xterm.options.fontSize === fontSize) return
    // xterm remeasures cells on option change; refit so the Host grid follows the new cell size.
    xterm.options.fontFamily = fontFamily
    xterm.options.fontSize = fontSize
    const live = current.current.state
    if (live.writable && element.current!.clientWidth && element.current!.clientHeight) {
      fitScreen(xterm, fit.current!, live, model)
    }
  }, [fontFamily, fontSize, model])

  useLayoutEffect(() => {
    const xterm = terminal.current!
    const render = state.render
    if (render === undefined || render.revision <= lastRevision.current) return
    lastRevision.current = render.revision
    if (render.frame.type === 'snapshot') {
      xterm.reset()
      xterm.resize(render.frame.info.cols, render.frame.info.rows)
    }
    xterm.write(render.frame.type === 'snapshot' ? render.frame.screen : render.frame.data, () => { model.acknowledge(render.revision) })
  }, [state.render, model])

  useLayoutEffect(() => {
    const xterm = terminal.current!
    xterm.options.disableStdin = !state.writable
    if (state.writable && element.current?.clientWidth && element.current.clientHeight) {
      fitScreen(xterm, fit.current!, state, model)
    } else if (state.info !== undefined && !state.writable) xterm.resize(state.info.cols, state.info.rows)
  }, [state.writable, state.info?.cols, state.info?.rows, model])
  useEffect(() => {
    terminal.current!.textarea?.setAttribute('aria-label', label)
  }, [label])
  useEffect(() => { if (state.writable) terminal.current!.focus() }, [state.writable])
  return <div className={css.screen} ref={element} />
}
/* oxlint-enable typescript/no-non-null-assertion */

/** Built-in terminal stack placed after the user's normalized list. */
const TERMINAL_FONT_STACK = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'

function terminalFontFamily(list: string): string {
  return list === '' ? TERMINAL_FONT_STACK : `${list}, ${TERMINAL_FONT_STACK}`
}

function fitScreen(xterm: Terminal, fit: FitAddon, state: TerminalViewState, model: TerminalView): void {
  const dimensions = fit.proposeDimensions()
  const environment = state.environment
  if (dimensions === undefined || environment === undefined) return
  const cols = Math.min(dimensions.cols, environment.maxCols)
  const rows = Math.min(dimensions.rows, environment.maxRows)
  if (cols < 2 || rows < 1) return
  xterm.resize(cols, rows)
  model.resize(cols, rows)
}
