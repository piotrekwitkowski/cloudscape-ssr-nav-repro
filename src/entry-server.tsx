import { renderToString } from 'react-dom/server';
import App from './App';

export function render(url: string) {
  const params = new URLSearchParams(url.split('?')[1] || '');
  const defaultNavigationOpen = params.get('navigationOpen') === 'true';

  const html = renderToString(<App defaultNavigationOpen={defaultNavigationOpen} />);
  return { html };
}
