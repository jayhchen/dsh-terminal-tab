/** CSS imports resolve to their text content (esbuild text loader; injected at runtime). */

declare module '*.css' {
  const content: string
  export default content
}
