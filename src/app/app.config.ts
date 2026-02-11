import {
  ApplicationConfig,
  isDevMode,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { providePrimeNG } from 'primeng/config';

import { MgPrimePreset } from './primeng/mg-primeng.preset';

import { routes } from './app.routes';
import {
  provideClientHydration,
  withEventReplay,
} from '@angular/platform-browser';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideTransloco } from '@jsverse/transloco';
import { TranslocoHttpLoader } from './core/loaders/transloco.loader';
import { SUPABASE_CONFIG } from './core/configs/supabase.config';
import { environment } from '../env/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideHttpClient(withFetch()),
    provideTransloco({
      config: {
        availableLangs: ['pl'],
        defaultLang: 'pl',
        reRenderOnLangChange: false,
        prodMode: !isDevMode(),
      },
      loader: TranslocoHttpLoader,
    }),
    providePrimeNG({
      theme: {
        preset: MgPrimePreset,
        options: {
          darkModeSelector: 'html:not([data-theme="light"])',
          cssLayer: {
            name: 'primeng',
            order: 'app-styles, primeng',
          },
        },
      },
    }),
    {
      provide: SUPABASE_CONFIG,
      useValue: environment.supabase,
    },
  ],
};
