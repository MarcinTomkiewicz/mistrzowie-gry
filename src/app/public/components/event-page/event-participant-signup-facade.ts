import { DestroyRef, Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription, finalize } from 'rxjs';

import { PUBLIC_EVENT_PARTICIPANT_SIGNUP_ENABLED } from '../../../core/configs/events.config';
import type { IPublicEventEdition } from '../../../core/interfaces/i-event-page';
import type {
  IEventParticipantGetMyResult, IEventParticipantGuestIdentity,
  IEventParticipantRegisterRequest, IEventParticipantRegisterResult,
} from '../../../core/interfaces/i-event-participant';
import { Auth } from '../../../core/services/auth/auth';
import { EventParticipant } from '../../../core/services/event-participant/event-participant';
import { Platform } from '../../../core/services/platform/platform';
import type { PublicEventConfirmedEntry } from '../../../core/types/public-event-program';
import { EventPageFacade } from './event-page-facade';
import { EventParticipantAvailability } from './event-participant-availability';

type SignupSelection = {
  entry: PublicEventConfirmedEntry;
  edition: IPublicEventEdition;
  eventName: string;
  actorId: string | null;
};
type SignupDialog = { selection: SignupSelection; result: IEventParticipantRegisterResult | null };
type UncertainRequest = { actorKey: string; eventId: string; programItemId: string };
type OwnRegistrationState =
  | { kind: 'idle' | 'loading' | 'error' | 'unavailable' }
  | { kind: 'ready'; registration: Extract<IEventParticipantGetMyResult, { found: true }> };

@Injectable()
export class EventParticipantSignupFacade {
  private readonly page = inject(EventPageFacade);
  private readonly availability = inject(EventParticipantAvailability);
  private readonly participant = inject(EventParticipant);
  private readonly auth = inject(Auth);
  private readonly platform = inject(Platform);
  private readonly destroyRef = inject(DestroyRef);
  private ownRequest: Subscription | null = null;
  private readonly dialogState = signal<SignupDialog | null>(null);
  private readonly submitting = signal(false);
  // These identities and results stay in route memory, never in TransferState or storage.
  private readonly uncertainRequests = signal<readonly UncertainRequest[]>([]);
  private readonly guestPhone = signal('');
  private readonly guestHistoryActorKey = signal<string | null>(null);
  private readonly guestReceiptRevoked = signal(false);
  private presentedReceipt: SignupDialog | null = null;
  private readonly ownState = signal<OwnRegistrationState>({ kind: 'idle' });
  private readonly currentUncertainRequests = computed(() => {
    const page = this.page.state();
    const userId = this.auth.userId();
    const actorKey = userId !== null ? `user:${userId}` : this.guestHistoryActorKey();
    return this.auth.isReady() && page.kind === 'ready'
      ? this.uncertainRequests().filter((item) =>
          item.eventId === page.edition.id && item.actorKey === actorKey)
      : [];
  });

  readonly released = PUBLIC_EVENT_PARTICIPANT_SIGNUP_ENABLED;
  readonly isSubmitting = this.submitting.asReadonly();
  readonly isAuthenticated = this.auth.isAuthenticated;
  readonly accountName = this.auth.displayName;
  readonly ownRegistration = this.ownState.asReadonly();
  readonly hasUncertainResults = computed(() => this.currentUncertainRequests().length > 0);
  readonly dialog = computed(() => {
    const dialog = this.dialogState();
    return dialog && this.isActorCurrent(dialog.selection) ? dialog : null;
  });
  readonly confirmationCode = computed(() => {
    const dialog = this.dialog();
    return dialog?.selection.actorId === null && dialog.result?.registered
      ? dialog.result.confirmationCode : null;
  });
  readonly hasGuestReceipt = computed(() => {
    const dialog = this.dialogState();
    return dialog?.selection.actorId === null && !!(dialog.result?.registered && dialog.result.confirmationCode);
  });
  readonly canSubmit = computed(() => {
    const dialog = this.dialog();
    return this.released && !!dialog && this.isSelectionCurrent(dialog.selection) &&
      !this.isSubmitting() && !dialog.result && !this.hasUncertainResult(dialog.selection.entry.programItemId) &&
      this.availability.forProgramItem(dialog.selection.entry.programItemId)?.canSignup === true;
  });

