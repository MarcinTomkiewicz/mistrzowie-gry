import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  effect,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { provideTranslocoScope } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { map, type Observable } from 'rxjs';

import { Breadcrumbs } from '../../../common/breadcrumbs/breadcrumbs';
import { LoadingOverlay } from '../../../common/loading-overlay/loading-overlay';
import { RouteTabs } from '../../../common/route-tabs/route-tabs';
import { buildSiteUrl } from '../../../core/config/site';
import {
  buildPublicEventPath,
  isPublicEventSlug,
} from '../../../core/configs/events.config';
import { Platform } from '../../../core/services/platform/platform';
import { ResponseStatus } from '../../../core/services/response-status/response-status';
import { Seo } from '../../../core/services/seo/seo';
import { Storage } from '../../../core/services/storage/storage';
import { UiConfirm } from '../../../core/services/ui-confirm/ui-confirm';
import type { BreadcrumbItem } from '../../../core/types/breadcrumb';
import type { RouteTabDefinition } from '../../../core/types/route-tab';
import { formatDateLabel } from '../../../core/utils/date';
import { normalizeText } from '../../../core/utils/normalize-text';
import { formatMoney } from '../../../core/utils/pricing';
import { resolvePublicStorageUrl } from '../../../core/utils/storage-url';
import { formatTimeRangeLabel } from '../../../core/utils/time-format';
import {
  createBreadcrumbStructuredData,
  createPageStructuredData,
} from '../../../core/utils/structured-data';
import { EventPageProgram } from './event-page-program';
import { EventPageFacade } from './event-page-facade';
import { EventParticipantAvailability } from './event-participant-availability';
import { EventParticipantSignupFacade } from './event-participant-signup-facade';
import { createEventPageI18n } from './event-page.i18n';

@Component({
  selector: 'app-event-page',
  imports: [
    Breadcrumbs, ButtonModule, EventPageProgram, LoadingOverlay,
    RouterLink, RouteTabs,
  ],
  templateUrl: './event-page.html',
  providers: [
    EventPageFacade, EventParticipantAvailability, EventParticipantSignupFacade,
    provideTranslocoScope('eventPage', 'common'),
  ],
})
export class EventPage implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly platform = inject(Platform);
  private readonly responseStatus = inject(ResponseStatus);
  private readonly seo = inject(Seo);
  private readonly storage = inject(Storage);
  private readonly confirm = inject(UiConfirm);
  private readonly signup = inject(EventParticipantSignupFacade);

  protected readonly facade = inject(EventPageFacade);
  protected readonly i18n = createEventPageI18n();
  protected readonly formatDateLabel = formatDateLabel;
  protected readonly formatTimeRangeLabel = formatTimeRangeLabel;

  protected readonly view = computed(() => {
    const state = this.facade.state();
    if (state.kind !== 'ready') return null;

    const { page, edition } = state;
    return {
      page,
      edition,
      title: `${page.core.name} - ${edition.city}`,
      description:
        normalizeText(page.core.shortDescription) ||
        normalizeText(page.core.longDescription) || undefined,
      canonicalUrl: buildSiteUrl(
        buildPublicEventPath(page.core.key, edition.slug),
      ),
      coverImageUrl: resolvePublicStorageUrl(
        this.storage, edition.coverImagePath ?? page.core.coverImagePath,
      ),
      priceLabel:
        normalizeText(edition.priceLabel) ||
        (edition.priceAmount === null
          ? this.i18n.page().freeLabel
          : formatMoney(edition.priceAmount, edition.priceCurrency)),
      editionTabs: page.editions
        .filter((item) => isPublicEventSlug(item.slug))
        .map<RouteTabDefinition>((item) => ({
          id: item.id,
          label: item.city,
          icon: 'pi pi-map-marker',
          path: buildPublicEventPath(page.core.key, item.slug),
        })),
    };
  });

  protected readonly breadcrumbs = computed<BreadcrumbItem[]>(() => {
    const view = this.view();
    return view
      ? [
          { label: this.i18n.cta().goHome, path: '/' },
          {
            label: view.page.core.name,
            path: `/wydarzenia/${encodeURIComponent(view.page.core.key)}`,
          },
          { label: view.edition.city },
        ]
      : [];
  });

  private readonly redirectEffect = effect(() => {
    const state = this.facade.state();
    if (state.kind !== 'redirect') return;

    if (this.platform.isBrowser) {
      void this.router.navigateByUrl(state.path, { replaceUrl: true });
    } else {
      this.responseStatus.permanentRedirect(state.path);
    }
  });

  private readonly applySeoEffect = effect(() => {
    const state = this.facade.state();

    if (state.kind === 'redirect') {
      this.seo.apply({
        title: this.i18n.labels().event,
        canonicalUrl: buildSiteUrl(state.path),
        robots: 'noindex,nofollow',
      });
      return;
    }

    const view = this.view();
    if (view) {
      this.responseStatus.set(200);
      this.seo.apply({
        title: view.title,
        description: view.description,
        canonicalUrl: view.canonicalUrl,
        og: {
          title: view.title,
          description: view.description,
          images: view.coverImageUrl
            ? [{ url: view.coverImageUrl, alt: view.title }]
            : undefined,
        },
        twitter: {
          card: view.coverImageUrl ? 'summary_large_image' : 'summary',
          image: view.coverImageUrl ?? undefined,
        },
        structuredData: [
          createPageStructuredData({
            type: 'WebPage',
            id: `${view.canonicalUrl}#webpage`,
            url: view.canonicalUrl,
            name: view.title,
            description: view.description,
          }),
          createBreadcrumbStructuredData(this.breadcrumbs()),
        ],
      });
      return;
    }

    const title = state.kind === 'error'
      ? this.i18n.errors().server
      : state.kind === 'not-found'
        ? this.i18n.errors().notFound
        : this.i18n.labels().event;
    this.responseStatus.set(
      state.kind === 'error' ? 503 : state.kind === 'not-found' ? 404 : 200,
    );
    this.seo.apply({
      title,
      description: title,
      canonicalUrl: buildSiteUrl(state.kind === 'not-found' ? '/not-found' : '/'),
      robots: 'noindex,nofollow',
    });
  });

  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.reload());
  }

  canDeactivate(): boolean | Observable<boolean> {
    if (this.signup.isSubmitting()) return false;
    if (!this.signup.hasGuestReceipt()) return true;
    const receiptVisible = this.signup.dialog() !== null;
    if (receiptVisible && !this.signup.canAcknowledgeReceipt()) return false;
    const discardReceipt = this.signup.prepareGuestReceiptDiscard();
    return this.confirm.modalDecision({
      header: this.i18n.signup().title,
      message: receiptVisible ? this.i18n.signup().leaveConfirmation
        : this.i18n.signup().discardHiddenReceiptConfirmation,
      acceptLabel: this.i18n.actions().confirm,
      rejectLabel: this.i18n.actions().cancel,
    }).pipe(map((accepted) => accepted && !this.destroyRef.destroyed &&
      receiptVisible === (this.signup.dialog() !== null) &&
      (!receiptVisible || this.signup.canAcknowledgeReceipt()) && discardReceipt()));
  }

  protected reload(): void {
    const params = this.route.snapshot.paramMap;
    this.facade.load(params.get('eventKey') ?? '', params.get('editionSlug'));
  }
}
