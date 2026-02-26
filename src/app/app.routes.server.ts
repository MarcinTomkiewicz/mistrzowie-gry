import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: 'offer/:slug', renderMode: RenderMode.Server },

  { path: '', renderMode: RenderMode.Prerender },
  { path: 'about', renderMode: RenderMode.Prerender },
  { path: 'chaotic-thursdays', renderMode: RenderMode.Prerender },
  { path: 'join-the-party', renderMode: RenderMode.Prerender },
  { path: 'contact', renderMode: RenderMode.Prerender },

  { path: '**', renderMode: RenderMode.Server },
];