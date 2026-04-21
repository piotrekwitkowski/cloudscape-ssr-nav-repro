import { build } from 'vite';
import { rmSync, mkdirSync, writeFileSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const rootDir = process.cwd();
const distDir = join(rootDir, 'dist');

rmSync(distDir, { recursive: true, force: true });
mkdirSync(distDir, { recursive: true });

// Step 1 — Extract CSS via client builds (mainline + fixed with different hashes)
console.log('Building CSS (mainline)...');
await build({ build: { outDir: 'dist/_css-mainline' }, logLevel: 'warn' });

console.log('Building CSS (fixed fork)...');
await build({
  build: { outDir: 'dist/_css-fixed' },
  logLevel: 'warn',
  resolve: {
    alias: [
      {
        find: /^@cloudscape-design\/components(\/|$)/,
        replacement: '@cloudscape-design/components-fixed$1',
      },
    ],
    dedupe: ['react', 'react-dom'],
  },
});

console.log('Building hydrated client bundle (fixed fork)...');
await build({
  build: {
    outDir: 'dist/client',
    rollupOptions: {
      input: { 'entry-client-hydrate': join(rootDir, 'src/entry-client-hydrate.tsx') },
    },
  },
  resolve: {
    alias: [
      {
        find: /^@cloudscape-design\/components(\/|$)/,
        replacement: '@cloudscape-design/components-fixed$1',
      },
    ],
    dedupe: ['react', 'react-dom'],
  },
  logLevel: 'warn',
});

function readCSS(buildDir) {
  const assetsDir = join(rootDir, buildDir, 'assets');
  const files = readdirSync(assetsDir).filter((f) => f.endsWith('.css'));
  if (files.length === 0) throw new Error(`No CSS in ${buildDir}`);
  const css = files.map((f) => readFileSync(join(assetsDir, f), 'utf8')).join('\n');
  console.log(`  ${buildDir}: ${files.length} file(s), ${(css.length / 1024).toFixed(0)} KB`);
  return css;
}

const mainlineCSS = readCSS('dist/_css-mainline');
const fixedCSS = readCSS('dist/_css-fixed');

// Step 2 — Build SSR generator bundle
console.log('\nBuilding SSR bundle...');
await build({ build: { ssr: 'src/entry-static.tsx', outDir: 'dist/_ssr' }, logLevel: 'warn' });

console.log('Building SSR hydrate bundle (fixed fork)...');
await build({
  build: { ssr: 'src/entry-ssr-hydrate.tsx', outDir: 'dist/_ssr-hydrate' },
  resolve: {
    alias: [
      {
        find: /^@cloudscape-design\/components(\/|$)/,
        replacement: '@cloudscape-design/components-fixed$1',
      },
    ],
    dedupe: ['react', 'react-dom'],
  },
  logLevel: 'warn',
});

// Step 3 — Render pages
console.log('\nRendering pages...');
globalThis[Symbol.for('awsui-visual-refresh-flag')] = () => true;
globalThis[Symbol.for('awsui-global-flags')] = { appLayoutToolbar: true };

const { renderAllPages } = await import('./dist/_ssr/entry-static.js');
const rendered = renderAllPages();

const { renderForHydration } = await import('./dist/_ssr-hydrate/entry-ssr-hydrate.js');
const clientAssetsDir = join(rootDir, 'dist/client/assets');
const clientFiles = readdirSync(clientAssetsDir);
const clientJS = clientFiles.find((f) => f.endsWith('.js'));
if (!clientJS) throw new Error('No JS bundle found in dist/client/assets/');
console.log(`  hydrate client JS: ${clientJS}`);

// Step 4 — Post-process: move breadcrumbs into a toolbar-bar inside the CSS Grid
function postProcessAppHtml(rawHtml) {
  const bcPattern = /(<span class="awsui_root_xttbq_[^"]*">[\s\S]*?<\/span>)(\s*<div class="awsui-context-app-layout-toolbar">)/;
  const bcMatch = rawHtml.match(bcPattern);
  if (!bcMatch) return rawHtml;

  const breadcrumbHtml = bcMatch[1];
  let html = rawHtml.replace(breadcrumbHtml, '');

  const gridRootPattern = /(<div[^>]*class="awsui_root_7nfqu_[^"]*[^>]*>)/;
  const gridMatch = html.match(gridRootPattern);
  if (gridMatch) {
    const toolbarBar = `<div class="ssr-toolbar-bar">${breadcrumbHtml}</div>`;
    html = html.replace(gridMatch[0], gridMatch[0] + toolbarBar);
  }

  return html;
}

