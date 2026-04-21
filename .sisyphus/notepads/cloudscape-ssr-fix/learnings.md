# Learnings — Cloudscape SSR Fix

## T3: Import Strategy for Fixed Fork

- **npm alias works**: `"@cloudscape-design/components-fixed": "file:../cloudscape-components/lib/components"` — must point to `lib/components/` not repo root (root has `"files": []` and no exports map)
- **`lib/components/package.json`** has proper `exports` field mapping all component subpaths (`./app-layout-toolbar`, `./side-navigation`, etc.)
- npm creates a **symlink** for `file:` references: `node_modules/@cloudscape-design/components-fixed -> ../../../cloudscape-components/lib/components`
- **esbuild resolves from file location** — test imports MUST be in the project directory, not `/tmp/` (node_modules resolution fails from outside)
- Both mainline and fixed resolve as different objects (`ALT === ALTFixed` is `false`)

## T8: Build Static Script

- **`import.meta.url` is undefined in CJS output** — esbuild with `--format=cjs` sets `import.meta` to empty object. Use `process.cwd()` instead of `fileURLToPath(import.meta.url)`
- **Two copies of React** — when bundling both mainline and fork components, esbuild follows the symlink and may resolve a second React from the fork's dependency tree. Fix: `--external:react --external:react-dom` keeps React as runtime require from the repro's node_modules
- **CSS must be read as string** — `readFileSync` for CSS path, inline into `<style>` tags. Don't import CSS as ES module.
- **esbuild command**: `esbuild build-static.mjs --bundle --platform=node --format=cjs --external:react --external:react-dom --outfile=dist/_build-static.cjs`

## SSR Bug Characterization (Refined)

The bug is broader than just navigation:
- **Mainline**: `AppLayoutToolbar` renders an empty `<div class="awsui_content">` — the **content slot** (and all other slots like navigation) produce no HTML during SSR. Only breadcrumbs (rendered outside the app-layout body) work.
- **Fixed fork**: The `content` slot renders correctly in SSR — the h1/p tags passed via `content` prop appear in the HTML.
- **Navigation drawer** is a client-side interactive element in both versions — it doesn't appear in `renderToString()` output because it depends on client-side state management. This is expected behavior, not a bug.
- The key verifiable difference: `grep "Cloudscape SSR" fixed-closed.html` succeeds, same grep on `mainline-closed.html` fails.
- App-layout region: mainline = 361 chars (empty shell), fixed = 516 chars (with content)

## Build Output

- 5 HTML files generated in `dist/`: index.html + 4 comparison pages
- Each comparison page ~191 KB (mostly inlined Cloudscape CSS)
- No `<script>` tags in any output (pure static SSR)
- Cloudscape CSS inlined from `@cloudscape-design/global-styles/index.css`

## Vite SSG Build (replaced esbuild approach)

- **3-step build**: client build (CSS extraction) → SSR build (generator) → run generator → cleanup
- **`build-ssg.mjs`** orchestrates via Vite's programmatic `build()` API — cleaner than CLI subprocesses
- **Cloudscape globals must be set before component imports** — ESM hoists static imports, so `build-ssg.mjs` sets `globalThis` symbols then uses `await import()` for the SSR build output
- **`ssr.noExternal: true`** required — `dom-helpers` (Cloudscape dep) uses directory imports that fail in Node.js ESM when left external. Bundling everything avoids whack-a-mole with individual packages
- **`resolve.dedupe: ['react', 'react-dom']`** prevents duplicate React when both mainline and fixed fork components are bundled (fork symlink can cause Vite to resolve React from the fork's directory tree)
- **CSS extraction**: client build produces `dist/client/assets/index-*.css` (~623 KB) containing global + component scoped CSS. SSG script reads and inlines it into each HTML page.
- **Output size**: ~613 KB per page (up from ~191 KB with esbuild) because Vite extracts ALL component CSS (not just global-styles). This includes scoped component CSS that esbuild missed.
