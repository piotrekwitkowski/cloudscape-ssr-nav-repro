import { renderToString } from 'react-dom/server';
import AppHydrated from './AppHydrated';

export function renderForHydration(navigationOpen: boolean): string {
  return renderToString(<AppHydrated defaultNavigationOpen={navigationOpen} />);
}
