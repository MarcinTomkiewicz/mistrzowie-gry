import { Component, computed, DestroyRef, effect, ErrorHandler, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { finalize } from 'rxjs';

import { LoadingOverlay } from '../../../common/loading-overlay/loading-overlay';
import { OccurrenceSwitcher } from '../../../common/occurrence-switcher/occurrence-switcher';
import type { IEventParticipantAvailability } from '../../../core/interfaces/i-event-participant';
import { Storage } from '../../../core/services/storage/storage';
import { UiToast } from '../../../core/services/ui-toast/ui-toast';
import { UiConfirm } from '../../../core/services/ui-confirm/ui-confirm';
import type { EventPageOfflineSeatsTranslations } from '../../../core/types/i18n/event-page';
import { RpcError } from '../../../core/types/rpc-error';
import { formatDateLabel } from '../../../core/utils/date';
import {
  createPublicEventProgramCards, groupPublicEventProgramEntries,
} from '../../../core/utils/public-event-program-cards';
import { EventSlots } from '../../common/event-slots/event-slots';
import { GmProfileDialog } from '../gm-profile-dialog/gm-profile-dialog';
import { SessionDialog } from '../session-dialog/session-dialog';
import { EventPageFacade } from './event-page-facade';
import { EventParticipantSignup } from './event-participant-signup';
import { EventParticipantSignupFacade } from './event-participant-signup-facade';
import { EventParticipantAvailability } from './event-participant-availability';
import { EventProgramOfflineSeats } from './event-program-offline-seats';
import { createEventPageI18n } from './event-page.i18n';

const offlineErrorKeys: Readonly<Record<string, keyof EventPageOfflineSeatsTranslations['errors']>> = {
  EFS063_INVALID_ARGUMENT: 'invalid', EFS063_PROGRAM_ITEM_NOT_FOUND: 'notFound', EFS063_OCCURRENCE_NOT_FOUND: 'notFound',
  EFS063_EVENT_NOT_FOUND: 'notFound', EFS063_TARGET_NOT_BOOKABLE: 'notBookable', EFS063_CAPACITY_UNAVAILABLE: 'capacityUnavailable',
  EFS063_OFFLINE_SEATS_EMPTY: 'empty', EFS063_OFFLINE_CAPACITY_EXCEEDED: 'capacityExceeded',
};

@Component({
  selector: 'app-event-page-program',
  imports: [
    ButtonModule, MessageModule, EventSlots, GmProfileDialog, LoadingOverlay, OccurrenceSwitcher,
    SessionDialog, EventParticipantSignup,
  ],
  templateUrl: './event-page-program.html',
})
export class EventPageProgram {
  private readonly storage = inject(Storage);
  private readonly toast = inject(UiToast);
  private readonly errorHandler = inject(ErrorHandler);
  private readonly confirm = inject(UiConfirm);
  private readonly destroyRef = inject(DestroyRef);
  private readonly collapsedCardLimit = 6;
  private readonly expandedGroupKeys = signal<ReadonlySet<string>>(new Set());
  protected readonly facade = inject(EventPageFacade);
  protected readonly signup = inject(EventParticipantSignupFacade);
  protected readonly availability = inject(EventParticipantAvailability);
  protected readonly offline = inject(EventProgramOfflineSeats);
  protected readonly offlineDecisionPending = signal(false);
  protected readonly i18n = createEventPageI18n();
  protected readonly selectedProgramItemId = signal<string | null>(null);
  protected readonly offlineErrorMessage = computed(() => {
    const failure = this.offline.error();
    if (failure === null) return null;
    const error = failure.cause;
    const copy = this.i18n.offlineSeats().errors;
    const key = error instanceof RpcError ? offlineErrorKeys[error.message] ?? (error.code === '42501' ? 'forbidden' : 'unknown') : 'unknown';
    return copy[key];
  });
  protected readonly occurrenceOptions = computed(() => {
    const program = this.facade.programState();
    return program.kind === 'ready' ? program.occurrences.map(occurrence => ({
      ...occurrence, label: formatDateLabel(occurrence.occurrenceDate, 'pl-PL', true),
    })) : [];
  });
  protected readonly groups = computed(() => {
    const state = this.facade.state();
    if (state.kind !== 'ready') return [];
    const read = this.availability.state();
    const items = new Map(read.kind === 'ready' && !this.availability.isLoading()
      ? read.items.map(item => [item.programItemId, item] as const) : []);
    return groupPublicEventProgramEntries(this.facade.selectedProgram(), this.i18n.program(), state.page.core.name).map(group => {
      const cards = createPublicEventProgramCards(group.entries, this.storage, this.i18n.program(),
        this.i18n.values().notProvided, this.i18n.roles().gm, state.page.core.name, group).map((card, index) => {
        const entry = group.entries[index];
        if (entry.kind !== 'confirmed' || entry.session === null || entry.timeScope !== 'timed') return card;
        const item = items.get(entry.programItemId);
        if (!item || item.occurrenceId !== entry.occurrenceId) return card;
        const uncertain = this.signup.hasUncertainResult(card.id);
        return { ...card,
          eventCapacity: card.eventCapacity ? { ...card.eventCapacity, remainingSeats: item.remainingSeats } : undefined,
          participantSignup: {
            canSignup: item.canSignup && !uncertain,
            remainingSeatsLabel: uncertain ? this.i18n.signup().unknownResult : this.i18n.signup().availabilityStatuses[item.availabilityStatus],
          },
        };
      });
      const expanded = this.expandedGroupKeys().has(group.key);
      return { key: group.key, label: group.label, cards, expanded,
        sessionCount: cards.reduce((count, card) => count + (card.eventCapacity ? 1 : 0), 0),
        remainingCount: Math.max(0, cards.length - this.collapsedCardLimit),
        visibleCards: expanded ? cards : cards.slice(0, this.collapsedCardLimit),
      };
    });
  });
  protected readonly selectedCard = computed(() => this.groups().flatMap(group => group.cards).find(card =>
    card.id === this.selectedProgramItemId() && card.canOpenDetails,
  ) ?? null);

  private readonly resetOccurrenceStateEffect = effect(() => {
    this.facade.selectedOccurrence();
    this.selectedProgramItemId.set(null);
    this.expandedGroupKeys.set(new Set());
  });

  private readonly offlineErrorEffect = effect(() => {
    const error = this.offline.error();
    if (error !== null) {
      this.errorHandler.handleError(error.cause);
      if (error.programItemId === null) this.toast.danger({ summary: this.offlineErrorMessage() ?? this.i18n.errors().generic });
    }
  });

  private readonly availabilityErrorEffect = effect(() => {
    const state = this.availability.state();
    if (state.kind === 'error') {
      this.errorHandler.handleError(state.cause);
      this.toast.danger({ summary: this.i18n.signup().availabilityReadFailed });
    }
  });

  protected toggleGroup(key: string): void {
    const group = this.groups().find((group) => group.key === key);
    if (!group || group.cards.length <= this.collapsedCardLimit) return;

    const expanded = group.expanded;
    const selectedId = this.selectedProgramItemId();
    if (expanded && selectedId !== null && group.cards
      .some((card, index) => index >= this.collapsedCardLimit && card.id === selectedId)) {
      this.selectedProgramItemId.set(null);
    }
    this.expandedGroupKeys.update((current) => {
      const next = new Set(current);
      if (expanded) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  protected availabilityLabel(item: IEventParticipantAvailability): string {
    if (item.availabilityStatus !== 'available') return this.i18n.signup().availabilityStatuses[item.availabilityStatus];
    return item.isUnlimited ? this.i18n.signup().unlimitedSeats : item.remainingSeats !== null
      ? this.i18n.remainingSeats(item.remainingSeats) : this.i18n.signup().availabilityStatuses[item.availabilityStatus];
  }

  protected endOfflineReadback(): void {
    const operation = this.offline.operation();
    if (!operation || !this.offline.canEndReadback() || this.offlineDecisionPending()) return;
    this.offlineDecisionPending.set(true);
    this.confirm.modalDecision({ header: this.i18n.offlineSeats().endReadbackQuestion, message: this.i18n.offlineSeats().endReadbackWarning,
      acceptLabel: this.i18n.offlineSeats().endReadback, rejectLabel: this.i18n.actions().cancel,
    }).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.offlineDecisionPending.set(false))).subscribe(accepted => {
      if (accepted && this.offline.operation() === operation) this.offline.endReadback();
    });
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
