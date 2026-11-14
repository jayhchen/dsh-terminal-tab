<p align="center">
  <img src="assets/banner.webp" alt="dsh-terminal-tab — A persistent terminal tab in the conversation view row" width="100%">
</p>

<div align="center">

<img src="icon.svg" width="96" alt="dsh-terminal-tab icon" />

# dsh-terminal-tab

**A terminal tab for the Conversation view row of DeepSeek Harness (DSH) — the same persistent shells as the sidebar terminal, mounted as a top tab.**

[![npm](https://img.shields.io/npm/v/dsh-terminal-tab)](https://www.npmjs.com/package/dsh-terminal-tab)
[![dsh](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fjayhchen%2Fdsh-terminal-tab%2Fmain%2Fpackage.json&query=%24.engines.dsh&label=dsh)](https://github.com/jayhchen/dsh-terminal-tab)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![English](https://img.shields.io/badge/README-English-blue)](./README.md)
[![简体中文](https://img.shields.io/badge/README-%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87-red)](./README.zh-CN.md)

</div>

Adds a **Terminal** tab to the top row where "Conversation / Trace" live (after Conversation, before Trace). It behaves exactly like the sidebar terminal — same persistent shells, same auto-recovery — just with the entry point moved to the top.

Works with DSH `0.2.2-rc.2` and later `0.2.x` releases.

## Features

- **Opens straight into a shell**: one fixed terminal per session, started in the session's current working directory
- **Auto-recovery**: refresh the page or reopen the browser and the terminal reconnects, screen content intact
- **Never reclaimed**: switching tabs or sessions never kills it — the terminal keeps running as long as the window stays open
- **Explicit close**: the floating close button (top-right) ends the process; the "closed" state survives page refreshes until you click "New terminal"
- **Default shell**: switch it in Settings → Plugins → Installed → `dsh-terminal-tab` detail page; sidebar terminals follow the same choice
- **After a service restart**: shows "This terminal no longer exists" with a one-click recreate
- The top tab and the sidebar share the same pool of terminal processes

<p align="center">
  <img src="assets/terminal-tab.webp" alt="The Terminal tab in the conversation view row" width="70%">
</p>

## Installation

Web:

```
dsh plugin --profile web add dsh-terminal-tab
dsh plugin --profile web update dsh-terminal-tab
```

Desktop:

```
dsh plugin --profile desktop add dsh-terminal-tab
dsh plugin --profile desktop update dsh-terminal-tab
```

## License

[MIT](./LICENSE)
