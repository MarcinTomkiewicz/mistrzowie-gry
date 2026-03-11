import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { APP_BASE_HREF } from '@angular/common';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    {
      provide: APP_BASE_HREF,
      useValue: process.env['APP_BASE_HREF'] || '/',
    },
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);