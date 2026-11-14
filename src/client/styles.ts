/** Styles for the conversation terminal tab, owned by one plugin-scoped tag. */
import type { Context } from '@deepseek-ai/cordis'
import xtermCss from '@xterm/xterm/css/xterm.css'

/** Package name: the key the module system uses to reclaim a plugin's style tags. */
const PLUGIN_ID = 'dsh-terminal-tab'

const stylesheet = `
${xtermCss}
.dsh-terminal-tab-root { position: relative; display: flex; flex: 1; flex-direction: column; box-sizing: border-box; height: 100%; min-height: 0; color: var(--dsw-alias-label-primary); font-size: 13px; }
.dsh-terminal-tab-screen { flex: 1; min-height: 0; min-width: 0; overflow: hidden; padding: 6px 8px; color: var(--dsw-alias-label-primary); background: var(--dsw-alias-bg-base); }
.dsh-terminal-tab-screen .xterm { height: 100%; }
.dsh-terminal-tab-screen .xterm-viewport { background: var(--dsw-alias-bg-base); }
.dsh-terminal-tab-close { position: absolute; top: 4px; right: 6px; z-index: 3; opacity: 0.45; transition: opacity 120ms ease; }
.dsh-terminal-tab-root:hover .dsh-terminal-tab-close, .dsh-terminal-tab-close:focus-visible { opacity: 1; }
.dsh-terminal-tab-status { position: absolute; top: 8px; left: 12px; right: 44px; z-index: 2; display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 6px 10px; border-radius: 8px; background: var(--dsw-alias-bg-l2); --dsw-elevation-stroke-color: var(--dsw-alias-border-l3); box-shadow: var(--dsw-elevation-prominent); overflow-wrap: anywhere; }
.dsh-terminal-tab-empty { display: flex; flex: 1; flex-direction: column; align-items: center; justify-content: center; gap: 14px; min-height: 0; padding: 24px; text-align: center; }
.dsh-terminal-tab-empty p { max-width: 28ch; margin: 0; line-height: 1.6; overflow-wrap: anywhere; }
.dsh-terminal-tab-settings { display: flex; flex-direction: column; }
.dsh-terminal-tab-settings-title { margin: 0; font-size: 14px; font-weight: 500; line-height: 20px; color: var(--dsw-alias-label-primary); }
.dsh-terminal-tab-settings-field { display: flex; flex-direction: column; gap: 6px; padding: 8px 0 12px; }
.dsh-terminal-tab-settings-select { display: inline-flex; align-items: center; justify-content: space-between; gap: 12px; width: 100%; height: 34px; padding: 0 12px; border: 0.5px solid var(--dsw-alias-border-l4); border-radius: var(--dsw-radius-md); background: var(--dsw-alias-bg-layer-3); font: inherit; font-size: 13px; line-height: 1.5; color: var(--dsw-alias-label-primary); text-align: start; cursor: pointer; }
.dsh-terminal-tab-settings-select:focus-visible { outline: none; border-color: var(--dsw-alias-state-business-primary); }
.dsh-terminal-tab-settings-select-name { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dsh-terminal-tab-settings-chevron { flex: none; width: 14px; height: 14px; color: var(--dsw-alias-label-tertiary); }
.dsh-terminal-tab-settings-hint { margin: 0; font-size: 12px; line-height: 1.5; color: var(--dsw-alias-label-tertiary); overflow-wrap: anywhere; }

/* Cursor colors depend on its cell, so they must not update xterm's shared ANSI theme. */
.dsh-terminal-tab-screen .xterm-cursor { opacity: 1; }
.dsh-terminal-tab-screen .xterm .xterm-rows .xterm-cursor.xterm-cursor-block { background-color: var(--terminal-cursor); color: var(--terminal-cursor-accent); }
.dsh-terminal-tab-screen .xterm .xterm-rows .xterm-cursor.xterm-cursor-block:not(.xterm-cursor-blink) { background-color: var(--terminal-cursor) !important; color: var(--terminal-cursor-accent) !important; }
.dsh-terminal-tab-screen .xterm .xterm-rows .xterm-cursor.xterm-cursor-outline { outline-color: var(--terminal-cursor); }
.dsh-terminal-tab-screen .xterm .xterm-rows .xterm-cursor.xterm-cursor-bar { box-shadow: 1px 0 0 var(--terminal-cursor) inset; }
.dsh-terminal-tab-screen .xterm .xterm-rows .xterm-cursor.xterm-cursor-underline { border-bottom-color: var(--terminal-cursor); }
.dsh-terminal-tab-screen .xterm .xterm-rows.xterm-focus .xterm-cursor.xterm-cursor-block.xterm-cursor-blink { animation: dsh-terminal-tab-cursor-blink 1s step-end infinite; }
@keyframes dsh-terminal-tab-cursor-blink { 0% { background-color: var(--terminal-cursor); color: var(--terminal-cursor-accent); } 50% { background-color: var(--terminal-cursor-cell-background); color: var(--terminal-cursor-cell-foreground); } }

/* Controls copied from dsh-client-ui-primitives under this plugin's prefix. */
.dsh-terminal-tab-button { box-sizing: border-box; display: inline-flex; align-items: center; justify-content: center; gap: 4px; border: none; border-radius: var(--dsw-radius-md); cursor: pointer; font-size: 14px; line-height: 22px; color: var(--dsw-alias-label-primary); background: transparent; padding: 0 14px; height: 36px; }
.dsh-terminal-tab-button:disabled { cursor: not-allowed; opacity: 0.4; }
.dsh-terminal-tab-button-sm { height: 28px; font-size: 12px; line-height: 18px; padding: 0 10px; border-radius: var(--dsw-radius-sm); }
.dsh-terminal-tab-button-primary { background: var(--dsw-alias-button-primary-fill); color: var(--dsw-alias-label-primary-foreground); }
.dsh-terminal-tab-button-ghost:active:not(:disabled) { background: var(--dsw-alias-interactive-bg-active); }
/* The transparent border preserves layout; the inset stroke stays complete at fractional widths. */
.dsh-terminal-tab-button-outline { border: 0.5px solid transparent; background: transparent; box-shadow: inset 0 0 0 var(--dsh-hairline-width, 0.5px) var(--dsh-button-outline-color, var(--dsw-alias-border-l3)); }
.dsh-terminal-tab-button-toolbar { background: var(--dsw-alias-button-tool-bar-fill); }
@media (hover: hover) {
  .dsh-terminal-tab-button-primary:hover:not(:disabled) { background: var(--dsw-alias-button-primary-hover); }
  .dsh-terminal-tab-button-ghost:hover:not(:disabled) { background: var(--dsw-alias-interactive-bg-hover); }
  .dsh-terminal-tab-button-outline:hover:not(:disabled) { background: var(--dsw-alias-interactive-bg-hover); }
  .dsh-terminal-tab-button-toolbar:hover:not(:disabled) { background: var(--dsw-alias-button-tool-bar-hover); }
}
.dsh-terminal-tab-button-icon { display: inline-flex; width: 16px; height: 16px; align-items: center; justify-content: center; }

/* Dropdown menu copied from dsh-client-ui-primitives: translucent card portaled to
   the body and fixed-positioned by CSS anchor positioning with viewport fallbacks.
   Candidates reserve layout-window margins while browser zoom moves the page. */
.dsh-terminal-tab-menu-root { position: relative; display: inline-flex; }
.dsh-terminal-tab-menu {
  --dsh-terminal-tab-menu-window-top: max(12px, var(--dsh-frame-overlay-top, 12px));
  box-sizing: border-box;
  padding: 4px;
  display: flex;
  flex-direction: column;
  gap: 0;
  border: 0;
  border-radius: var(--dsw-radius-lg);
  --dsw-elevation-stroke-color: var(--dsw-alias-border-l1);
  box-shadow: var(--dsw-elevation-prominent);
  --dsh-scrollbar-thumb: var(--dsw-alias-scrollbar-bg-l2);
  --dsh-scrollbar-thumb-hover: var(--dsw-alias-scrollbar-hover-l2);
  isolation: isolate;
  position: fixed;
  position-area: none;
  top: max(var(--dsh-terminal-tab-menu-window-top), calc(anchor(bottom) + 4px));
  bottom: 12px;
  left: max(12px, anchor(left));
  right: 12px;
  justify-self: start;
  align-self: start;
  margin: 0;
  position-try-fallbacks: --dsh-terminal-tab-menu-wide-below, --dsh-terminal-tab-menu-above, --dsh-terminal-tab-menu-wide-above, --dsh-terminal-tab-menu-window, --dsh-terminal-tab-menu-wide-window;
  width: max-content;
  min-width: min(144px, calc(100vw - 24px));
  max-width: min(360px, calc(100vw - 24px));
  height: fit-content;
  max-height: calc(100dvh - 12px - max(12px, var(--dsh-frame-overlay-top, 12px)));
  overflow-y: auto;
  z-index: 1100;
}
.dsh-terminal-tab-menu[data-match-anchor-width] { min-width: min(anchor-size(width), calc(100vw - 24px)); }
/* Filtering only the background keeps the card free of a backdrop root. */
.dsh-terminal-tab-menu::before { content: ''; position: absolute; inset: 0; z-index: -1; border-radius: inherit; background: var(--dsw-menu-surface-fill); backdrop-filter: var(--dsw-menu-backdrop-filter); pointer-events: none; }
@position-try --dsh-terminal-tab-menu-wide-below {
  top: max(var(--dsh-terminal-tab-menu-window-top), calc(anchor(bottom) + 4px));
  bottom: 12px;
  left: 12px;
  right: 12px;
  align-self: start;
  justify-self: safe end;
}
@position-try --dsh-terminal-tab-menu-above {
  top: var(--dsh-terminal-tab-menu-window-top);
  bottom: max(12px, calc(anchor(top) + 4px));
  align-self: end;
}
@position-try --dsh-terminal-tab-menu-wide-above {
  top: var(--dsh-terminal-tab-menu-window-top);
  bottom: max(12px, calc(anchor(top) + 4px));
  left: 12px;
  right: 12px;
  align-self: end;
  justify-self: safe end;
}
/* A tall card keeps its trigger alignment before horizontal clamping is needed. */
@position-try --dsh-terminal-tab-menu-window { top: var(--dsh-terminal-tab-menu-window-top); bottom: 12px; align-self: safe start; }
@position-try --dsh-terminal-tab-menu-wide-window { top: var(--dsh-terminal-tab-menu-window-top); left: 12px; right: 12px; bottom: 12px; align-self: safe start; justify-self: safe end; }
.dsh-terminal-tab-menu-item { display: flex; align-items: center; gap: 6px; width: 100%; min-height: 34px; padding: 6px 8px; border: none; border-radius: var(--dsw-radius-md); background: transparent; cursor: pointer; font-size: 13px; line-height: 20px; color: var(--dsw-alias-label-primary); text-align: left; }
@media (hover: hover) {
  .dsh-terminal-tab-menu-item:hover:not(:disabled) { background: var(--dsw-alias-interactive-bg-hover); }
}
/* Arrow navigation moves real focus, so the focused row carries the same fill the
   pointer gets; the browser's default ring would double it. */
.dsh-terminal-tab-menu-item:focus-visible:not(:disabled) { background: var(--dsw-alias-interactive-bg-hover); outline: none; }
.dsh-terminal-tab-menu-item:disabled { opacity: 0.4; cursor: not-allowed; }
.dsh-terminal-tab-menu-item-label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dsh-terminal-tab-menu-check { flex: none; width: 14px; height: 14px; color: var(--dsw-alias-label-primary); }
`

