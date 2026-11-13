import { DestroyRef, ErrorHandler, Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { defer, finalize, map, of, tap, type Observable } from 'rxjs';

import { EVENT_PARTICIPANT_CONTACT_PHONES } from '../../../core/configs/events.config';
import type { IPublicEventEdition } from '../../../core/interfaces/i-event-page';
import type {
  EventParticipantSignupTarget, IEventParticipantGuestIdentity, IEventParticipantRegisterRequest,
  IEventParticipantRegisterResult,
} from '../../../core/interfaces/i-event-participant';
import { Auth } from '../../../core/services/auth/auth';
import { EventParticipant } from '../../../core/services/event-participant/event-participant';
import { Platform } from '../../../core/services/platform/platform';
import { UiToast } from '../../../core/services/ui-toast/ui-toast';
import { UiConfirm } from '../../../core/services/ui-confirm/ui-confirm';
import type { PublicEventOccurrence } from '../../../core/types/public-event-page';
import type { PublicEventConfirmedEntry } from '../../../core/types/public-event-program';
import { RpcError } from '../../../core/types/rpc-error';
import { assertEdgeContract, readEdgeNonBlankString } from '../../../core/utils/edge-contract';
import { normalizePolishPhoneNumber } from '../../../core/utils/phone';
import { EventPageFacade } from './event-page-facade';
import { EventParticipantAvailability } from './event-participant-availability';
import { createEventPageI18n } from './event-page.i18n';

type SignupSelection = {
  target: EventParticipantSignupTarget;
  entry: PublicEventConfirmedEntry | null;
  occurrence: PublicEventOccurrence;
  edition: IPublicEventEdition;
  eventName: string;
  actorId: string | null;
};
type SignupDialog = {
  selection: SignupSelection;
  result: IEventParticipantRegisterResult | null;
  failure: 'rejected' | 'uncertain' | null;
};
type UncertainRequest = { actorKey: string; eventId: string; target: EventParticipantSignupTarget };

@Injectable()
export class EventParticipantSignupFacade {
  private readonly page = inject(EventPageFacade);
  private readonly availability = inject(EventParticipantAvailability);
  private readonly participant = inject(EventParticipant);
  private readonly auth = inject(Auth);
  private readonly platform = inject(Platform);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toast = inject(UiToast);
  private readonly confirm = inject(UiConfirm);
  private readonly errorHandler = inject(ErrorHandler);
  private readonly i18n = createEventPageI18n();
  private readonly dialogState = signal<SignupDialog | null>(null);
  private readonly submitting = signal(false);
  private readonly receiptDecisionPending = signal(false);
  // Actor history and guest receipts stay in route memory, never in TransferState, storage or URLs.
  private readonly uncertainRequests = signal<readonly UncertainRequest[]>([]);
  private readonly guestPhone = signal<string | null>(null);
  private readonly guestHistoryActorKey = signal<string | null>(null);
  private readonly currentUncertainRequests = computed(() => {
    const page = this.page.state();
    const userId = this.auth.userId();
    const actorKey = userId !== null ? 'user:' + userId : this.guestHistoryActorKey();
    return this.auth.isReady() && page.kind === 'ready'
      ? this.uncertainRequests().filter(item => item.eventId === page.edition.id && item.actorKey === actorKey) : [];
  });

  readonly isSubmitting = this.submitting.asReadonly();
  readonly isReceiptDecisionPending = this.receiptDecisionPending.asReadonly();
  readonly hasGuestReceipt = computed(() => {
    const result = this.dialogState()?.result;
    return !!(result?.registered && result.confirmationCode);
  });
  readonly isAuthenticated = this.auth.isAuthenticated;
  readonly accountName = this.auth.displayName;
  readonly cancellationPhone = computed(() => {
    const page = this.page.state();
    return page.kind === 'ready' ? EVENT_PARTICIPANT_CONTACT_PHONES[page.page.core.key] ?? null : null;
  });
  readonly hasUncertainResults = computed(() => this.currentUncertainRequests().length > 0);
  readonly dialog = computed(() => {
    const dialog = this.dialogState();
    return dialog && (this.hasGuestReceipt() || this.isSelectionCurrent(dialog.selection)) ? dialog : null;
  });
  readonly canSubmit = computed(() => {
    const dialog = this.dialog();
    return !!dialog && this.isSelectionCurrent(dialog.selection) && !this.isSubmitting() && !this.receiptDecisionPending() && !dialog.result &&
      !this.hasUncertainTarget(dialog.selection.target) && this.targetAvailability(dialog.selection.target)?.canSignup === true;
  });

  constructor() {
    effect(() => {
      this.page.state();
      this.page.selectedOccurrence();
      this.auth.userId();
      const actorReady = this.auth.isReady();
      const dialog = this.dialogState();
      const keepReceipt = this.hasGuestReceipt() || this.isSubmitting();
      untracked(() => {
        if (dialog && actorReady && !keepReceipt && !this.isSelectionCurrent(dialog.selection)) this.clearDialog();
      });
    });
  }

  hasUncertainResult(programItemId: string | null): boolean {
    return programItemId !== null && this.hasUncertainTarget({ scope: 'program_item', programItemId });
  }

  hasUncertainWholeEventResult(): boolean {
    const occurrence = this.page.selectedOccurrence();
    return occurrence !== null && this.hasUncertainTarget({ scope: 'whole_event', occurrenceId: occurrence.id });
  }

  setGuestPhone(value: string): void {
    const dialog = this.dialog();
    if (dialog && !this.isAuthenticated() && !this.isSubmitting() && !dialog.result) {
      const phone = normalizePolishPhoneNumber(value);
      this.guestPhone.set(phone);
      if (phone) this.guestHistoryActorKey.set('guest:' + phone);
    }
  }

  open(programItemId: string | null): void {
    if (programItemId !== null) this.openTarget({ scope: 'program_item', programItemId });
  }

  openWholeEvent(): void {
    const occurrence = this.page.selectedOccurrence();
    if (occurrence) this.openTarget({ scope: 'whole_event', occurrenceId: occurrence.id });
  }

  close(): void {
    this.confirmContextChange().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  selectOccurrence(index: number): void {
    const page = this.page.state();
    if (page.kind !== 'ready' || !page.occurrences[index] || index === this.page.selectedOccurrenceIndex()) return;
    this.confirmContextChange().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(accepted => {
      if (accepted && this.page.state() === page) this.page.selectOccurrence(index);
    });
  }

  canDeactivate(): Observable<boolean> {
    return this.confirmReceiptDiscard(this.i18n.signup().leaveConfirmation);
  }

  confirmContextChange(): Observable<boolean> {
    return defer(() => {
      const dialog = this.dialogState();
      return this.confirmReceiptDiscard(this.i18n.signup().discardReceiptConfirmation).pipe(
        map(accepted => accepted && this.dialogState() === dialog && !this.isSubmitting()),
        tap(accepted => { if (accepted) this.clearDialog(); }),
      );
    });
  }

  register(guest?: IEventParticipantGuestIdentity): void {
    const selection = this.dialog()?.selection;
    if (!this.platform.isBrowser || !selection || !this.canSubmit()) return;
    const { target, edition } = selection;
    let request: IEventParticipantRegisterRequest;
    if (selection.actorId !== null) {
      request = { ...target, mode: 'authenticated' };
    } else {
      if (!guest) return;
      this.setGuestPhone(guest.guestPhone);
      const guestPhone = this.guestPhone();
      if (guestPhone === null || !this.canSubmit()) return;
      request = { ...target, mode: 'guest', guestName: guest.guestName, guestPhone };
    }
    const actorKey = this.actorKey();
    if (!actorKey || !this.canSubmit()) return;
    const context: UncertainRequest = { actorKey, eventId: edition.id, target };
    this.submitting.set(true);
    this.participant.register(request).pipe(
      map(response => {
        if (response.registered) {
          assertEdgeContract(response.scope === target.scope && response.occurrenceId === selection.occurrence.id &&
            response.eventProgramItemId === (target.scope === 'program_item' ? target.programItemId : null),
          'participantRegistration', 'the selected registration scope and occurrence');
          if (request.mode === 'guest') readEdgeNonBlankString(response.confirmationCode, 'participantRegistration.confirmationCode');
          else assertEdgeContract(response.confirmationCode === null, 'participantRegistration.confirmationCode', 'null for an account');
        }
        return response;
      }),
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.submitting.set(false)),
    ).subscribe({
      next: result => {
        if (this.dialogState()?.selection === selection || result.registered && result.confirmationCode !== null) {
          this.dialogState.set({ selection, result, failure: null });
          if (result.registered) this.toast.success({ summary: target.scope === 'program_item'
            ? this.i18n.signup().confirmedSession : this.i18n.signup().confirmedWholeEvent });
          else this.toast.warn({ summary: target.scope === 'program_item'
            ? this.i18n.signup().unavailable : this.i18n.signup().wholeEventUnavailable });
        }
        this.availability.refresh();
      },
      error: (error: unknown) => {
        this.errorHandler.handleError(error);
        const rejected = error instanceof RpcError && ['22023', '22P02', '23514', '23505', '42501', 'P0002', 'P0001'].includes(error.code);
        if (!rejected) this.uncertainRequests.update(items => [...items, context]);
        if (this.dialog()?.selection === selection) this.dialogState.set({ selection, result: null, failure: rejected ? 'rejected' : 'uncertain' });
        this.toast.show(rejected ? 'danger' : 'warn', { summary: rejected
          ? this.i18n.signup().rejected : this.i18n.signup().unknownResult });
        this.availability.refresh();
      },
    });
  }

  private openTarget(target: EventParticipantSignupTarget): void {
    const page = this.page.state();
    const occurrence = this.page.selectedOccurrence();
    if (!this.platform.isBrowser || this.isSubmitting() || this.receiptDecisionPending() || this.dialogState()?.result || page.kind !== 'ready' || !occurrence ||
      this.hasUncertainTarget(target) || !this.targetAvailability(target)?.canSignup) return;
    const entry = target.scope === 'program_item' ? this.page.selectedProgram().find(
      (item): item is PublicEventConfirmedEntry => item.kind === 'confirmed' && item.session !== null && item.programItemId === target.programItemId,
    ) ?? null : null;
    if (target.scope === 'program_item' && entry === null) return;
    this.clearDialog();
    this.dialogState.set({ selection: { target, entry, occurrence, edition: page.edition,
      eventName: page.page.core.name, actorId: this.auth.userId() }, result: null, failure: null });
  }

  private targetAvailability(target: EventParticipantSignupTarget) {
    return target.scope === 'program_item' ? this.availability.forProgramItem(target.programItemId) : this.availability.forWholeEvent();
  }

  private hasUncertainTarget(target: EventParticipantSignupTarget): boolean {
    const page = this.page.state();
    const actorKey = this.actorKey();
    return this.auth.isReady() && page.kind === 'ready' && actorKey !== null &&
      this.uncertainRequests().some(item => item.eventId === page.edition.id && item.actorKey === actorKey &&
        item.target.scope === target.scope && (item.target.scope === 'program_item' && target.scope === 'program_item'
          ? item.target.programItemId === target.programItemId
          : item.target.scope === 'whole_event' && target.scope === 'whole_event' && item.target.occurrenceId === target.occurrenceId));
  }

  private actorKey(): string | null {
    const userId = this.auth.userId();
    const phone = this.guestPhone();
    return userId !== null ? 'user:' + userId : phone ? 'guest:' + phone : null;
  }

  private confirmReceiptDiscard(message: string): Observable<boolean> {
    return defer(() => {
      if (this.isSubmitting() || this.receiptDecisionPending()) return of(false);
      if (!this.hasGuestReceipt()) return of(true);
      this.receiptDecisionPending.set(true);
      return this.confirm.modalDecision({ header: this.i18n.signup().confirmationCodeLabel, message,
        acceptLabel: this.i18n.actions().confirm, rejectLabel: this.i18n.actions().cancel,
      }).pipe(finalize(() => this.receiptDecisionPending.set(false)));
    });
  }

  private isSelectionCurrent(selection: SignupSelection): boolean {
    const page = this.page.state();
    return this.auth.isReady() && selection.actorId === this.auth.userId() && page.kind === 'ready' &&
      selection.edition.id === page.edition.id && selection.occurrence.id === this.page.selectedOccurrence()?.id;
  }

  private clearDialog(): void {
    this.dialogState.set(null);
    this.guestPhone.set(null);
  }
}
