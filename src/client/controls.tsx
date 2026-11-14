/**
 * Local copies of the UI controls this plugin renders, per the plugin
 * authoring rule that bundles must not require Harness Client packages as
 * modules: markup, CSS, and behavior are copied from dsh-client-ui-primitives
 * under this plugin's class prefix, keeping only theme-token references.
 */
import { forwardRef, useEffect, useId, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { css } from './styles.ts'

/** Props shared by the inline product icons. */
interface IconProps {
  /** Rendered square size in pixels. */
  readonly size?: number
  readonly className?: string | undefined
}

/** Copied from dsh-client-ui-primitives artwork (regular 1px stroke, currentColor). */
export function IconCloseOutlineRegular({ size = 16, className }: IconProps): ReactNode {
  return <svg width={size} height={size} className={className} aria-hidden="true" viewBox="0 0 16 16" fill="none" strokeWidth="1">
    <path d="M2.5 2.5L13.5 13.5" stroke="currentColor" />
    <path d="M13.5 2.5L2.5 13.5" stroke="currentColor" />
  </svg>
}

/** Copied from dsh-client-ui-primitives artwork (regular 1px stroke, currentColor). */
export function IconChevronDownOutlineRegular({ size = 14, className }: IconProps): ReactNode {
  return <svg width={size} height={size} className={className} aria-hidden="true" viewBox="0 0 16 16" fill="none" strokeWidth="1">
    <path d="M4 6L7.29289 9.29289C7.68342 9.68342 8.31658 9.68342 8.70711 9.29289L12 6" stroke="currentColor" />
  </svg>
}

/** Copied from dsh-client-ui-primitives artwork (regular 1px stroke, currentColor). */
export function IconCheckOutlineRegular({ size = 16, className }: IconProps): ReactNode {
  return <svg width={size} height={size} className={className} aria-hidden="true" viewBox="0 0 16 16" fill="none" strokeWidth="1">
    <path d="M2.25 8.5L5.49732 11.7473C5.90519 12.1552 6.57263 12.1344 6.95426 11.7018L13.75 4" stroke="currentColor" />
  </svg>
}

/** Visual variant, each backed by its --dsw-alias-button-* token family. */
export type ButtonVariant = 'primary' | 'ghost' | 'outline' | 'toolbar'

const BUTTON_VARIANT: Record<ButtonVariant, string | undefined> = {
  primary: css.buttonPrimary,
  ghost: css.buttonGhost,
  outline: css.buttonOutline,
  toolbar: css.buttonToolbar,
}

type ButtonProps = {
  variant?: ButtonVariant
  size?: 'md' | 'sm'
  icon?: ReactNode
  className?: string | undefined
  children?: ReactNode
} & ButtonHTMLAttributes<HTMLButtonElement>

/**
 * Render a token-styled button, copied from dsh-client-ui-primitives.
 * @param props.variant - visual family (default 'ghost'); outlined buttons use a DPR-aware inset stroke.
 * @param props.size - 'md' 36px control or 'sm' 28px control.
 * @param props.icon - optional leading 16px icon node.
 * @param ref - native button for focus management and overlay anchors.
 * @returns the button element; native button attributes pass through.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({
  variant = 'ghost', size = 'md', icon, className, children, ...rest
}, ref) {
  return (
    <button ref={ref} type="button" className={[css.button, BUTTON_VARIANT[variant], size === 'sm' ? css.buttonSm : undefined, className].filter(value => value !== undefined).join(' ')} {...rest}>
      {icon != null && <span className={css.buttonIcon}>{icon}</span>}
      {children}
    </button>
  )
})

/**
 * Focus an automatic destination without a focus outline until keyboard
 * navigation or blur, matching the `data-dsh-automatic-focus` presentation
 * the theme styles. Copied from dsh-client-ui-primitives.
 */
const releases = new WeakMap<HTMLElement, () => void>()
const navigationKeys = new Set(['Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'])
function focusWithoutRing(element: HTMLElement): void {
  releases.get(element)?.()
  const release = (): void => {
    element.removeAttribute('data-dsh-automatic-focus')
    element.removeEventListener('blur', release)
    element.removeEventListener('keydown', navigate, true)
    releases.delete(element)
  }
  const navigate = (event: KeyboardEvent): void => {
    if (!event.isComposing && !event.ctrlKey && !event.altKey && !event.metaKey && navigationKeys.has(event.key)) release()
  }
  releases.set(element, release)
  element.setAttribute('data-dsh-automatic-focus', '')
  element.addEventListener('blur', release)
  element.addEventListener('keydown', navigate, true)
  element.focus()
  if (!element.matches(':focus')) release()
}

/** One selectable row of the dropdown. */
export interface MenuItem {
  readonly id: string
  readonly label: ReactNode
  readonly disabled?: boolean
}

/**
 * Render an anchored dropdown menu portaled to document.body and positioned
 * by CSS anchor positioning with viewport fallbacks, copied from
 * dsh-client-ui-primitives trimmed to this plugin's use: data rows only,
 * below the anchor, opening on the owner's `open` flag. Outside presses,
 * Escape, and Tab close it and hand focus back to the trigger; the arrow
 * keys, Home, and End walk the enabled rows, and selecting a row returns
 * focus once the rows unmount with the list.
 * @param props.open - whether the list is showing (owner-controlled).
 * @param props.anchor - the trigger element, rendered in place.
 * @param props.items - selectable rows (default none).
 * @param props.selectedId - row shown as selected with a trailing check.
 * @param props.onSelect - row activation callback (not called for disabled rows).
 * @param props.onClose - invoked on outside press, Escape, or Tab.
 * @param props.autoFocus - focus the first enabled row on open.
 * @param props.minWidthFromAnchor - keep the menu at least as wide as its anchor.
 * @returns anchor wrapper with the conditional portaled list.
 */
export function Menu({ open, anchor, items = [], selectedId, onSelect, onClose, autoFocus = false, minWidthFromAnchor = false }: {
  open: boolean
  anchor: ReactNode
  items?: readonly MenuItem[]
  selectedId?: string | undefined
  onSelect: (id: string) => void
  onClose: () => void
  autoFocus?: boolean
  minWidthFromAnchor?: boolean
}): ReactNode {
  const rootRef = useRef<HTMLSpanElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  /** Index the arrow walk last focused, the resume point when focus left the rows. */
  const walkIndex = useRef<number | null>(null)
  /** The control that had the keyboard when the menu opened. */
  const triggerRef = useRef<HTMLElement | null>(null)
  const menuId = useId()
  const anchorName = `--dsh-terminal-tab-menu-${menuId.replaceAll(':', '')}`
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  const openRef = useRef(open)
  openRef.current = open

  const rows = (): HTMLButtonElement[] =>
    listRef.current === null ? [] : Array.from(listRef.current.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'))

  const refocusAnchor = (): void => {
    const remembered = triggerRef.current
    const target = remembered !== null && remembered.isConnected ? remembered
      : rootRef.current?.querySelector<HTMLButtonElement>('button:not(:disabled)') ?? null
    if (target !== null) focusWithoutRing(target)
  }

  // Opening remembers where the keyboard was, so closing can hand it back.
  useEffect(() => {
    if (!open) return
    const active = document.activeElement
    triggerRef.current = active instanceof HTMLElement && active !== document.body && rootRef.current?.contains(active) === true
      ? active : null
  }, [open])

  useEffect(() => {
    if (!open || !autoFocus || listRef.current?.contains(document.activeElement) === true) return
    const first = rows()[0]
    walkIndex.current = first === undefined ? null : 0
    if (first !== undefined) focusWithoutRing(first)
  }, [open, autoFocus, items.length])

  useEffect(() => {
    if (!open) {
      walkIndex.current = null
      return
    }
    const onPointerDown = (event: PointerEvent): void => {
      if (!(event.target instanceof Node)) return
      // The portaled list is outside the anchor subtree; check both.
      if (rootRef.current?.contains(event.target) === true || listRef.current?.contains(event.target) === true) return
      closeRef.current()
    }
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.defaultPrevented || event.isComposing || event.ctrlKey || event.altKey || event.metaKey) return
      // Only a keyboard on the trigger or inside the list is intercepted;
      // keys elsewhere on the page stay the browser's.
      const focused = document.activeElement
      const insideList = listRef.current?.contains(focused) === true
      if (!insideList && rootRef.current?.contains(focused) !== true) return
      if (event.key === 'Escape' && !event.shiftKey) {
        event.preventDefault()
        if (event.repeat) return
        closeRef.current()
        refocusAnchor()
        return
      }
      if (event.key === 'Tab') {
        // Tab and Shift+Tab leave the list and return focus to the trigger.
        event.preventDefault()
        closeRef.current()
        refocusAnchor()
        return
      }
      if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
      const buttons = rows()
      if (buttons.length === 0) return
      // The walk resumes from where it last put focus, not from
      // document.activeElement, so a row that refused focus cannot re-enter
      // at the near end on every press.
      const index = buttons.indexOf(focused as HTMLButtonElement)
      const from = index >= 0 ? index : walkIndex.current
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1
        : from === null
          ? (event.key === 'ArrowDown' ? 0 : buttons.length - 1)
          : (from + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length
      event.preventDefault()
      walkIndex.current = next
      buttons[next]?.focus()
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  /** After a selection whose owner closes the list, the rows unmount with it; hand the keyboard back. */
  const refocusAfterSelection = (): void => {
    queueMicrotask(() => {
      if (openRef.current) return
      const active = document.activeElement
      if (active === null || active === document.body || listRef.current?.contains(active) === true) refocusAnchor()
    })
  }

  const list = open && (
    <div ref={listRef} role="menu" className={css.menu} style={{ positionAnchor: anchorName }}
      data-match-anchor-width={minWidthFromAnchor ? '' : undefined}
      // React portals bubble synthetic events through the React tree: without
      // this stop, a row click re-fires the anchor's own onClick after onSelect.
      onClick={(event) => {
        event.stopPropagation()
        refocusAfterSelection()
      }}>
      {items.map(item => (
        <button key={item.id} type="button" role="menuitem" disabled={item.disabled} className={css.menuItem}
          onClick={() => { onSelect(item.id) }}>
          <span className={css.menuItemLabel}>{item.label}</span>
          {item.id === selectedId && <IconCheckOutlineRegular className={css.menuCheck} />}
        </button>
      ))}
    </div>
  )

  return (
    <span ref={rootRef} className={css.menuRoot} style={{ anchorName }}>
      {anchor}
      {list !== false && createPortal(list, document.body)}
    </span>
  )
}
