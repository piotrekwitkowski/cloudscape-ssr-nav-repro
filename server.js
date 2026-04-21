import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { createServer as createViteServer } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function createServer() {
  const app = express();

  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'custom',
  });

  app.use(vite.middlewares);

  app.use(async (req, res) => {
    const url = req.originalUrl;

    try {
      let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
      template = await vite.transformIndexHtml(url, template);

      // Cloudscape flags — set before loading any component module.
      globalThis[Symbol.for('awsui-visual-refresh-flag')] = () => true;
      globalThis[Symbol.for('awsui-global-flags')] = { appLayoutToolbar: true };

      const { render } = await vite.ssrLoadModule('/src/entry-server.tsx');
      const { html: appHtml } = render(url);

      const finalHtml = template.replace('<!--ssr-outlet-->', appHtml);
      res.status(200).set({ 'Content-Type': 'text/html' }).end(finalHtml);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      console.error(e.stack);
      res.status(500).end(e.stack);
    }
  });

  app.listen(3000, () => {
    console.log('SSR dev server running at http://localhost:3000');
    console.log('');
    console.log('  Demo A (default):          http://localhost:3000');
    console.log('  Demo B (nav drawer open):  http://localhost:3000/?navigationOpen=true');
  });
}

createServer();