const layoutCSS = `
.ssr-toolbar-bar {
  grid-area: toolbar;
  position: relative;
  display: flex;
  align-items: center;
  block-size: 42px;
  padding-inline: 20px;
  border-block-end: 1px solid var(--color-border-layout-ayg8vb, #c6c6cd);
  background-color: var(--color-background-layout-main-5ilwcb, #ffffff);
}
#app .ssr-toolbar-bar > span {
  position: relative !important;
  inset-block-start: auto !important;
  inset-inline-start: auto !important;
}
html, body { margin: 0; padding: 0; }
body.awsui-visual-refresh {
  background-color: var(--color-background-layout-main-5ilwcb, #ffffff);
}
.ssr-banner {
  padding: 12px 24px;
  font-family: "Amazon Ember", system-ui, sans-serif;
  border-bottom: 2px solid #0972d3;
  background: #fafafa;
}
.ssr-banner h2 { margin: 0 0 4px; font-size: 16px; }
.ssr-banner p { margin: 0; color: #555; font-size: 13px; }
.ssr-banner a { color: #0972d3; }
`;

function htmlDocument({ title, banner, bodyHtml, css }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>${css}</style>
  <style>${layoutCSS}</style>
</head>
<body class="awsui-visual-refresh">
  <div class="ssr-banner">
    <h2>${banner}</h2>
    <p><a href="index.html">&larr; Back to index</a></p>
  </div>
  <div id="app">${bodyHtml}</div>
</body>
</html>`;
}

function hydratedHtmlDocument({ title, banner, bodyHtml, css, jsFile, navigationOpen }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>${css}</style>
  <style>${layoutCSS}</style>
</head>
<body class="awsui-visual-refresh">
  <script>
    globalThis[Symbol.for('awsui-visual-refresh-flag')] = () => true;
    globalThis[Symbol.for('awsui-global-flags')] = { appLayoutToolbar: true };
  </script>
  <div class="ssr-banner">
    <h2>${banner}</h2>
    <p><a href="index.html">&larr; Back to index</a></p>
  </div>
  <div id="app" data-navigation-open="${navigationOpen}">${bodyHtml}</div>
  <script type="module" src="./client/assets/${jsFile}"></script>
</body>
</html>`;
}

for (const page of rendered) {
  const css = page.version === 'fixed' ? fixedCSS : mainlineCSS;
  const bodyHtml = postProcessAppHtml(page.html);
  const fullHtml = htmlDocument({
    title: page.title,
    banner: page.banner,
    bodyHtml,
    css,
  });
  writeFileSync(join(distDir, page.file), fullHtml, 'utf8');
  console.log(`  wrote ${page.file} (${(fullHtml.length / 1024).toFixed(1)} KB)`);
}

// Render hydrated pages
console.log('\nRendering hydrated pages...');
const hydratedPages = [
  {
    file: 'fixed-closed-hydrated.html',
    title: 'Fixed (Hydrated) — navigationOpen=false',
    banner: 'Fixed Fork (SSR + Hydration) — navigationOpen=false',
    navigationOpen: false,
  },
  {
    file: 'fixed-open-hydrated.html',
    title: 'Fixed (Hydrated) — navigationOpen=true',
    banner: 'Fixed Fork (SSR + Hydration) — navigationOpen=true',
    navigationOpen: true,
  },
];

for (const page of hydratedPages) {
  const bodyHtml = renderForHydration(page.navigationOpen);
  const fullHtml = hydratedHtmlDocument({
    title: page.title,
    banner: page.banner,
    bodyHtml,
    css: fixedCSS,
    jsFile: clientJS,
    navigationOpen: page.navigationOpen,
  });
  writeFileSync(join(distDir, page.file), fullHtml, 'utf8');
  console.log(`  wrote ${page.file} (${(fullHtml.length / 1024).toFixed(1)} KB)`);
}

