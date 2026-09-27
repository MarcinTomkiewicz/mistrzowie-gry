import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: 'offer/:slug', renderMode: RenderMode.Server },
  { path: 'artykuly', renderMode: RenderMode.Server },
  { path: 'artykuly/:slug', renderMode: RenderMode.Server },

  { path: '', renderMode: RenderMode.Server },
  { path: 'about', renderMode: RenderMode.Server },
  { path: 'chaotyczne-czwartki', renderMode: RenderMode.Server },
  { path: 'dolacz-do-druzyny', renderMode: RenderMode.Server },
  { path: 'contact', renderMode: RenderMode.Server },

  { path: '**', renderMode: RenderMode.Server },
];
