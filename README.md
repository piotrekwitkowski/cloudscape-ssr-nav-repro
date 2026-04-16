# Cloudscape AppLayoutToolbar SSR: Missing Navigation Content and Trigger Button

## Problem

During SSR with `renderToString`, Cloudscape's `AppLayoutToolbar` renders an empty navigation container and no hamburger trigger button. The `SideNavigation` component passed via the `navigation` prop is not rendered at all. This is distinct from the breadcrumbs CSS glitch fixed by [#3856](https://github.com/cloudscape-design/components/pull/3856)/[#4065](https://github.com/cloudscape-design/components/pull/4065)/[#4123](https://github.com/cloudscape-design/components/pull/4123).

## Live Demo

**[https://piotrekwitkowski.github.io/cloudscape-ssr-nav-repro/](https://piotrekwitkowski.github.io/cloudscape-ssr-nav-repro/)**

The page is pure `renderToString` output with no client-side JavaScript.

## Local Reproduction

```bash
git clone https://github.com/piotrekwitkowski/cloudscape-ssr-nav-repro.git
cd cloudscape-ssr-nav-repro
npm install
npm run build    # generates docs/index.html
open docs/index.html
```

## Automated Verification

```bash
npm test
```

Runs assertions confirming the bug: navigation content is missing and the hamburger trigger button is absent.

## What This Demonstrates

| Element | Expected during SSR | Actual during SSR |
|---------|---------------------|-------------------|
| Navigation content (`SideNavigation`) | Rendered with "Home" link | Empty `<div>` (no children) |
| Hamburger trigger button | Present (allows opening nav drawer) | Absent |
| Breadcrumbs | Rendered correctly | Rendered correctly (fixed by #4123) |

## Two Demos

The build script (`build.mjs`) produces two side-by-side demos:

- **Demo A: Default state** (`navigationOpen` not set). Navigation drawer is closed. Result: no navigation `<div>`, no trigger button.
- **Demo B: `navigationOpen={true}`**. Navigation drawer is open. Result: empty navigation container `<div>` with no `SideNavigation` inside.

Both demos pass `navigation`, `breadcrumbs`, and `content` props to `AppLayoutToolbar`. The global flags (`awsui-visual-refresh-flag` and `appLayoutToolbar`) are set before any Cloudscape import.

## Root Cause

The skeleton component (`BeforeMainSlotSkeleton` in `skeleton-parts.tsx`) renders an empty `<div className={styles.navigation}>` without passing the `navigation` prop as children. The actual content injection happens via `stateManager.setState` inside `useLayoutEffect`, which never fires during SSR.

The hamburger trigger button only exists in `AppLayoutToolbarImplementation`, gated behind `isWidgetReady()`, which is never `true` during SSR.

## Versions

| Package | Version |
|---------|---------|
| `@cloudscape-design/components` | 3.0.1275 |
| `@cloudscape-design/global-styles` | 1.0.57 |
| `react` | 19.1.0 |
| `react-dom` | 19.1.0 |
