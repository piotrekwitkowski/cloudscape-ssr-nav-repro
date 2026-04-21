import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  ssr: {
    // Bundle Cloudscape packages into the SSR output rather than treating
    // them as external Node.js modules — required for CSS imports and
    // internal module resolution to work during renderToString.
    noExternal: [
      '@cloudscape-design/components',
      '@cloudscape-design/design-tokens',
      '@cloudscape-design/collection-hooks',
      '@cloudscape-design/component-toolkit',
      '@cloudscape-design/theming-runtime',
      '@cloudscape-design/global-styles',
    ],
  },
});
