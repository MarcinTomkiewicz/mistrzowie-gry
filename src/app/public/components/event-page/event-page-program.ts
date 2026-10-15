import { Component, computed, effect, inject, signal } from '@angular/core';
import { provideTranslocoScope } from '@jsverse/transloco';

import { LoadingOverlay } from '../../../common/loading-overlay/loading-overlay';
import { OccurrenceSwitcher } from '../../../common/occurrence-switcher/occurrence-switcher';
import type { IEventSlotCardVm } from '../../../core/interfaces/i-event-slot-card';
import { Storage } from '../../../core/services/storage/storage';
import { UiToast } from '../../../core/services/ui-toast/ui-toast';
import { formatDateLabel } from '../../../core/utils/date';
import { createPublicEventProgramCards } from '../../../core/utils/public-event-program-cards';
import { EventSlots } from '../../common/event-slots/event-slots';
import { GmProfileDialog } from '../gm-profile-dialog/gm-profile-dialog';
import { SessionDialog } from '../session-dialog/session-dialog';
import { EventPageFacade } from './event-page-facade';
import { createEventPageI18n } from './event-page.i18n';

@Component({
  selector: 'app-event-page-program',
  imports: [EventSlots, GmProfileDialog, LoadingOverlay, OccurrenceSwitcher, SessionDialog],
  templateUrl: './event-page-program.html',
  providers: [provideTranslocoScope('eventPage', 'common')],
})
export class EventPageProgram {
  private readonly storage = inject(Storage);
  private readonly toast = inject(UiToast);
  protected readonly facade = inject(EventPageFacade);
  protected readonly i18n = createEventPageI18n();
  protected readonly selectedProgramItemId = signal<string | null>(null);

  protected readonly occurrenceOptions = computed(() => {
    const state = this.facade.state();
    return state.kind === 'ready'
      ? state.occurrences.map((occurrence) => ({
          ...occurrence,
          label: formatDateLabel(occurrence.occurrenceDate, 'pl-PL', true),
        }))
      : [];
  });
  protected readonly cards = computed(() => {
    const state = this.facade.state();
    return state.kind === 'ready'
      ? createPublicEventProgramCards(
          this.facade.selectedProgram(), state.systems, this.storage,
          this.i18n.program(), this.i18n.values().notProvided, this.i18n.roles().gm,
        )
      : [];
  });
  protected readonly profile = computed(() => {
    const state = this.facade.profileState();
    return state.kind === 'ready' ? state.profile : null;
  });
  protected readonly selectedCard = computed(() => this.cards().find(card =>
    card.id === this.selectedProgramItemId() && card.canOpenDetails,
  ) ?? null);

  private readonly resetSelectionEffect = effect(() => {
    this.facade.selectedOccurrence();
    this.selectedProgramItemId.set(null);
  });

  protected selectSession(card: IEventSlotCardVm): void {
    if (card.canOpenDetails && card.sessionDetails && card.id) this.selectedProgramItemId.set(card.id);
  }

  private readonly profileErrorEffect = effect(() => {
    const kind = this.facade.profileState().kind;
    if (kind === 'error' || kind === 'not-found') {
      this.toast.danger({
        summary: kind === 'not-found'
          ? this.i18n.errors().notFound : this.i18n.errors().generic,
      });
    }
  });
}
