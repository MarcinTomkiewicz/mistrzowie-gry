import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  effect,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { RouterModule } from '@angular/router';

import { AccordionModule } from 'primeng/accordion';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';

import { provideTranslocoScope } from '@jsverse/transloco';
import { catchError, finalize, of } from 'rxjs';

import { AnimateOnScrollModule } from 'primeng/animateonscroll';
import {
  EventOccurrenceStatus,
  EventProgramItemStatus,
} from '../../../core/enums/event';
import { IEvent } from '../../../core/interfaces/i-event';
import { IEventOccurrence } from '../../../core/interfaces/i-event-occurence';
import { IEventProgramItemWithDetails } from '../../../core/interfaces/i-event-program-item';
import { IEventSlotCardVm } from '../../../core/interfaces/i-event-slot-card';
import { IGmPublicProfile } from '../../../core/interfaces/i-gm-public-profile';
import { ISessionWithRelations } from '../../../core/interfaces/i-session';
import { IOccurrenceSwitcherOption } from '../../../core/interfaces/i-occurrence-switcher';
import { EventRead } from '../../../core/services/event-read/event-read';
import { GmRead } from '../../../core/services/gm-read/gm-read';
import { Seo } from '../../../core/services/seo/seo';
import { Storage } from '../../../core/services/storage/storage';
import {
  formatDateLabel,
  getEndOfNextMonthIso,
  getStartOfCurrentMonthIso,
  getTodayIso,
} from '../../../core/utils/date';
import { normalizeText } from '../../../core/utils/normalize-text';
import { EventSlots } from '../../common/event-slots/event-slots';
import { OccurrenceSwitcher } from '../../common/occurrence-switcher/occurrence-switcher';
import { GmProfileDialog } from '../gm-profile-dialog/gm-profile-dialog';
import { SessionDialog } from '../session-dialog/session-dialog';
import {
  CHAOTIC_HIGHLIGHT_ICONS,
  CHAOTIC_SPARK_DICE,
  CHAOTIC_STANDARDS_ICONS,
} from './chaotic-thursdays.config';
import { createChaoticThursdaysI18n } from './chaotic-thursdays.i18n';

const CHAOTIC_THURSDAYS_SLUG = 'chaotyczne-czwartki';

type EventProgramPageVm = {
  event: IEvent;
  occurrences: IEventOccurrence[];
  programsByOccurrenceId: Map<string, IEventProgramItemWithDetails[]>;
};

@Component({
  selector: 'app-chaotic-thursdays',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ButtonModule,
    AccordionModule,
    TableModule,
    AnimateOnScrollModule,
    EventSlots,
    OccurrenceSwitcher,
    GmProfileDialog,
    SessionDialog,
  ],
  templateUrl: './chaotic-thursdays.html',
  styleUrl: './chaotic-thursdays.scss',
  providers: [provideTranslocoScope('chaoticThursdays', 'common')],
})
export class ChaoticThursdays implements OnInit {
  private readonly seo = inject(Seo);
  private readonly eventRead = inject(EventRead);
  private readonly gmRead = inject(GmRead);
  private readonly storage = inject(Storage);

  readonly i18n = createChaoticThursdaysI18n(
    CHAOTIC_HIGHLIGHT_ICONS,
    CHAOTIC_STANDARDS_ICONS,
  );

  readonly sparkDice = CHAOTIC_SPARK_DICE;

  readonly pageVm = signal<EventProgramPageVm | null>(null);
  readonly isLoading = signal(true);

  readonly selectedProfile = signal<IGmPublicProfile | null>(null);
  readonly isGmDialogVisible = signal(false);

  readonly selectedSession = signal<ISessionWithRelations | null>(null);
  readonly isSessionDialogVisible = signal(false);

  readonly selectedFutureOccurrenceIndex = signal(0);

  private readonly todayIso = getTodayIso();
  private readonly rangeStartIso = getStartOfCurrentMonthIso();
  private readonly rangeEndIso = getEndOfNextMonthIso();

  readonly safeSelectedOccurrenceIndex = computed(() => {
    const count = this.pageVm()?.occurrences.length ?? 0;

    if (!count) {
      return 0;
    }

    return Math.min(this.selectedFutureOccurrenceIndex(), count - 1);
  });