/**
 * Install the stylesheet as one plugin-owned tag, so hot reload and plugin
 * teardown replace or remove it instead of leaving stale rules in the document.
 * @param ctx - client root context owning the tag's lifetime.
 */
export function installStyles(ctx: Context): void {
  ctx.effect(() => {
    const tag = document.createElement('style')
    tag.dataset.plugin = PLUGIN_ID
    tag.dataset.pluginCss = `${PLUGIN_ID}/terminal`
    tag.textContent = stylesheet
    document.head.append(tag)
    return () => { tag.remove() }
  }, 'dsh-terminal-tab.stylesheet')
}

/** Scoped class names used by this plugin's components. */
export const css = {
  root: 'dsh-terminal-tab-root',
  screen: 'dsh-terminal-tab-screen',
  close: 'dsh-terminal-tab-close',
  status: 'dsh-terminal-tab-status',
  empty: 'dsh-terminal-tab-empty',
  settings: 'dsh-terminal-tab-settings',
  settingsTitle: 'dsh-terminal-tab-settings-title',
  settingsField: 'dsh-terminal-tab-settings-field',
  settingsSelect: 'dsh-terminal-tab-settings-select',
  settingsSelectName: 'dsh-terminal-tab-settings-select-name',
  settingsChevron: 'dsh-terminal-tab-settings-chevron',
  settingsHint: 'dsh-terminal-tab-settings-hint',
  button: 'dsh-terminal-tab-button',
  buttonSm: 'dsh-terminal-tab-button-sm',
  buttonPrimary: 'dsh-terminal-tab-button-primary',
  buttonGhost: 'dsh-terminal-tab-button-ghost',
  buttonOutline: 'dsh-terminal-tab-button-outline',
  buttonToolbar: 'dsh-terminal-tab-button-toolbar',
  buttonIcon: 'dsh-terminal-tab-button-icon',
  menuRoot: 'dsh-terminal-tab-menu-root',
  menu: 'dsh-terminal-tab-menu',
  menuItem: 'dsh-terminal-tab-menu-item',
  menuItemLabel: 'dsh-terminal-tab-menu-item-label',
  menuCheck: 'dsh-terminal-tab-menu-check',
} as const