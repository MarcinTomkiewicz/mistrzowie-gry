import {
  computed,
  DestroyRef,
  inject,
  Injectable,
  signal,
} from '@angular/core';
import { forkJoin, map, Subscription } from 'rxjs';

import { EVENT_KEYS } from '../../../core/configs/events.config';
import { EventOccurrenceStatus } from '../../../core/enums/event';
import { IEventOccurrence } from '../../../core/interfaces/i-event-occurence';
import { IPublicEventPage } from '../../../core/interfaces/i-event-page';
import { IEventProgramItemWithDetails } from '../../../core/interfaces/i-event-program-item';
import { IOccurrenceSwitcherOption } from '../../../core/interfaces/i-occurrence-switcher';
import { EventProgramRead } from '../../../core/services/event-program-read/event-program-read';
import { EventRead } from '../../../core/services/event-read/event-read';
import { ChaoticThursdaysLoadError } from '../../../core/types/chaotic-thursdays';
import {
  formatDateLabel,
  getEndOfNextMonthIso,
  getTodayIso,
} from '../../../core/utils/date';

@Injectable()
export class ChaoticThursdaysFacade {
  private readonly destroyRef = inject(DestroyRef);
  private readonly eventProgramRead = inject(EventProgramRead);
  private readonly eventRead = inject(EventRead);

  private readonly rangeStartIso = getTodayIso();
  private readonly rangeEndIso = getEndOfNextMonthIso();

  readonly page = signal<IPublicEventPage | null>(null);
  readonly selectedEventId = signal<string | null>(null);
  readonly occurrences = signal<IEventOccurrence[]>([]);
  readonly programsByOccurrenceId = signal<
    Map<string, IEventProgramItemWithDetails[]>
  >(new Map());
  readonly selectedOccurrenceIndex = signal(0);
  readonly isLoading = signal(false);
  readonly loadError = signal<ChaoticThursdaysLoadError | null>(null);

  readonly editions = computed(() => this.page()?.editions ?? []);

  readonly selectedEdition = computed(() => {
    const selectedEventId = this.selectedEventId();

    if (!selectedEventId) {
      return null;
    }

    return (
      this.editions().find((edition) => edition.id === selectedEventId) ?? null
    );
  });

  readonly safeSelectedOccurrenceIndex = computed(() => {
    const occurrenceCount = this.occurrences().length;

    if (!occurrenceCount) {
      return 0;
    }

    return Math.min(
      Math.max(this.selectedOccurrenceIndex(), 0),
      occurrenceCount - 1,
    );
  });

  readonly selectedOccurrence = computed<IEventOccurrence | null>(() => {
    const occurrences = this.occurrences();

    if (!occurrences.length) {
      return null;
    }

    return occurrences[this.safeSelectedOccurrenceIndex()] ?? null;
  });

  readonly occurrenceOptions = computed<IOccurrenceSwitcherOption[]>(() =>
    this.occurrences().map((occurrence) => ({
      id: occurrence.id,
      label: formatDateLabel(occurrence.occurrenceDate),
      occurrenceDate: occurrence.occurrenceDate,
    })),
  );

  readonly selectedProgramItems = computed<IEventProgramItemWithDetails[]>(
    () => {
      const occurrenceId = this.selectedOccurrence()?.id;

      if (!occurrenceId) {
        return [];
      }

      return this.programsByOccurrenceId().get(occurrenceId) ?? [];
    },
  );

