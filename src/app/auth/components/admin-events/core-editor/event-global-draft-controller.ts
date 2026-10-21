import { inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { defer, map, Observable, of, switchMap, tap } from 'rxjs';

import { ParticipantSignupKind } from '../../../../core/enums/event';
import { createEventGlobalDraftForm, mapEventGlobalDraftToPayload } from '../../../../core/factories/event-global-draft-form.factory';
import type {
  AdminEffectivePolicyResult, AdminGlobalCalendarResult,
  CreateAdminGlobalEventPayload, CreateAdminGlobalEventResult,
} from '../../../../core/interfaces/i-admin-global-event';
import type { IEventCoreDetail } from '../../../../core/interfaces/i-event-admin';
import { EventAdmin } from '../../../../core/services/event-admin/event-admin';
import { RpcError } from '../../../../core/types/rpc-error';
import { setControlEnabled } from '../../../../core/utils/form-controls';

@Injectable()
export class EventGlobalDraftController {
  private readonly eventAdmin = inject(EventAdmin);
  private requestId: string | null = null;
  private payload: CreateAdminGlobalEventPayload | null = null;
  readonly form = createEventGlobalDraftForm();
  readonly state = signal<'idle' | 'uncertain' | 'created'>('idle');
  readonly result = signal<CreateAdminGlobalEventResult | null>(null);
  readonly calendar = signal<AdminGlobalCalendarResult | null>(null);
  readonly policy = signal<AdminEffectivePolicyResult | null>(null);

  constructor() {
    this.form.controls.priceAmount.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.syncPolicyControls());
    this.form.controls.participantSignupKind.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.syncPolicyControls());
  }

  readCore(coreId: string): Observable<IEventCoreDetail | null> {
    return defer(() => {
      this.calendar.set(null);
      this.policy.set(null);
      return this.eventAdmin.getCoreDetail(coreId).pipe(switchMap((core) => {
        if (!core) return of(null);
        return this.eventAdmin.getGlobalCalendar(coreId).pipe(switchMap((calendar) => {
          const createdHere = this.result()?.coreId === coreId;
          if (calendar.coreId !== coreId || (createdHere && calendar.calendarLifecycle !== 'global')) {
            throw new Error('[EVENT_GLOBAL_DRAFT] Inconsistent global calendar readback.');
          }
          if (calendar.calendarLifecycle !== 'global') return of(core);
          if (!calendar.cities.some((city) => city.editionId === calendar.mainEditionId && city.isMain)) {
            throw new Error('[EVENT_GLOBAL_DRAFT] Global calendar main city is missing.');
          }
          return this.eventAdmin.getEffectivePolicy(coreId).pipe(map((policy) => {
            if (policy.coreId !== coreId || policy.lifecycle !== 'global' || policy.mainEditionId !== calendar.mainEditionId ||
              !policy.editions.some((edition) => edition.editionId === calendar.mainEditionId && edition.isMain)) {
              throw new Error('[EVENT_GLOBAL_DRAFT] Inconsistent global policy readback.');
            }
            this.calendar.set(calendar);
            this.policy.set(policy);
            return core;
          }));
        }));
      }));
    });
  }

  create(): Observable<IEventCoreDetail> {
    return defer(() => {
      const result = this.result();
      if (result) return of(result);
      this.requestId ??= crypto.randomUUID();
      this.payload ??= mapEventGlobalDraftToPayload(this.form);
      this.form.disable({ emitEvent: false });
      return this.eventAdmin.createGlobalEvent(this.requestId, this.payload).pipe(tap({
        next: (saved) => {
          this.result.set(saved);
          this.state.set('created');
        },
        error: (error: unknown) => {
          if (this.state() !== 'uncertain' && error instanceof RpcError &&
            ['42501', '22023', '22P02', '22007', '23503', '23514'].includes(error.code)) {
            this.payload = null;
            this.form.enable({ emitEvent: false });
            this.syncPolicyControls();
          } else {
            this.state.set('uncertain');
          }
        },
      }));
    }).pipe(
      switchMap((result) => this.readCore(result.coreId)),
      map((core) => {
        if (!core) throw new Error('[EVENT_GLOBAL_DRAFT] Created Core readback is missing.');
        return core;
      }),
    );
  }

  private syncPolicyControls(): void {
    const controls = this.form.controls;
    setControlEnabled(controls.priceBasis, controls.priceAmount.value !== null);
    const wholeEvent = controls.participantSignupKind.value !== ParticipantSignupKind.ProgramItem;
    const sessions = controls.participantSignupKind.value !== ParticipantSignupKind.WholeEvent;
    if (!sessions) controls.sessionCapacityCeiling.setValue(null, { emitEvent: false });
    setControlEnabled(controls.sessionCapacityCeiling, sessions);
    if (!wholeEvent) controls.wholeEventCapacity.setValue(null, { emitEvent: false });
    setControlEnabled(controls.wholeEventCapacity, wholeEvent);
  }
}
