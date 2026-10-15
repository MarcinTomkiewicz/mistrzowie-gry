import { Component, computed, effect, inject, signal } from '@angular/core';
import { provideTranslocoScope } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';

import { LoadingOverlay } from '../../../common/loading-overlay/loading-overlay';
import { OccurrenceSwitcher } from '../../../common/occurrence-switcher/occurrence-switcher';
import type { IEventSlotCardVm } from '../../../core/interfaces/i-event-slot-card';
import { Storage } from '../../../core/services/storage/storage';
import { UiToast } from '../../../core/services/ui-toast/ui-toast';
import { formatDateLabel } from '../../../core/utils/date';
import {
  createPublicEventProgramCards, groupPublicEventProgramEntries,
} from '../../../core/utils/public-event-program-cards';
import { formatTimeRangeLabel } from '../../../core/utils/time-format';
import { EventSlots } from '../../common/event-slots/event-slots';
import { GmProfileDialog } from '../gm-profile-dialog/gm-profile-dialog';
import { SessionDialog } from '../session-dialog/session-dialog';
import { EventPageFacade } from './event-page-facade';
import { EventParticipantSignup } from './event-participant-signup';
import { EventParticipantSignupFacade } from './event-participant-signup-facade';
import { createEventPageI18n } from './event-page.i18n';

@Component({
  selector: 'app-event-page-program',
  imports: [
    ButtonModule, EventSlots, GmProfileDialog, LoadingOverlay, OccurrenceSwitcher,
    SessionDialog, EventParticipantSignup,
  ],
  templateUrl: './event-page-program.html',
  providers: [EventParticipantSignupFacade, provideTranslocoScope('eventPage', 'common')],
})
export class EventPageProgram {
  private readonly storage = inject(Storage);
  private readonly toast = inject(UiToast);
  private readonly collapsedCardLimit = 6;
  private readonly expandedGroupKeys = signal<ReadonlySet<string>>(new Set());
  protected readonly facade = inject(EventPageFacade);
  protected readonly signup = inject(EventParticipantSignupFacade);
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
  protected readonly groups = computed(() => {
    const state = this.facade.state();
    return state.kind === 'ready'
      ? groupPublicEventProgramEntries(this.facade.selectedProgram()).map((group) => ({
          key: group.key,
          label: formatTimeRangeLabel(group.startTime, group.endTime) ||
            this.i18n.program().timeToBeDetermined,
          cards: createPublicEventProgramCards(
            group.entries, state.systems, this.storage,
            this.i18n.program(), this.i18n.values().notProvided, this.i18n.roles().gm,
            state.page.core.name,
          ).map((card) => {
            const availability = this.signup.availabilityFor(card.id);
            return availability && availability.remainingSeats !== null ? {
              ...card,
              participantSignup: {
                canSignup: availability.canSignup && !this.signup.hasUncertainResult(card.id),
                remainingSeatsLabel: this.i18n.remainingSeats(availability.remainingSeats),
              },
            } : card;
          }),
        }))
      : [];
  });
  protected readonly displayGroups = computed(() => this.groups().map((group) => {
    const expanded = this.expandedGroupKeys().has(group.key);
    return {
      ...group,
      expanded,
      remainingCount: Math.max(0, group.cards.length - this.collapsedCardLimit),
      visibleCards: expanded ? group.cards : group.cards.slice(0, this.collapsedCardLimit),
    };
  }));
  protected readonly profile = computed(() => {
    const state = this.facade.profileState();
    return state.kind === 'ready' ? state.profile : null;
  });
  protected readonly selectedCard = computed(() => this.groups().flatMap(group => group.cards).find(card =>
    card.id === this.selectedProgramItemId() && card.canOpenDetails,
  ) ?? null);

  private readonly resetOccurrenceStateEffect = effect(() => {
    this.facade.selectedOccurrence();
    this.selectedProgramItemId.set(null);
    this.expandedGroupKeys.set(new Set());
  });

  protected toggleGroup(key: string): void {
    const group = this.groups().find((group) => group.key === key);
    if (!group || group.cards.length <= this.collapsedCardLimit) return;

    const expanded = this.expandedGroupKeys().has(key);
    const selectedId = this.selectedProgramItemId();
    if (expanded && selectedId !== null && group.cards.slice(this.collapsedCardLimit)
      .some((card) => card.id === selectedId)) {
      this.selectedProgramItemId.set(null);
    }
    this.expandedGroupKeys.update((current) => {
      const next = new Set(current);
      if (expanded) next.delete(key);
      else next.add(key);
      return next;
    });
  }

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
