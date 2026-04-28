# Cloudscape AppLayoutToolbar SSR: Missing Navigation Content and Trigger Button

## Problem

During SSR with `renderToString`, Cloudscape's `AppLayoutToolbar` renders an empty navigation container and no hamburger trigger button. The `SideNavigation` component passed via the `navigation` prop is not rendered at all. This is distinct from the breadcrumbs CSS glitch fixed by [#3856](https://github.com/cloudscape-design/components/pull/3856)/[#4065](https://github.com/cloudscape-design/components/pull/4065)/[#4123](https://github.com/cloudscape-design/components/pull/4123).

## Local Reproduction

```bash
git clone https://github.com/piotrekwitkowski/cloudscape-ssr-nav-repro.git
cd cloudscape-ssr-nav-repro
npm install
npm run build:static
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) to view the comparison pages.

## Automated Verification

```bash
npm test
```

Runs assertions confirming the bug: navigation content is missing and the hamburger trigger button is absent.

## What This Demonstrates

| Element | Expected during SSR | Actual during SSR |
|---------|---------------------|-------------------|
| Navigation content (`SideNavigation`) | Rendered with links | Empty `<div>` (no children) |
| Hamburger trigger button | Present (allows opening nav drawer) | Absent |
| Breadcrumbs | Rendered correctly | Rendered correctly (fixed by #4123) |

## Root Cause

The skeleton component (`BeforeMainSlotSkeleton` in `skeleton-parts.tsx`) renders an empty `<div className={styles.navigation}>` without passing the `navigation` prop as children. The actual content injection happens via `stateManager.setState` inside `useLayoutEffect`, which never fires during SSR.

The hamburger trigger button only exists in `AppLayoutToolbarImplementation`, gated behind `isWidgetReady()`, which is never `true` during SSR.

## Next Step

Replace the skeleton SSR path with the real `AppLayoutToolbar` implementation during server rendering. The skeleton exists for client-side code splitting but is unnecessary during SSR where all code is available synchronously. Rendering the implementation directly eliminates the layout shift on hydration and removes duplicated rendering logic.

## Versions

| Package | Version |
|---------|---------|
| `@cloudscape-design/components` | 3.0.1286 |
| `@cloudscape-design/global-styles` | 1.0.58 |
| `react` | 19.2.5 |
| `react-dom` | 19.2.5 |
