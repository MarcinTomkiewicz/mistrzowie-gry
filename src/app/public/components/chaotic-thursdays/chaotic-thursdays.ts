import { Component, effect, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';

import { provideTranslocoScope } from '@jsverse/transloco';

import { AccordionModule } from 'primeng/accordion';
import { AnimateOnScrollModule } from 'primeng/animateonscroll';
import { ButtonModule } from 'primeng/button';

import { buildSiteUrl, VENUE_COUNTRY } from '../../../core/config/site';
import { IEventProgramItemWithDetails } from '../../../core/interfaces/i-event-program-item';
import { IEventSlotCardVm } from '../../../core/interfaces/i-event-slot-card';
import { IGmPublicProfile } from '../../../core/interfaces/i-gm-public-profile';
import { ISessionWithRelations } from '../../../core/interfaces/i-session';
import { GmRead } from '../../../core/reads/gm/gm-read';
import { ResponseStatus } from '../../../core/services/response-status/response-status';
import { Seo } from '../../../core/services/seo/seo';
import { Storage } from '../../../core/services/storage/storage';
import { UiToast } from '../../../core/services/ui-toast/ui-toast';
import { StructuredDataNode } from '../../../core/types/structured-data';
import { normalizeText } from '../../../core/utils/normalize-text';
import { resolvePublicStorageUrl } from '../../../core/utils/storage-url';
import {
  createEventStructuredData,
  createOfferStructuredData,
  createPlaceStructuredData,
} from '../../../core/utils/structured-data';
import { formatTimeLabel } from '../../../core/utils/time';
import { GmProfileDialog } from '../gm-profile-dialog/gm-profile-dialog';
import { SessionDialog } from '../session-dialog/session-dialog';
import {
  CHAOTIC_HIGHLIGHT_ICONS,
  CHAOTIC_SPARK_DICE,
  CHAOTIC_STANDARDS_ICONS,
} from './chaotic-thursdays.config';
import { ChaoticThursdaysEventPanel } from './chaotic-thursdays-event-panel';
import { ChaoticThursdaysFacade } from './chaotic-thursdays.facade';
import { createChaoticThursdaysI18n } from './chaotic-thursdays.i18n';

@Component({
  selector: 'app-chaotic-thursdays',
  standalone: true,
  imports: [
    RouterModule,
    ButtonModule,
    AccordionModule,
    AnimateOnScrollModule,
    ChaoticThursdaysEventPanel,
    GmProfileDialog,
    SessionDialog,
  ],
  templateUrl: './chaotic-thursdays.html',
  styleUrl: './chaotic-thursdays.scss',
  providers: [
    provideTranslocoScope('chaoticThursdays', 'common'),
    ChaoticThursdaysFacade,
  ],
})
export class ChaoticThursdays {
  private readonly facade = inject(ChaoticThursdaysFacade);
  private readonly gmRead = inject(GmRead);
  private readonly responseStatus = inject(ResponseStatus);
  private readonly seo = inject(Seo);
  private readonly storage = inject(Storage);
  private readonly toast = inject(UiToast);
  private readonly pageUrl = buildSiteUrl('/chaotic-thursdays');

  readonly i18n = createChaoticThursdaysI18n(
    CHAOTIC_HIGHLIGHT_ICONS,
    CHAOTIC_STANDARDS_ICONS,
  );
  readonly sparkDice = CHAOTIC_SPARK_DICE;

  readonly selectedProfile = signal<IGmPublicProfile | null>(null);
  readonly isGmDialogVisible = signal(false);

  readonly selectedSession = signal<ISessionWithRelations | null>(null);
  readonly selectedSessionProgramItem =
    signal<IEventProgramItemWithDetails | null>(null);
  readonly isSessionDialogVisible = signal(false);

  private readonly applySeoEffect = effect(() => {
    const seo = this.i18n.seo();
    const loadError = this.facade.loadError();

    if (this.facade.isLoading()) {
      this.seo.apply({
        title: this.i18n.commonStatus().loading,
        canonicalUrl: this.pageUrl,
        robots: 'noindex,nofollow',
      });
      return;
    }

    if (loadError) {
      const error = this.i18n.commonErrors().server;

      this.responseStatus.set(503);
      this.seo.apply({
        title: error,
        description: error,
        canonicalUrl: this.pageUrl,
        robots: 'noindex,nofollow',
      });
      return;
    }

    this.responseStatus.set(200);

    this.seo.apply({
      title: seo.title,
      description: seo.description,
      canonicalUrl: this.pageUrl,
      structuredData: this.buildStructuredData(),
    });
  });

  onSlotSelect(slot: IEventSlotCardVm): void {
    const programItem = this.findProgramItemById(slot.id);
    const session = programItem?.session ?? null;

    if (!session) {
      return;
    }

    this.selectedSessionProgramItem.set(programItem);
    this.selectedSession.set(session);
    this.isSessionDialogVisible.set(true);
  }

  onGmSelect(slot: IEventSlotCardVm): void {
    const gmProfileId = normalizeText(slot.gmProfileId);

    if (!gmProfileId) {
      return;
    }

    this.gmRead.getProfileById(gmProfileId).subscribe({
      next: (profile) => {
        if (!profile) {
          this.toast.danger({
            summary: this.i18n.errors().gmProfile,
            detail: this.i18n.commonErrors().notFound,
          });
          return;
        }

        this.selectedProfile.set(profile);
        this.isGmDialogVisible.set(true);
      },
      error: () => {
        this.toast.danger({
          summary: this.i18n.errors().gmProfile,
          detail: this.i18n.commonErrors().generic,
        });
      },
    });
  }

  onGmDialogVisibleChange(visible: boolean): void {
    this.isGmDialogVisible.set(visible);

    if (!visible) {
      this.selectedProfile.set(null);
    }
  }

  onSessionDialogVisibleChange(visible: boolean): void {
    this.isSessionDialogVisible.set(visible);

    if (!visible) {
      this.selectedSession.set(null);
      this.selectedSessionProgramItem.set(null);
    }
  }

  private findProgramItemById(
    programItemId: string | null | undefined,
  ): IEventProgramItemWithDetails | null {
    const normalizedId = normalizeText(programItemId);

    if (!normalizedId) {
      return null;
    }

    return (
      this.facade
        .selectedProgramItems()
        .find((item) => item.id === normalizedId) ?? null
    );
  }

  private buildStructuredData(): StructuredDataNode | undefined {
    const page = this.facade.page();
    const edition = this.facade.selectedEdition();
    const occurrences = this.facade.occurrences();

    if (!page || !edition || !occurrences.length) {
      return undefined;
    }

    const description =
      normalizeText(page.core.longDescription) ||
      normalizeText(page.core.shortDescription) ||
      undefined;
    const image =
      resolvePublicStorageUrl(this.storage, edition.coverImagePath) ?? undefined;
    const location = createPlaceStructuredData({
      venueName: edition.venueName,
      venueAddress: edition.venueAddress,
      city: edition.city,
      country: VENUE_COUNTRY,
    });
    const offers =
      edition.priceAmount === null
        ? undefined
        : createOfferStructuredData({
            price: String(edition.priceAmount),
            priceCurrency: edition.priceCurrency,
            url: this.pageUrl,
          });
    const startTime = formatTimeLabel(edition.startTime, true);
    const endTime = formatTimeLabel(edition.endTime, true);
    const subEvents = occurrences
      .slice(0, 8)
      .map((occurrence) =>
        createEventStructuredData({
          id: `${this.pageUrl}#occurrence-${occurrence.id}`,
          url: this.pageUrl,
          name: page.core.name,
          description,
          image,
          startDate: startTime
            ? `${occurrence.occurrenceDate}T${startTime}`
            : undefined,
          endDate: endTime
            ? `${occurrence.occurrenceDate}T${endTime}`
            : undefined,
          location,
          offers,
        }),
      );
    const firstOccurrence = occurrences[0];

    return createEventStructuredData({
      id: `${this.pageUrl}#event`,
      url: this.pageUrl,
      name: page.core.name,
      description,
      image,
      startDate:
        firstOccurrence && startTime
          ? `${firstOccurrence.occurrenceDate}T${startTime}`
          : undefined,
      endDate:
        firstOccurrence && endTime
          ? `${firstOccurrence.occurrenceDate}T${endTime}`
          : undefined,
      location,
      offers,
      subEvent: subEvents.length ? subEvents : undefined,
    });
  }
}
