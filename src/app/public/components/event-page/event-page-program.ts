import { Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { finalize } from 'rxjs';

import { LoadingOverlay } from '../../../common/loading-overlay/loading-overlay';
import { OccurrenceSwitcher } from '../../../common/occurrence-switcher/occurrence-switcher';
import type { IEventSlotCardVm } from '../../../core/interfaces/i-event-slot-card';
import { Storage } from '../../../core/services/storage/storage';
import { UiToast } from '../../../core/services/ui-toast/ui-toast';
import { UiConfirm } from '../../../core/services/ui-confirm/ui-confirm';
import type { EventPageOfflineSeatsTranslations } from '../../../core/types/i18n/event-page';
import { RpcError } from '../../../core/types/rpc-error';
import { formatDateLabel } from '../../../core/utils/date';
import {
  createPublicEventProgramCards, formatPublicEventProgramTime, groupPublicEventProgramEntries,
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
  protected readonly formatDateLabel = formatDateLabel;
  protected readonly selectedProgramItemId = signal<string | null>(null);
  protected readonly offlineErrorMessage = computed(() => {
    const error = this.offline.error();
    if (error === null) return null;
    const copy = this.i18n.offlineSeats().errors;
    const key = error instanceof RpcError ? offlineErrorKeys[error.message] ?? (error.code === '42501' ? 'forbidden' : 'unknown') : 'unknown';
    return key === 'unknown' && error instanceof RpcError ? `${copy.unknown} (${error.code}: ${error.message})` : copy[key];
  });

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
          label: group.eventScoped ? this.i18n.program().eventScoped : formatPublicEventProgramTime(group, this.i18n.program().dayOffset) ||
            this.i18n.program().timeToBeDetermined,
          cards: createPublicEventProgramCards(
            group.entries, this.storage,
            this.i18n.program(), this.i18n.values().notProvided, this.i18n.roles().gm,
            state.page.core.name,
          ).map((card) => {
            const availability = this.availability.forProgramItem(card.id);
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

  protected selectOccurrence(index: number): void {
    if (!this.signup.isSubmitting() && !this.offline.locked()) this.facade.selectOccurrence(index);
  }

  protected offlineSessionLabel(programItemId: string): string {
    const page = this.facade.state();
    const entry = page.kind === 'ready' ? page.program.find(item => item.kind === 'confirmed' && item.programItemId === programItemId) : null;
    return entry?.kind === 'confirmed' && entry.session?.title ? entry.session.title : programItemId;
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
