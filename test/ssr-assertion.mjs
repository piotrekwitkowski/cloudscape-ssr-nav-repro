// Global flags MUST be set before any Cloudscape import
globalThis[Symbol.for('awsui-visual-refresh-flag')] = () => true;
globalThis[Symbol.for('awsui-global-flags')] = { appLayoutToolbar: true };

import React from 'react';
import { renderToString } from 'react-dom/server';
import AppLayoutToolbar from '@cloudscape-design/components/app-layout-toolbar';
import SideNavigation from '@cloudscape-design/components/side-navigation';
import BreadcrumbGroup from '@cloudscape-design/components/breadcrumb-group';

const navItems = [{ type: 'link', text: 'Home', href: '/' }];
const breadcrumbItems = [{ text: 'Home', href: '/' }];

const navigation = React.createElement(SideNavigation, { items: navItems });
const breadcrumbs = React.createElement(BreadcrumbGroup, { items: breadcrumbItems });

// --- Render A: Default (navigation drawer closed) ---
const demoA = React.createElement(AppLayoutToolbar, {
  navigation,
  breadcrumbs,
  content: React.createElement('h2', null, 'Default (drawer closed)'),
  toolsHide: true,
});
const htmlA = renderToString(demoA);

// --- Render B: navigationOpen={true} ---
const demoB = React.createElement(AppLayoutToolbar, {
  navigation,
  breadcrumbs: React.createElement(BreadcrumbGroup, { items: breadcrumbItems }),
  content: React.createElement('h2', null, 'Drawer open (navigationOpen=true)'),
  navigationOpen: true,
  toolsHide: true,
});
const htmlB = renderToString(demoB);

// === Assertions ===
const bugs = [];
let checks = 0;

// Check 1: SideNavigation content missing from SSR output
// SideNavigation renders links with the text "Home" — look for nav-specific markers
// BreadcrumbGroup also has "Home", so check for SideNavigation-specific class/structure
const hasNavLink = htmlA.includes('side-navigation') || htmlB.includes('side-navigation');
const hasNavLinkText = (() => {
  // Look for an anchor with href="/" inside a nav-like container that ISN'T breadcrumbs
  // SideNavigation uses awsui_link class patterns
  const sideNavPattern = /side-navigation.*?>Home</s;
  return sideNavPattern.test(htmlA) || sideNavPattern.test(htmlB);
})();

checks++;
if (!hasNavLinkText) {
  bugs.push('SideNavigation content ("Home" link) missing from SSR output');
}

// Check 2: Navigation trigger/hamburger button missing
const hasTrigger = (() => {
  const triggerPatterns = [
    /aria-label=".*navigation.*"/i,
    /navigation-toggle/,
    /awsui_trigger/,
    /button.*?toggle.*?nav/is,
    /data-testid=".*toggle.*"/,
  ];
  return triggerPatterns.some(p => p.test(htmlA));
})();

checks++;
if (!hasTrigger) {
  bugs.push('Navigation trigger/hamburger button missing from SSR output');
}

// Check 3: With navigationOpen=true, the nav panel should have SideNavigation children
// The nav container div exists but is EMPTY in SSR
const navPanelHasContent = (() => {
  // Look for the navigation panel region — it should contain SideNavigation markup
  // In the open state, we expect actual nav items inside the panel
  const hasItemsInOpen = htmlB.includes('side-navigation') && /side-navigation.*?>Home</s.test(htmlB);
  return hasItemsInOpen;
})();

checks++;
if (!navPanelHasContent) {
  bugs.push('Navigation panel is empty even with navigationOpen={true} — no SideNavigation children rendered');
}

// Check 4: BreadcrumbGroup DOES render (sanity check — this was fixed)
const hasBreadcrumbs = htmlA.includes('breadcrumb') && htmlA.includes('>Home<');

checks++;
if (!hasBreadcrumbs) {
  // This would be unexpected — breadcrumbs should work now
  bugs.push('UNEXPECTED: BreadcrumbGroup content also missing (should be fixed)');
}

// === Report ===
console.log('=== Cloudscape AppLayoutToolbar SSR Bug Verification ===\n');
console.log(`Cloudscape version: @cloudscape-design/components@3.0.1275`);
console.log(`React version: ${React.version}`);
console.log(`Checks run: ${checks}\n`);

if (bugs.length > 0) {
  for (const bug of bugs) {
    console.log(`BUG CONFIRMED: ${bug}`);
  }
  console.log(`\n${bugs.length} bug(s) confirmed out of ${checks} checks.`);
  if (hasBreadcrumbs) {
    console.log('NOTE: BreadcrumbGroup renders correctly (fix from #3856/#4065/#4123 is working).');
  }
  console.log('\nThis confirms the SSR rendering gap in AppLayoutToolbar navigation.');
  process.exit(0); // Bugs confirmed = expected state = success
} else {
  console.log('NO BUGS FOUND: All navigation content rendered correctly in SSR.');
  console.log('Cloudscape may have fixed the AppLayoutToolbar SSR issue.');
  process.exit(1); // No bugs = unexpected = failure (test is meant to prove the bug)
}
