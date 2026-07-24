import type { Routes } from '@angular/router';

const loaders = {
  list: () =>
    import(
      '../components/content-articles/content-article-list/content-article-list'
    ).then((m) => m.ContentArticleList),
  detail: () =>
    import(
      '../components/content-articles/content-article-detail/content-article-detail'
    ).then((m) => m.ContentArticleDetail),
} as const;

export const contentRoutes: Routes = [
  { path: 'artykuly', loadComponent: loaders.list },
  { path: 'artykuly/:slug', loadComponent: loaders.detail },
];
