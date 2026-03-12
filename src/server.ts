import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');

export function app(): express.Express {
  const app = express();
  const angularApp = new AngularNodeAppEngine();

  /**
   * Serve static files from /browser
   * e.g. /icons/read.svg, /theme/dark/brand.avif
   */
  app.use(
    express.static(browserDistFolder, {
      maxAge: '1y',
      index: false,
      redirect: false,
    }),
  );

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
  const port = Number(process.env['PORT'] || 4100);
  const server = app();

  server.listen(port, '127.0.0.1', () => {
    console.log(`Node Express server listening on http://127.0.0.1:${port}`);
  });
}

run();

/**
 * Request handler used by Angular CLI / integrations.
 */
export const reqHandler = createNodeRequestHandler(app());