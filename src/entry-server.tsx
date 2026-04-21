import { renderToString } from 'react-dom/server';
import App from './App';

export function render(url: string) {
  return { html: renderToString(<App url={url} />) };
}
