import { hydrateRoot } from 'react-dom/client';
import App from './App';

const params = new URLSearchParams(window.location.search);
const defaultNavigationOpen = params.get('navigationOpen') === 'true';

hydrateRoot(
  document.getElementById('app')!,
  <App defaultNavigationOpen={defaultNavigationOpen} />,
);
