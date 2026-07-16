import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import dotenv from 'dotenv';
import { join } from 'node:path';
import { registerContactRoute } from './server/contact';

dotenv.config({
  path: join(import.meta.dirname, '../.env'),
});

const browserDistFolder = join(import.meta.dirname, '../browser');

export function app(): express.Express {
  const app = express();
  const angularApp = new AngularNodeAppEngine();

  app.disable('x-powered-by');
  app.use(express.json({ limit: '200kb' }));

  app.use(
    express.static(browserDistFolder, {
      maxAge: '1y',
      index: false,
      redirect: false,
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.json')) {
          res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');

          if (filePath.includes(join('assets', 'i18n'))) {
            res.setHeader('X-Robots-Tag', 'noindex');
          }

          return;
        }

        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      },
    }),
  );

  registerContactRoute(app);

  app.use((req, res, next) => {
    angularApp
      .handle(req)
      .then((response) =>
        response ? writeResponseToNodeResponse(response, res) : next(),
      )
      .catch(next);
  });

  app.use(
    (
      err: unknown,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      console.error('[SSR ERROR]', err);
      res.status(500).send('Wewnętrzny błąd serwera');
    },
  );

  return app;
}

function run(): void {
  const port = Number(process.env['PORT'] || 4100);
  const server = app();

  server.listen(port, '127.0.0.1', () => {
    console.log(`Node Express server listening on http://127.0.0.1:${port}`);
  });
}

run();

export const reqHandler = createNodeRequestHandler(app());
