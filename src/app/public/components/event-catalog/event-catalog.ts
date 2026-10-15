import { Component, OnInit, computed, effect, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { provideTranslocoScope } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';

import { Breadcrumbs } from '../../../common/breadcrumbs/breadcrumbs';
import { LoadingOverlay } from '../../../common/loading-overlay/loading-overlay';
import { buildSiteUrl } from '../../../core/config/site';
import { buildPublicEventPath } from '../../../core/configs/events.config';
import { ResponseStatus } from '../../../core/services/response-status/response-status';
import { Seo } from '../../../core/services/seo/seo';
import type { BreadcrumbItem } from '../../../core/types/breadcrumb';
import { formatDateLabel } from '../../../core/utils/date';
import {
  createBreadcrumbStructuredData, createPageStructuredData,
} from '../../../core/utils/structured-data';
import { EventCatalogFacade } from './event-catalog-facade';
import { createEventCatalogI18n } from './event-catalog.i18n';

@Component({
  selector: 'app-event-catalog',
  imports: [Breadcrumbs, ButtonModule, LoadingOverlay, RouterLink, TableModule],
  templateUrl: './event-catalog.html',
  providers: [EventCatalogFacade, provideTranslocoScope('eventCatalog', 'common')],
})
export class EventCatalog implements OnInit {
  private readonly responseStatus = inject(ResponseStatus);
  private readonly seo = inject(Seo);
  private readonly pageUrl = buildSiteUrl('/wydarzenia');

  protected readonly facade = inject(EventCatalogFacade);
  protected readonly i18n = createEventCatalogI18n();
  protected readonly formatDateLabel = formatDateLabel;
  protected readonly breadcrumbs = computed<BreadcrumbItem[]>(() => [
    { label: this.i18n.cta().goHome, path: '/' },
    { label: this.i18n.nav().events },
  ]);
  protected readonly rows = computed(() => {
    const state = this.facade.state();
    return state.kind === 'ready' ? state.items.flatMap((item) => {
      const edition = item.editions[0];
      return edition ? [{
        item,
        path: buildPublicEventPath(item.coreKey, edition.slug),
        editions: item.editions.map((edition) => ({
          edition, path: buildPublicEventPath(item.coreKey, edition.slug),
        })),
      }] : [];
    }) : [];
  });

  private readonly applySeoEffect = effect(() => {
    const state = this.facade.state();
    const title = this.i18n.nav().events;
    const description = this.i18n.page().seoDescription;
    const isError = state.kind === 'error';

    this.responseStatus.set(isError ? 503 : 200);
    this.seo.apply({
      title: isError ? this.i18n.errors().eventsLoadFailed : title,
      description: isError ? this.i18n.errors().server : description,
      canonicalUrl: this.pageUrl,
      robots: state.kind === 'ready' ? 'index,follow' : 'noindex,nofollow',
      og: { title, description, url: this.pageUrl },
      structuredData: state.kind === 'ready' ? [
        createPageStructuredData({
          type: 'CollectionPage', id: `${this.pageUrl}#webpage`,
          url: this.pageUrl, name: title, description,
        }),
        createBreadcrumbStructuredData(this.breadcrumbs()),
      ] : undefined,
    });
  });

  ngOnInit(): void {
    this.facade.load();
  }
}