  readonly selectedOccurrence = computed<IEventOccurrence | null>(() => {
    const occurrences = this.pageVm()?.occurrences ?? [];
    const index = this.safeSelectedOccurrenceIndex();

    if (!occurrences.length) {
      return null;
    }

    return occurrences[index] ?? occurrences[0] ?? null;
  });

  readonly occurrenceOptions = computed<IOccurrenceSwitcherOption[]>(() => {
    const occurrences = this.pageVm()?.occurrences ?? [];

    return occurrences.map((occurrence) => ({
      id: occurrence.id,
      label: formatDateLabel(occurrence.occurrenceDate),
      occurrenceDate: occurrence.occurrenceDate,
    }));
  });

  readonly slotItems = computed<IEventProgramItemWithDetails[]>(() => {
    const pageVm = this.pageVm();
    const occurrence = this.selectedOccurrence();

    if (!pageVm || !occurrence) {
      return [];
    }

    return pageVm.programsByOccurrenceId.get(occurrence.id) ?? [];
  });

  readonly slotCards = computed<IEventSlotCardVm[]>(() =>
    this.slotItems().map((item) => ({
      id: item.id,
      gmProfileId: item.host.profile.id ?? null,
      title: item.session.title,
      imageUrl: this.getImageUrl(item.session.image),
      gmDisplayName: this.gmRead.getDisplayName(item.host) || null,
      difficultyLevel: item.session.difficultyLevel,
      styles: item.session.styles,
      triggers: item.session.triggers,
      minAge: item.session.minAge,
      description: item.session.description,
      isEmpty: false,
      canOpenDetails: true,
      canOpenGmProfile: !!item.host.profile.id,
    })),
  );

  readonly slotCount = computed(() => {
    const occurrence = this.selectedOccurrence();
    const event = this.pageVm()?.event;

    if (occurrence) {
      return occurrence.slotCapacity;
    }

    return event?.defaultSlotCapacity ?? 3;
  });

  private readonly applySeoEffect = effect(() => {
    this.seo.apply({
      title: this.i18n.seoTitle() || 'Chaotyczne Czwartki',
      description: this.i18n.seoDescription() || '',
    });
  });

  ngOnInit(): void {
    this.loadPage();
  }

  trackByIndex = (i: number) => i;

  onOccurrenceSelect(index: number): void {
    this.selectedFutureOccurrenceIndex.set(index);
  }

  onSlotSelect(slot: IEventSlotCardVm): void {
    const session = this.findSessionByProgramItemId(slot.id);

    if (!session) {
      return;
    }

    this.selectedSession.set(session);
    this.isSessionDialogVisible.set(true);
  }

  onGmSelect(slot: IEventSlotCardVm): void {
    const gmProfileId = normalizeText(slot.gmProfileId);

    if (!gmProfileId) {
      return;
    }

    this.gmRead
      .getProfileById(gmProfileId)
      .pipe(catchError(() => of(null as IGmPublicProfile | null)))
      .subscribe((profile) => {
        if (!profile) {
          return;
        }

        this.selectedProfile.set(profile);
        this.isGmDialogVisible.set(true);
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
    }
  }

  private loadPage(): void {
    this.isLoading.set(true);

    this.eventRead
      .getPublicProgramLoadData(CHAOTIC_THURSDAYS_SLUG, {
        startIso: this.rangeStartIso,
        endIso: this.rangeEndIso,
        todayIso: this.todayIso,
        occurrenceStatuses: [EventOccurrenceStatus.Published],
        programStatuses: [EventProgramItemStatus.Published],
        includePastOccurrences: false,
      })
      .pipe(
        catchError((error) => {
          console.error('[CHAOTIC THURSDAYS LOAD ERROR]', error);
          return of(null);
        }),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe((pageVm) => {
        this.pageVm.set(pageVm);
      });
  }

  private findSessionByProgramItemId(
    programItemId: string | null | undefined,
  ): ISessionWithRelations | null {
    const normalizedId = normalizeText(programItemId);

    if (!normalizedId) {
      return null;
    }

    const match = this.slotItems().find((item) => item.id === normalizedId);

    return match?.session ?? null;
  }

  private getImageUrl(imagePath: string | null | undefined): string | null {
    const normalized = normalizeText(imagePath);

    if (!normalized) {
      return null;
    }

    if (/^https?:\/\//i.test(normalized)) {
      return normalized;
    }

    return this.storage.getPublicUrl(normalized);
  }
}