  constructor() {
    effect(() => {
      this.page.state();
      this.page.selectedOccurrence();
      const actorId = this.auth.userId();
      const actorReady = this.auth.isReady();
      const dialog = this.dialogState();
      const submitting = this.isSubmitting();
      untracked(() => {
        // A confirmed authenticated identity permanently revokes the previous anonymous identity.
        if (dialog?.selection.actorId === null && actorReady && actorId !== null) {
          this.guestReceiptRevoked.set(true);
        }
        if (dialog && !submitting && actorReady) {
          const staleSelection = !dialog.result && !this.isSelectionCurrent(dialog.selection);
          const staleResult = dialog.result !== null && !this.isActorCurrent(dialog.selection) && !this.hasGuestReceipt();
          // Preserve pending writes and protected guest receipts until explicit acknowledgement/discard.
          if (staleSelection || staleResult) {
            this.clearDialog();
            return;
          }
        }
        if (!dialog || !this.isActorCurrent(dialog.selection)) {
          this.ownRequest?.unsubscribe();
          this.ownState.set({ kind: 'idle' });
        } else if (dialog.result?.registered && dialog.selection.actorId !== null && this.ownState().kind === 'idle') {
          this.refreshOwnRegistration();
        }
      });
    });
    this.destroyRef.onDestroy(() => this.ownRequest?.unsubscribe());
  }

  hasUncertainResult(programItemId: string | null): boolean {
    const page = this.page.state();
    const actorKey = this.actorKey();
    return this.auth.isReady() && page.kind === 'ready' && actorKey !== null &&
      this.uncertainRequests().some((item) => item.eventId === page.edition.id &&
        item.actorKey === actorKey && item.programItemId === programItemId);
  }

  setGuestPhone(value: string): void {
    const dialog = this.dialog();
    if (dialog && !this.isAuthenticated() && !this.isSubmitting() && !dialog.result) {
      const phone = value.trim();
      this.guestPhone.set(phone);
      // A form reset clears the input, not the identity whose uncertain history is being shown.
      if (phone) this.guestHistoryActorKey.set(`guest:${phone}`);
    }
  }

  open(programItemId: string | null): void {
    const page = this.page.state();
    if (!this.released || !this.platform.isBrowser || this.isSubmitting() || this.dialogState()?.result ||
      page.kind !== 'ready' || this.hasUncertainResult(programItemId) ||
      !this.availability.forProgramItem(programItemId)?.canSignup) return;
    const entry = this.page.selectedProgram().find((item): item is PublicEventConfirmedEntry =>
      item.kind === 'confirmed' && item.programItemId === programItemId);
    if (!entry) return;
    this.clearDialog();
    this.dialogState.set({
      selection: { entry, edition: page.edition, eventName: page.page.core.name, actorId: this.auth.userId() },
      result: null,
    });
  }

  close(): void {
    if (!this.isSubmitting() && this.dialog() && (!this.hasGuestReceipt() || this.canAcknowledgeReceipt())) {
      this.clearDialog();
    }
  }

  markReceiptPresented(): void {
    if (this.confirmationCode()) this.presentedReceipt = this.dialog();
  }

  canAcknowledgeReceipt(): boolean {
    return this.hasGuestReceipt() && this.dialog() !== null && this.dialog() === this.presentedReceipt;
  }

