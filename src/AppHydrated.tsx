import { useState } from 'react';
import AppLayoutToolbar from '@cloudscape-design/components/app-layout-toolbar';
import BreadcrumbGroup from '@cloudscape-design/components/breadcrumb-group';
import SideNavigation from '@cloudscape-design/components/side-navigation';
import '@cloudscape-design/global-styles/index.css';

const navItems = [
  { type: 'link' as const, text: 'Home', href: '/' },
  { type: 'link' as const, text: 'Dashboard', href: '/dashboard' },
  { type: 'link' as const, text: 'Settings', href: '/settings' },
];

const breadcrumbItems = [
  { text: 'App', href: '/' },
  { text: 'Page', href: '/page' },
];

export default function AppHydrated({ defaultNavigationOpen = false }: { defaultNavigationOpen?: boolean }) {
  const [navigationOpen, setNavigationOpen] = useState(defaultNavigationOpen);

  return (
    <AppLayoutToolbar
      breadcrumbs={<BreadcrumbGroup items={breadcrumbItems} />}
      navigation={<SideNavigation items={navItems} />}
      navigationOpen={navigationOpen}
      onNavigationChange={({ detail }) => setNavigationOpen(detail.open)}
      content={
        <div>
          <h1>Cloudscape SSR Demo</h1>
          <p>This page is server-side rendered with client hydration. The navigation drawer is fully interactive.</p>
        </div>
      }
      toolsHide
    />
  );
}
