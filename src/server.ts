import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import dotenv from 'dotenv';
import { join } from 'node:path';
import { registerContactRoute } from './server/contact';
import { registerPublicSeoRoutes } from './server/public-seo';

dotenv.config({
  path: join(import.meta.dirname, '../.env'),
});

const browserDistFolder = join(import.meta.dirname, '../browser');

export function app(): express.Express {
  const app = express();
  const angularApp = new AngularNodeAppEngine({
    trustProxyHeaders: ['x-forwarded-for', 'x-forwarded-proto'],
  });

  app.disable('x-powered-by');
  app.use(express.json({ limit: '200kb' }));

  registerPublicSeoRoutes(app);

  app.get('/join-the-party', (req, res) => {
    const query = req.originalUrl.includes('?')
      ? req.originalUrl.slice(req.originalUrl.indexOf('?'))
      : '';

    res.redirect(301, `/dolacz-do-druzyny${query}`);
  });

  app.get('/chaotic-thursdays', (req, res) => {
    const query = req.originalUrl.includes('?')
      ? req.originalUrl.slice(req.originalUrl.indexOf('?'))
      : '';

    res.redirect(301, `/chaotyczne-czwartki${query}`);
  });

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

const server = app();

function run(): void {
  const port = Number(process.env['PORT'] || 4100);

  server.listen(port, '127.0.0.1', () => {
    console.log(`Node Express server listening on http://127.0.0.1:${port}`);
  });
}

run();

export const reqHandler = createNodeRequestHandler(server);
