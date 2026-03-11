import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');

function normalizeBaseHref(value: string): string {
  if (!value || value === '/') return '/';

  let normalized = value.trim();

  if (!normalized.startsWith('/')) {
    normalized = `/${normalized}`;
  }

  normalized = normalized.replace(/\/+$/, '');

  return normalized || '/';
}

export function app(): express.Express {
  const app = express();
  const angularApp = new AngularNodeAppEngine();
  const appBaseHref = normalizeBaseHref(process.env['APP_BASE_HREF'] || '/');

  /**
   * Serve static files from /browser without prefix
   * e.g. /icons/read.svg
   */
  app.use(
    express.static(browserDistFolder, {
      maxAge: '1y',
      index: false,
      redirect: false,
    }),
  );

  /**
   * Serve static files also under APP_BASE_HREF
   * e.g. /mistrzowie-gry/icons/read.svg
   */
  if (appBaseHref !== '/') {
    app.use(
      appBaseHref,
      express.static(browserDistFolder, {
        maxAge: '1y',
        index: false,
        redirect: false,
      }),
    );
  }

  /**
   * Handle all other requests by rendering the Angular application.
   */
  app.use((req, res, next) => {
    angularApp
      .handle(req)
      .then((response) =>
        response ? writeResponseToNodeResponse(response, res) : next(),
      )
      .catch(next);
  });

  /**
   * Basic error handler
   */
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
  const port = Number(process.env['PORT'] || 4000);
  const server = app();

  server.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

run();

/**
 * Request handler used by Angular CLI / integrations.
 */
export const reqHandler = createNodeRequestHandler(app());