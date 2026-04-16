// Global flags MUST be set before any Cloudscape import
globalThis[Symbol.for('awsui-visual-refresh-flag')] = () => true;
globalThis[Symbol.for('awsui-global-flags')] = { appLayoutToolbar: true };

import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import React from 'react';
import { renderToString } from 'react-dom/server';
import AppLayoutToolbar from '@cloudscape-design/components/app-layout-toolbar';
import SideNavigation from '@cloudscape-design/components/side-navigation';
import BreadcrumbGroup from '@cloudscape-design/components/breadcrumb-group';

const cloudscapeCss = readFileSync('node_modules/@cloudscape-design/global-styles/index.css', 'utf8');

const navItems = [{ type: 'link', text: 'Home', href: '/' }];
const breadcrumbItems = [{ text: 'Home', href: '/' }];

const navigation = React.createElement(SideNavigation, { items: navItems });
const breadcrumbs = React.createElement(BreadcrumbGroup, { items: breadcrumbItems });

// Demo A: Default (navigation drawer closed)
const demoA = React.createElement(AppLayoutToolbar, {
  navigation,
  breadcrumbs,
  content: React.createElement('h2', null, 'Demo A: Default (drawer closed)'),
  toolsHide: true,
});

// Demo B: navigationOpen={true}
const demoB = React.createElement(AppLayoutToolbar, {
  navigation,
  breadcrumbs: React.createElement(BreadcrumbGroup, { items: breadcrumbItems }),
  content: React.createElement('h2', null, 'Demo B: Drawer open (navigationOpen=true)'),
  navigationOpen: true,
  toolsHide: true,
});

const demoAHtml = renderToString(demoA);
const demoBHtml = renderToString(demoB);

mkdirSync('docs', { recursive: true });
writeFileSync('docs/index.html', `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Cloudscape AppLayoutToolbar SSR Repro</title>
  <style>${cloudscapeCss}</style>
  <style>
    .demo-section { margin: 2rem 0; border: 2px solid #0972d3; padding: 1rem; }
    .demo-label { background: #0972d3; color: white; padding: 0.5rem 1rem; margin: -1rem -1rem 1rem; }
  </style>
</head>
<body class="awsui-visual-refresh">
  <h1>Cloudscape AppLayoutToolbar SSR Reproduction</h1>
  <p>This page shows raw <code>renderToString</code> output. No client-side JavaScript is executed.</p>

  <div class="demo-section">
    <div class="demo-label">Demo A: Default (navigation drawer closed)</div>
    <!-- SSR output for Demo A -->
    ${demoAHtml}
  </div>

  <!-- Expected: Demo A nav drawer is collapsed/hidden (default state).
       Demo B nav drawer should be open because navigationOpen=true.
       Compare the rendered HTML between both demos. -->

  <div class="demo-section">
    <div class="demo-label">Demo B: navigationOpen={true}</div>
    <!-- SSR output for Demo B -->
    ${demoBHtml}
  </div>

  <!-- NO <script> tags — this is pure SSR output -->
</body>
</html>`);

console.log('Generated docs/index.html');