  prepareGuestReceiptDiscard(): () => boolean {
    const result = this.dialogState()?.result;
    const registrationId = result?.registered ? result.registrationId : null;
    // Capture only the registration identity; the navigation callback never receives the secret.
    return () => {
      const current = this.dialogState()?.result;
      if (this.isSubmitting() || !this.hasGuestReceipt() || !current?.registered ||
        current.registrationId !== registrationId) return false;
      this.clearDialog();
      return true;
    };
  }

  register(guest: IEventParticipantGuestIdentity): void {
    const selection = this.dialog()?.selection;
    if (!this.platform.isBrowser || !selection || this.isSubmitting()) return;
    if (!this.isAuthenticated()) this.setGuestPhone(guest.guestPhone);
    const actorKey = this.actorKey();
    if (!actorKey || !this.canSubmit() ||
      !this.availability.forProgramItem(selection.entry.programItemId)?.canSignup) return;

    const { entry, edition } = selection;
    const context: UncertainRequest = { actorKey, eventId: edition.id, programItemId: entry.programItemId };
    const request: IEventParticipantRegisterRequest = selection.actorId !== null
      ? { mode: 'authenticated', programItemId: entry.programItemId }
      : { mode: 'guest', programItemId: entry.programItemId, ...guest };

    this.submitting.set(true);
    this.participant.register(request).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.submitting.set(false)),
    ).subscribe({
      next: (response) => {
        if (response.registered && (response.status !== 'confirmed' ||
          response.eventProgramItemId !== entry.programItemId || response.occurrenceId !== entry.occurrenceId ||
          (selection.actorId === null ? !response.confirmationCode?.trim() : response.confirmationCode !== null))) {
          this.recordUncertain(context);
          return;
        }
        // Never drop the one-time guest receipt because Edition, occurrence or auth changed during the RPC.
        this.dialogState.set({ selection, result: response });
        this.availability.refresh();
      },
      // Keep the original actor/Event/session even if navigation or auth changed during the write.
      error: () => this.recordUncertain(context),
    });
  }

  refreshOwnRegistration(): void {
    const dialog = this.dialog();
    const result = dialog?.result;
    if (!this.platform.isBrowser || !dialog?.selection.actorId || !result?.registered ||
      this.ownState().kind === 'loading') return;
    this.ownRequest?.unsubscribe();
    this.ownState.set({ kind: 'loading' });
    this.ownRequest = this.participant.getMy({
      registrationId: result.registrationId, confirmationCode: null,
    }).subscribe({
      next: (registration) => {
        if (this.dialog() !== dialog) return;
        this.ownState.set(registration.found && registration.registrationId === result.registrationId &&
          registration.occurrenceId === result.occurrenceId &&
          registration.eventProgramItemId === result.eventProgramItemId
          ? { kind: 'ready', registration } : { kind: 'unavailable' });
      },
      error: () => {
        if (this.dialog() === dialog) {
          this.ownState.set({ kind: 'error' });
        }
      },
    });
  }

  private actorKey(): string | null {
    const userId = this.auth.userId();
    const phone = this.guestPhone();
    return userId !== null ? `user:${userId}` : phone ? `guest:${phone}` : null;
  }

  private isSelectionCurrent(selection: SignupSelection): boolean {
    const page = this.page.state();
    return this.isActorCurrent(selection) && page.kind === 'ready' && selection.edition.id === page.edition.id &&
      selection.entry.occurrenceId === this.page.selectedOccurrence()?.id;
  }

  private isActorCurrent(selection: SignupSelection): boolean {
    return this.auth.isReady() && selection.actorId === this.auth.userId() &&
      (selection.actorId !== null || !this.guestReceiptRevoked());
  }

  private recordUncertain(context: UncertainRequest): void {
    this.uncertainRequests.update((items) => [...items, context]);
  }

  private clearDialog(): void {
    this.ownRequest?.unsubscribe();
    this.ownRequest = null;
    this.dialogState.set(null);
    this.guestPhone.set('');
    this.guestReceiptRevoked.set(false);
    this.presentedReceipt = null;
    this.ownState.set({ kind: 'idle' });
  }
}