  private groupedPageRequest: Subscription | null = null;
  private occurrencesRequest: Subscription | null = null;
  private programRequest: Subscription | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => this.cancelRequests());
  }

  load(): void {
    this.cancelRequests();
    this.resetPageState();
    this.beginLoad();

    this.groupedPageRequest = this.eventRead
      .getPublicPage(EVENT_KEYS.chaoticThursdays)
      .subscribe({
        next: (page) => this.handlePage(page),
        error: (cause) => this.fail({ kind: 'grouped-rpc', cause }),
      });
  }

  retry(): void {
    const loadError = this.loadError();

    if (!loadError) {
      return;
    }

    switch (loadError.kind) {
      case 'occurrences':
        this.loadOccurrences();
        return;
      case 'program':
        this.loadProgram(this.occurrences());
        return;
      default:
        this.load();
    }
  }

  selectEdition(eventId: string): void {
    if (
      eventId === this.selectedEventId() ||
      !this.editions().some((edition) => edition.id === eventId)
    ) {
      return;
    }

    this.selectedEventId.set(eventId);
    this.loadOccurrences();
  }

  selectOccurrence(index: number): void {
    this.selectedOccurrenceIndex.set(index);
  }

  private handlePage(page: IPublicEventPage | null): void {
    if (!page) {
      this.fail({ kind: 'core-not-found' });
      return;
    }

    this.page.set(page);

    if (!page.editions.length) {
      this.fail({ kind: 'no-editions' });
      return;
    }

    const defaultEdition = page.editions.find(
      (edition) => edition.id === page.defaultEventId,
    );

    if (!defaultEdition) {
      this.fail({
        kind: 'invalid-default',
        defaultEventId: page.defaultEventId,
      });
      return;
    }

    this.selectedEventId.set(defaultEdition.id);
    this.loadOccurrences();
  }

  private loadOccurrences(): void {
    const edition = this.selectedEdition();

    if (!edition) {
      return;
    }

    this.cancelEditionRequests();
    this.resetEditionState();
    this.beginLoad();

    this.occurrencesRequest = this.eventRead
      .getOccurrencesInRange(
        edition.id,
        this.rangeStartIso,
        this.rangeEndIso,
        [EventOccurrenceStatus.Published],
      )
      .subscribe({
        next: (occurrences) => {
          this.occurrences.set(occurrences);

          if (!occurrences.length) {
            this.finishLoad();
            return;
          }

          this.loadProgram(occurrences);
        },
        error: (cause) => this.fail({ kind: 'occurrences', cause }),
      });
  }

  private loadProgram(occurrences: IEventOccurrence[]): void {
    this.programRequest?.unsubscribe();
    this.programRequest = null;
    this.programsByOccurrenceId.set(new Map());
    this.beginLoad();

    if (!occurrences.length) {
      this.finishLoad();
      return;
    }

    this.programRequest = forkJoin(
      occurrences.map((occurrence) =>
        this.eventProgramRead
          .getPublishedProgramItemsByOccurrenceId(occurrence.id)
          .pipe(
            map((items) => ({
              occurrenceId: occurrence.id,
              items,
            })),
          ),
      ),
    ).subscribe({
      next: (programs) => {
        this.programsByOccurrenceId.set(
          new Map(
            programs.map((program) => [
              program.occurrenceId,
              program.items,
            ]),
          ),
        );
        this.finishLoad();
      },
      error: (cause) => this.fail({ kind: 'program', cause }),
    });
  }

  private beginLoad(): void {
    this.loadError.set(null);
    this.isLoading.set(true);
  }

  private finishLoad(): void {
    this.loadError.set(null);
    this.isLoading.set(false);
  }

  private fail(error: ChaoticThursdaysLoadError): void {
    this.loadError.set(error);
    this.isLoading.set(false);
  }

  private resetPageState(): void {
    this.page.set(null);
    this.selectedEventId.set(null);
    this.resetEditionState();
  }

  private resetEditionState(): void {
    this.selectedOccurrenceIndex.set(0);
    this.occurrences.set([]);
    this.programsByOccurrenceId.set(new Map());
  }

  private cancelRequests(): void {
    this.groupedPageRequest?.unsubscribe();
    this.groupedPageRequest = null;
    this.cancelEditionRequests();
  }

  private cancelEditionRequests(): void {
    this.occurrencesRequest?.unsubscribe();
    this.occurrencesRequest = null;
    this.programRequest?.unsubscribe();
    this.programRequest = null;
  }
}