// Step 5 — Index page
const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Cloudscape SSR Navigation Bug — Comparison</title>
  <style>
    body { font-family: "Amazon Ember", system-ui, sans-serif; max-width: 1200px; margin: 40px auto; padding: 0 20px; line-height: 1.6; }
    h1 { border-bottom: 2px solid #0972d3; padding-bottom: 8px; }
    table { border-collapse: collapse; width: 100%; margin: 24px 0; }
    th, td { border: 1px solid #ddd; padding: 10px 14px; text-align: left; }
    th { background: #f0f3f5; }
    a { color: #0972d3; }
    .pass { color: #037f0c; font-weight: bold; }
    .fail { color: #d91515; font-weight: bold; }
    code { background: #f0f3f5; padding: 2px 6px; border-radius: 3px; }
  </style>
</head>
<body>
  <h1>Cloudscape AppLayoutToolbar SSR Bug — Comparison</h1>
  <p>
    These pages are <strong>pure static SSR output</strong> from <code>ReactDOMServer.renderToString()</code>.
    No JavaScript is executed in the browser — what you see is exactly what the server sends.
  </p>
  <p>
    <strong>Bug:</strong> In mainline 3.0.1275, <code>AppLayoutToolbar</code> does not render content,
    navigation trigger, or navigation panel during SSR. The <code>useMultiAppLayout</code> hook depends on
    <code>useLayoutEffect</code> for registration, which never fires server-side — leaving
    <code>toolbarProps</code> null and <code>registered</code> false.
  </p>
  <p>
    <strong>Fix:</strong> The fork adds an SSR bypass in <code>useMultiAppLayout</code> that returns sensible
    defaults during SSR (<code>registered: true</code>, valid <code>toolbarProps</code>). This enables the
    skeleton to render all slot content server-side.
  </p>

  <h2>Comparison Pages</h2>
  <table>
    <tr>
      <th>Version</th>
      <th>navigationOpen</th>
      <th>Result</th>
      <th>Page</th>
    </tr>
    <tr>
      <td>Mainline 3.0.1275</td>
      <td><code>false</code> (default)</td>
      <td class="fail">Empty layout — no content, no trigger, no nav (bug)</td>
      <td><a href="mainline-closed.html">mainline-closed.html</a></td>
    </tr>
    <tr>
      <td>Mainline 3.0.1275</td>
      <td><code>true</code></td>
      <td class="fail">Empty layout — no content, no trigger, no nav (bug)</td>
      <td><a href="mainline-open.html">mainline-open.html</a></td>
    </tr>
    <tr>
      <td>Fixed Fork</td>
      <td><code>false</code> (default)</td>
      <td class="pass">Content rendered, hamburger trigger visible (fix)</td>
      <td><a href="fixed-closed.html">fixed-closed.html</a></td>
    </tr>
    <tr>
      <td>Fixed Fork</td>
      <td><code>true</code></td>
      <td class="pass">Content rendered, nav panel open with links (fix)</td>
      <td><a href="fixed-open.html">fixed-open.html</a></td>
    </tr>
  </table>

  <h2>Hydrated Pages (SSG + Client Hydration)</h2>
  <p>These pages include client JavaScript that hydrates the SSR output, making everything interactive.
     Buttons work, navigation toggles, links are clickable.</p>
  <table>
    <tr><th>Version</th><th>navigationOpen</th><th>Result</th><th>Page</th></tr>
    <tr>
      <td>Fixed Fork</td><td><code>false</code></td>
      <td class="pass">Full SSG + hydration — fully interactive</td>
      <td><a href="fixed-closed-hydrated.html">fixed-closed-hydrated.html</a></td>
    </tr>
    <tr>
      <td>Fixed Fork</td><td><code>true</code></td>
      <td class="pass">Full SSG + hydration — nav panel open, fully interactive</td>
      <td><a href="fixed-open-hydrated.html">fixed-open-hydrated.html</a></td>
    </tr>
  </table>

  <h2>What to Look For</h2>
  <ul>
    <li><strong>Mainline pages:</strong> The content area below the toolbar is <em>completely empty</em>.
        No hamburger trigger button, no navigation panel, no content — only breadcrumbs render.
        This confirms the SSR bug.</li>
    <li><strong>Fixed pages (static):</strong> Content area renders the heading and paragraph text.
        Hamburger trigger (≡) is visible in the toolbar. With <code>navigationOpen=true</code>,
        the SideNavigation panel shows links (Home, Dashboard, Settings).
        Buttons are non-functional (no JavaScript).</li>
    <li><strong>Fixed pages (hydrated):</strong> Same SSR output as the static fixed pages, plus client
        JavaScript that hydrates the app. Hamburger button toggles the navigation drawer. Links are
        clickable. This demonstrates the full SSR → hydration flow.</li>
  </ul>

  <h2>Next Step</h2>
  <p>
    Replace the skeleton SSR path with the real <code>AppLayoutToolbar</code> implementation
    during server rendering. The skeleton exists for client-side code splitting but is unnecessary
    during SSR where all code is available synchronously. Rendering the implementation directly
    eliminates the layout shift on hydration and removes duplicated rendering logic.
  </p>
</body>
</html>`;

writeFileSync(join(distDir, 'index.html'), indexHtml, 'utf8');
console.log('  wrote index.html');

// Step 6 — Cleanup
rmSync(join(rootDir, 'dist/_css-mainline'), { recursive: true, force: true });
rmSync(join(rootDir, 'dist/_css-fixed'), { recursive: true, force: true });
rmSync(join(rootDir, 'dist/_ssr'), { recursive: true, force: true });
rmSync(join(rootDir, 'dist/_ssr-hydrate'), { recursive: true, force: true });

console.log('\nDone! Static pages in dist/');
