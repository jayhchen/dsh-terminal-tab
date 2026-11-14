// Build dsh-terminal-tab deliverables:
//   lib/index.js   — host loader entry (empty apply; browser-only plugin)
//   lib/client.js  — browser bundle registered with window.__ModuleLoader__
//
// The client wrapper mirrors the official bundle format exactly:
//   window.__ModuleLoader__.load({id:"<pkg>",factory:require=>{var module={exports:{}};…}}) 
// Externals (react, react-dom) resolve through the page's module registry,
// matching what the web client preloads in its frozen baseline table.
import { build } from 'esbuild'
import { mkdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))

mkdirSync(new URL('../lib', import.meta.url), { recursive: true })

// Host stub (plain ESM).
await build({
  entryPoints: [`${root}src/index.ts`],
  outfile: `${root}lib/index.js`,
  format: 'esm',
  target: 'es2022',
  logLevel: 'info',
})

// Client bundle wrapped for the DSH client module system.
await build({
  entryPoints: [`${root}src/client/index.ts`],
  outfile: `${root}lib/client.js`,
  bundle: true,
  format: 'cjs',
  platform: 'browser',
  target: 'es2022',
  jsx: 'automatic',
  external: ['react', 'react/jsx-runtime', 'react-dom'],
  // CSS ships inside the JS bundle (as text) and is injected at runtime — the
  // client module system never loads sibling .css files.
  loader: { '.css': 'text' },
  sourcemap: true,
  minify: true,
  // Byte-compatible with the official bundles: leading newline, backticked id
  // and `Module`, and a trailing semicolon after `return module.exports}});`.
  banner: {
    js: `\nwindow.__ModuleLoader__.load({id:\`${pkg.name}\`,factory:require=>{`
      + 'var module={exports:{}};var exports=module.exports;'
      + 'Object.defineProperty(exports,Symbol.toStringTag,{value:`Module`});',
  },
  footer: { js: 'return module.exports}});' },
  logLevel: 'info',
})
