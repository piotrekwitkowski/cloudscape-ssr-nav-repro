import { useState } from 'react';
import AppLayoutToolbar from '@cloudscape-design/components/app-layout-toolbar';
import BreadcrumbGroup from '@cloudscape-design/components/breadcrumb-group';
import SideNavigation from '@cloudscape-design/components/side-navigation';
import '@cloudscape-design/global-styles/index.css';

const breadcrumbs = (
  <BreadcrumbGroup items={[{ text: 'Home', href: '/' }]} />
);

const navigation = (
  <SideNavigation
    items={[
      { type: 'link', text: 'Home', href: '/' },
      { type: 'link', text: 'Page one', href: '/page-one' },
      { type: 'link', text: 'Page two', href: '/page-two' },
    ]}
  />
);

function useNavigationOpen(url: string) {
  const params = new URLSearchParams(url.split('?')[1] || '');
  return useState(params.get('navigationOpen') === 'true');
}

export default function App({ url = '' }: { url?: string }) {
  const [navigationOpen, setNavigationOpen] = useNavigationOpen(url);

  return (
    <AppLayoutToolbar
      breadcrumbs={breadcrumbs}
      navigation={navigation}
      navigationOpen={navigationOpen}
      onNavigationChange={({ detail }) => setNavigationOpen(detail.open)}
      content={
        <div>
          <h1>Cloudscape AppLayoutToolbar SSR Reproduction</h1>
          <p>
            This page is server-side rendered.
            {navigationOpen
              ? ' The navigation drawer is set to open.'
              : ' The navigation drawer is set to closed.'}
          </p>
          <h2>What to look for</h2>
          <ul>
            <li>
              <strong>Navigation content:</strong> The SideNavigation links
              (Home, Page one, Page two) should be visible in the SSR output.
              <em> They are not.</em>
            </li>
            <li>
              <strong>Hamburger trigger:</strong> A button to toggle the
              navigation drawer should be present.
              <em> It is not.</em>
            </li>
            <li>
              <strong>Content prop:</strong> This text you are reading should
              be visible in the SSR output.
              <em> It is not — the content area is empty until hydration.</em>
            </li>
          </ul>
          <p>
            All elements only appear after client-side hydration. Disable
            JavaScript or throttle the network to see the raw SSR output.
          </p>
          <h2>Demos</h2>
          <ul>
            <li><a href="/">Demo A</a> — drawer closed</li>
            <li><a href="/?navigationOpen=true">Demo B</a> — drawer open</li>
          </ul>
        </div>
      }
      toolsHide
    />
  );
}
