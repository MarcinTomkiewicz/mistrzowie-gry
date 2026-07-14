import {
  computed,
  DestroyRef,
  inject,
  Injectable,
  signal,
} from '@angular/core';
import { Subscription } from 'rxjs';

import { IHostEventCatalogItem } from '../../../core/interfaces/i-event-catalog';
import { IEventSignupOccurrenceVm } from '../../../core/interfaces/i-event-signup';
import { EventRead } from '../../../core/services/event-read/event-read';
import { EventSignupRead } from '../../../core/services/event-signup-read/event-signup-read';
import { EventSignupPageLoadError } from '../../../core/types/event-signup';
import {
  getEndOfNextMonthIso,
  getStartOfCurrentMonthIso,
} from '../../../core/utils/date';

@Injectable()
export class EventSignupPageFacade {
  private readonly destroyRef = inject(DestroyRef);
  private readonly eventRead = inject(EventRead);
  private readonly eventSignupRead = inject(EventSignupRead);

  private readonly rangeStartIso = getStartOfCurrentMonthIso();
  private readonly rangeEndIso = getEndOfNextMonthIso();

  readonly catalog = signal<IHostEventCatalogItem[]>([]);
  readonly selectedCoreId = signal<string | null>(null);
  readonly selectedEditionId = signal<string | null>(null);
  readonly occurrences = signal<IEventSignupOccurrenceVm[]>([]);
  readonly isLoading = signal(false);
  readonly loadError = signal<EventSignupPageLoadError | null>(null);

  readonly selectedCore = computed(() => {
    const selectedCoreId = this.selectedCoreId();

    return (
      this.catalog().find((core) => core.id === selectedCoreId) ?? null
    );
  });

  readonly editions = computed(() => this.selectedCore()?.editions ?? []);

  readonly selectedEdition = computed(() => {
    const selectedEditionId = this.selectedEditionId();

    return (
      this.editions().find((edition) => edition.id === selectedEditionId) ??
      null
    );
  });

  private catalogRequest: Subscription | null = null;
  private editionRequest: Subscription | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => this.cancelRequests());
  }

  load(): void {
    this.cancelRequests();
    this.resetPageState();
    this.beginLoad();

    this.catalogRequest = this.eventRead.getHostCatalog().subscribe({
      next: (catalog) => {
        this.catalog.set(catalog);

        const [firstCore] = catalog;

        if (!firstCore) {
          this.finishLoad();
          return;
        }

        this.selectCore(firstCore.id);
      },
      error: (cause) => this.fail({ kind: 'catalog', cause }),
    });
  }

  retry(): void {
    const loadError = this.loadError();

    if (!loadError) {
      return;
    }

    if (loadError.kind === 'catalog') {
      this.load();
      return;
    }

    this.loadEditionData();
  }

  selectCore(coreId: string): void {
    if (coreId === this.selectedCoreId()) {
      return;
    }

    const core = this.catalog().find((item) => item.id === coreId);

    if (!core) {
      return;
    }

    this.cancelEditionRequest();
    this.selectedEditionId.set(null);
    this.occurrences.set([]);
    this.selectedCoreId.set(core.id);

    const [firstEdition] = core.editions;

    if (!firstEdition) {
      this.finishLoad();
      return;
    }

    this.selectedEditionId.set(firstEdition.id);
    this.loadEditionData();
  }

  selectEdition(editionId: string): void {
    if (
      editionId === this.selectedEditionId() ||
      !this.editions().some((edition) => edition.id === editionId)
    ) {
      return;
    }

    this.selectedEditionId.set(editionId);
    this.loadEditionData();
  }

  private loadEditionData(): void {
    const edition = this.selectedEdition();

    if (!edition) {
      return;
    }

    this.cancelEditionRequest();
    this.occurrences.set([]);
    this.beginLoad();

    this.editionRequest = this.eventSignupRead
      .getOccurrenceVms(
        edition.id,
        this.rangeStartIso,
        this.rangeEndIso,
      )
      .subscribe({
        next: (occurrences) => {
          this.occurrences.set(occurrences);
          this.finishLoad();
        },
        error: (cause) => this.fail({ kind: 'edition-data', cause }),
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

  private fail(error: EventSignupPageLoadError): void {
    this.loadError.set(error);
    this.isLoading.set(false);
  }

  private resetPageState(): void {
    this.catalog.set([]);
    this.selectedCoreId.set(null);
    this.selectedEditionId.set(null);
    this.occurrences.set([]);
  }

  private cancelRequests(): void {
    this.catalogRequest?.unsubscribe();
    this.catalogRequest = null;
    this.cancelEditionRequest();
  }

  private cancelEditionRequest(): void {
    this.editionRequest?.unsubscribe();
    this.editionRequest = null;
  }
}
