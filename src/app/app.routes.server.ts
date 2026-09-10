import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: 'offer/:slug', renderMode: RenderMode.Server },
  { path: 'artykuly', renderMode: RenderMode.Server },
  { path: 'artykuly/:slug', renderMode: RenderMode.Server },

  { path: '', renderMode: RenderMode.Prerender },
  { path: 'about', renderMode: RenderMode.Prerender },
  { path: 'chaotyczne-czwartki', renderMode: RenderMode.Server },
  { path: 'dolacz-do-druzyny', renderMode: RenderMode.Prerender },
  { path: 'contact', renderMode: RenderMode.Prerender },

  { path: '**', renderMode: RenderMode.Server },
];
