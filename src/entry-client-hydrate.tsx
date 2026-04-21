import { hydrateRoot } from 'react-dom/client';
import AppHydrated from './AppHydrated';

const appEl = document.getElementById('app')!;
const navigationOpen = appEl.dataset.navigationOpen === 'true';

hydrateRoot(appEl, <AppHydrated defaultNavigationOpen={navigationOpen} />);
