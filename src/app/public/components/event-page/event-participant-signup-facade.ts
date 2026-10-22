import { DestroyRef, Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, map } from 'rxjs';

import { EVENT_PARTICIPANT_CONTACT_PHONES } from '../../../core/configs/events.config';
import type { IPublicEventEdition } from '../../../core/interfaces/i-event-page';
import type {
  IEventParticipantGuestIdentity, IEventParticipantRegisterRequest,
} from '../../../core/interfaces/i-event-participant';
import { Auth } from '../../../core/services/auth/auth';
import { EventParticipant } from '../../../core/services/event-participant/event-participant';
import { Platform } from '../../../core/services/platform/platform';
import { UiToast } from '../../../core/services/ui-toast/ui-toast';
import type { PublicEventConfirmedEntry } from '../../../core/types/public-event-program';
import { assertEdgeContract, readEdgeNonBlankString, readEdgeUuid } from '../../../core/utils/edge-contract';
import { EventPageFacade } from './event-page-facade';
import { EventParticipantAvailability } from './event-participant-availability';
import { createEventPageI18n } from './event-page.i18n';

type SignupSelection = {
  entry: PublicEventConfirmedEntry;
  edition: IPublicEventEdition;
  eventName: string;
  actorId: string | null;
};
type SignupDialog = { selection: SignupSelection; result: 'confirmed' | 'unavailable' | null };
type UncertainRequest = { actorKey: string; eventId: string; programItemId: string };

@Injectable()
export class EventParticipantSignupFacade {
  private readonly page = inject(EventPageFacade);
  private readonly availability = inject(EventParticipantAvailability);
  private readonly participant = inject(EventParticipant);
  private readonly auth = inject(Auth);
  private readonly platform = inject(Platform);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toast = inject(UiToast);
  private readonly i18n = createEventPageI18n();
  private readonly dialogState = signal<SignupDialog | null>(null);
  private readonly submitting = signal(false);
  // Uncertain request identities stay in route memory, never in TransferState or storage.
  private readonly uncertainRequests = signal<readonly UncertainRequest[]>([]);
  private readonly guestPhone = signal('');
  private readonly guestHistoryActorKey = signal<string | null>(null);
  private readonly currentUncertainRequests = computed(() => {
    const page = this.page.state();
    const userId = this.auth.userId();
    const actorKey = userId !== null ? `user:${userId}` : this.guestHistoryActorKey();
    return this.auth.isReady() && page.kind === 'ready'
      ? this.uncertainRequests().filter((item) =>
          item.eventId === page.edition.id && item.actorKey === actorKey)
      : [];
  });

  readonly released = this.availability.released;
  readonly isSubmitting = this.submitting.asReadonly();
  readonly isAuthenticated = this.auth.isAuthenticated;
  readonly accountName = this.auth.displayName;
  readonly cancellationPhone = computed(() => {
    const page = this.page.state();
    return page.kind === 'ready' ? EVENT_PARTICIPANT_CONTACT_PHONES[page.page.core.key] ?? null : null;
  });
  readonly hasUncertainResults = computed(() => this.currentUncertainRequests().length > 0);
  readonly dialog = computed(() => {
    const dialog = this.dialogState();
    return dialog && this.isSelectionCurrent(dialog.selection) ? dialog : null;
  });
  readonly canSubmit = computed(() => {
    const dialog = this.dialog();
    return this.released() && !!dialog &&
      !this.isSubmitting() && !dialog.result && !this.hasUncertainResult(dialog.selection.entry.programItemId) &&
      this.availability.forProgramItem(dialog.selection.entry.programItemId)?.canSignup === true;
  });

  constructor() {
    effect(() => {
      this.page.state();
      this.page.selectedOccurrence();
      this.auth.userId();
      const actorReady = this.auth.isReady();
      const dialog = this.dialogState();
      untracked(() => {
        // Clear stale presentation without cancelling the pending write or its uncertainty context.
        if (dialog && actorReady && !this.isSelectionCurrent(dialog.selection)) {
          this.clearDialog();
        }
      });
    });
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
    if (!this.released() || !this.platform.isBrowser || this.isSubmitting() || this.dialogState()?.result ||
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
    if (!this.isSubmitting()) {
      this.clearDialog();
    }
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
      map((response) => {
        const path = 'participantRegistration';
        if (response?.registered === true) {
          assertEdgeContract(
            response.status === 'confirmed' && response.eventProgramItemId === entry.programItemId &&
              response.occurrenceId === entry.occurrenceId,
            path, 'a confirmed registration for the selected session and occurrence',
          );
          readEdgeUuid(response.registrationId, `${path}.registrationId`);
          if (request.mode === 'guest') {
            readEdgeNonBlankString(response.confirmationCode, `${path}.confirmationCode`);
          } else {
            assertEdgeContract(response.confirmationCode === null, `${path}.confirmationCode`, 'null for an account');
          }
          return 'confirmed' as const;
        }
        assertEdgeContract(
          response?.registered === false && response.status === 'unavailable',
          path, 'a canonical unavailable result',
        );
        return 'unavailable' as const;
      }),
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.submitting.set(false)),
    ).subscribe({
      next: (result) => {
        // Keep only the public outcome; discard the registration UUID and unused guest secret.
        if (this.dialog()?.selection === selection) {
          this.dialogState.set({ selection, result });
          if (result === 'confirmed') this.toast.success({ summary: this.i18n.signup().confirmedSession });
        }
        this.availability.refresh();
      },
      // Keep the original actor/Event/session even if navigation or auth changed during the write.
      error: () => this.recordUncertain(context),
    });
  }

  private actorKey(): string | null {
    const userId = this.auth.userId();
    const phone = this.guestPhone();
    return userId !== null ? `user:${userId}` : phone ? `guest:${phone}` : null;
  }

  private isSelectionCurrent(selection: SignupSelection): boolean {
    const page = this.page.state();
    return this.auth.isReady() && selection.actorId === this.auth.userId() &&
      page.kind === 'ready' && selection.edition.id === page.edition.id &&
      selection.entry.occurrenceId === this.page.selectedOccurrence()?.id;
  }

  private recordUncertain(context: UncertainRequest): void {
    this.uncertainRequests.update((items) => [...items, context]);
  }

  private clearDialog(): void {
    this.dialogState.set(null);
    this.guestPhone.set('');
  }
}
