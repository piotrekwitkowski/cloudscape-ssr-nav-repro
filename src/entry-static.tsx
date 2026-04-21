import React from 'react';
import { renderToString } from 'react-dom/server';

// Mainline components (published 3.0.1275)
import AppLayoutToolbar from '@cloudscape-design/components/app-layout-toolbar';
import SideNavigation from '@cloudscape-design/components/side-navigation';
import BreadcrumbGroup from '@cloudscape-design/components/breadcrumb-group';

// Fixed components (local fork with SSR fix)
// @ts-expect-error — resolved via npm file: alias, no ambient types
import AppLayoutToolbarFixed from '@cloudscape-design/components-fixed/app-layout-toolbar';
// @ts-expect-error
import SideNavigationFixed from '@cloudscape-design/components-fixed/side-navigation';
// @ts-expect-error
import BreadcrumbGroupFixed from '@cloudscape-design/components-fixed/breadcrumb-group';

// ---------------------------------------------------------------------------
// Shared props
// ---------------------------------------------------------------------------
const navItems = [
  { type: 'link' as const, text: 'Home', href: '/' },
  { type: 'link' as const, text: 'Dashboard', href: '/dashboard' },
  { type: 'link' as const, text: 'Settings', href: '/settings' },
];
const breadcrumbItems = [
  { text: 'App', href: '/' },
  { text: 'Page', href: '/page' },
];

// ---------------------------------------------------------------------------
// Render a page for one combination — returns raw HTML string
// ---------------------------------------------------------------------------
function renderPage(combo: {
  version: string;
  navigationOpen: boolean;
  Components: {
    ALT: React.ComponentType<any>;
    SN: React.ComponentType<any>;
    BG: React.ComponentType<any>;
  };
}) {
  const { version, navigationOpen, Components } = combo;
  const { ALT, SN, BG } = Components;

  const navigation = React.createElement(SN, { items: navItems });
  const breadcrumbs = React.createElement(BG, { items: breadcrumbItems });
  const content = React.createElement(
    'div',
    null,
    React.createElement(
      'h1',
      null,
      `Cloudscape SSR — ${version} — navigation${navigationOpen ? 'Open' : 'Closed'}`,
    ),
    React.createElement(
      'p',
      null,
      'This is a static SSR render. If the side navigation is missing, the SSR bug is present.',
    ),
    React.createElement(
      'p',
      { style: { color: '#666', fontStyle: 'italic', marginTop: '16px' } },
      'Note: This is a pure static SSR render with no JavaScript. ',
      'Buttons and interactive elements are non-functional. See the ',
      React.createElement('a', { href: 'fixed-closed-hydrated.html' }, 'hydrated version'),
      ' for a fully interactive demo.',
    ),
  );

  return renderToString(
    React.createElement(ALT, {
      navigation,
      breadcrumbs,
      content,
      navigationOpen,
      toolsHide: true,
    }),
  );
}

// ---------------------------------------------------------------------------
// Page definitions
// ---------------------------------------------------------------------------
export const pages = [
  {
    file: 'mainline-closed.html',
    title: 'Mainline — navigationOpen=false',
    banner: 'Mainline Cloudscape 3.0.1275 — navigationOpen=false (default)',
    version: 'mainline' as const,
    navigationOpen: false,
    Components: { ALT: AppLayoutToolbar, SN: SideNavigation, BG: BreadcrumbGroup },
  },
  {
    file: 'mainline-open.html',
    title: 'Mainline — navigationOpen=true',
    banner: 'Mainline Cloudscape 3.0.1275 — navigationOpen=true',
    version: 'mainline' as const,
    navigationOpen: true,
    Components: { ALT: AppLayoutToolbar, SN: SideNavigation, BG: BreadcrumbGroup },
  },
  {
    file: 'fixed-closed.html',
    title: 'Fixed — navigationOpen=false',
    banner: 'Fixed Fork (SSR patch) — navigationOpen=false (default)',
    version: 'fixed' as const,
    navigationOpen: false,
    Components: { ALT: AppLayoutToolbarFixed, SN: SideNavigationFixed, BG: BreadcrumbGroupFixed },
  },
  {
    file: 'fixed-open.html',
    title: 'Fixed — navigationOpen=true',
    banner: 'Fixed Fork (SSR patch) — navigationOpen=true',
    version: 'fixed' as const,
    navigationOpen: true,
    Components: { ALT: AppLayoutToolbarFixed, SN: SideNavigationFixed, BG: BreadcrumbGroupFixed },
  },
];

// ---------------------------------------------------------------------------
// Export: render all pages and return array of { file, title, banner, version, html }
// ---------------------------------------------------------------------------
export function renderAllPages() {
  return pages.map((page) => ({
    file: page.file,
    title: page.title,
    banner: page.banner,
    version: page.version,
    html: renderPage(page),
  }));
}
