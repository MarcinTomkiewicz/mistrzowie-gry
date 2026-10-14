import { Component, computed, effect, inject } from '@angular/core';
import { provideTranslocoScope } from '@jsverse/transloco';

import { LoadingOverlay } from '../../../common/loading-overlay/loading-overlay';
import { OccurrenceSwitcher } from '../../../common/occurrence-switcher/occurrence-switcher';
import { Storage } from '../../../core/services/storage/storage';
import { UiToast } from '../../../core/services/ui-toast/ui-toast';
import { formatDateLabel } from '../../../core/utils/date';
import { createPublicEventProgramCards } from '../../../core/utils/public-event-program-cards';
import { EventSlots } from '../../common/event-slots/event-slots';
import { GmProfileDialog } from '../gm-profile-dialog/gm-profile-dialog';
import { EventPageFacade } from './event-page-facade';
import { createEventPageI18n } from './event-page.i18n';

@Component({
  selector: 'app-event-page-program',
  imports: [EventSlots, GmProfileDialog, LoadingOverlay, OccurrenceSwitcher],
  templateUrl: './event-page-program.html',
  providers: [provideTranslocoScope('eventPage', 'common')],
})
export class EventPageProgram {
  private readonly storage = inject(Storage);
  private readonly toast = inject(UiToast);
  protected readonly facade = inject(EventPageFacade);
  protected readonly i18n = createEventPageI18n();

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
