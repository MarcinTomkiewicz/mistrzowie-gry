import { inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormGroup } from '@angular/forms';
import { defer, EMPTY, finalize, map, Observable, of, switchMap, tap } from 'rxjs';

import { ParticipantSignupKind } from '../../../../core/enums/event';
import { createEventGlobalCityControls, createEventGlobalDraftForm, mapEventGlobalCity, mapEventGlobalDraftToPayload } from '../../../../core/factories/event-global-draft-form.factory';
import type {
  AddAdminGlobalEventCityPayload, AddAdminGlobalEventCityResult,
  AdminEffectivePolicyResult, AdminGlobalCalendarResult,
  CreateAdminGlobalEventPayload, CreateAdminGlobalEventResult,
} from '../../../../core/interfaces/i-admin-global-event';
import type { IAdminEventDetail, IEventCoreDetail } from '../../../../core/interfaces/i-event-admin';
import type { AdminGlobalEventPagePreview } from '../../../../core/interfaces/i-admin-global-event-preview';
import { EventAdmin } from '../../../../core/services/event-admin/event-admin';
import { RpcError } from '../../../../core/types/rpc-error';
import { setControlEnabled } from '../../../../core/utils/form-controls';
import { assertEdgeContract } from '../../../../core/utils/edge-contract';

@Injectable()
export class EventGlobalDraftController {
  private readonly eventAdmin = inject(EventAdmin);
  private requestId: string | null = null;
  private payload: CreateAdminGlobalEventPayload | null = null;
  readonly form = createEventGlobalDraftForm();
  readonly activeStep = signal(1);
  readonly reachedStep = signal(1);
  readonly state = signal<'idle' | 'uncertain' | 'created'>('idle');
  readonly result = signal<CreateAdminGlobalEventResult | null>(null);
  readonly calendar = signal<AdminGlobalCalendarResult | null>(null);
  readonly policy = signal<AdminEffectivePolicyResult | null>(null);
  readonly mainEdition = signal<IAdminEventDetail | null>(null);
  readonly staffingEditionId = signal<string | null>(null);
  readonly isUnreleasedStaffing = signal(false);
  readonly cityForm = new FormGroup(createEventGlobalCityControls());
  readonly cityEditing = signal(false);
  readonly cityBusy = signal(false);
  readonly cityState = signal<'idle' | 'uncertain' | 'created'>('idle');
  readonly isChecking = signal(false);
  private cityCommand: {
    coreId: string; mainEditionId: string; requestId: string; payload: AddAdminGlobalEventCityPayload;
  } | null = null;
  private cityResult: AddAdminGlobalEventCityResult | null = null;

  constructor() {
    this.form.controls.priceAmount.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.syncPolicyControls());
    this.form.controls.participantSignupKind.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.syncPolicyControls());
  }

  reset(): void {
    this.requestId = null;
    this.payload = null;
    this.result.set(null);
    this.state.set('idle');
    this.activeStep.set(1);
    this.reachedStep.set(1);
    this.calendar.set(null);
    this.policy.set(null);
    this.mainEdition.set(null);
    this.staffingEditionId.set(null);
    this.isUnreleasedStaffing.set(false);
    this.isChecking.set(false);
    this.cityBusy.set(false);
    this.resetCity();
    const fresh = createEventGlobalDraftForm();
    this.form.setControl('schedule', fresh.controls.schedule, { emitEvent: false });
    this.form.setControl('timeBlocks', fresh.controls.timeBlocks, { emitEvent: false });
    this.form.setControl('dateTimeBlocks', fresh.controls.dateTimeBlocks, { emitEvent: false });
    this.form.setControl('mainCityDateTimeBlocks', fresh.controls.mainCityDateTimeBlocks, { emitEvent: false });
    this.form.reset(fresh.getRawValue(), { emitEvent: false });
    this.form.enable({ emitEvent: false });
    this.syncPolicyControls();
  }

  readCore(coreId: string): Observable<IEventCoreDetail | null> {
    return defer(() => {
      this.staffingEditionId.set(null);
      this.isUnreleasedStaffing.set(false);
      this.mainEdition.set(null);
      return this.eventAdmin.getCoreDetail(coreId).pipe(switchMap((core) => {
        if (core === null) {
          if (this.cityCommand?.coreId === coreId) throw new Error('[EVENT_GLOBAL_DRAFT] Added city Core readback is missing.');
          this.calendar.set(null);
          this.policy.set(null);
          return of(null);
        }
        if (core.id !== coreId) {
          throw new Error('[EVENT_GLOBAL_DRAFT] Inconsistent Core readback.');
        }
        if (this.cityCommand?.coreId === core.id) return this.readGlobalCalendar(core);
        return this.readStaffingEditionId(core).pipe(switchMap((editionId) => {
          this.staffingEditionId.set(editionId);
          if (!editionId) return this.readGlobalCalendar(core);
          this.calendar.set(null);
          this.policy.set(null);
          return of(core);
        }));
      }));
    });
  }

  private readStaffingEditionId(core: IEventCoreDetail): Observable<string | null> {
    if (core.editions.length !== 1) return of(null);
    const { id } = core.editions[0];
    return this.eventAdmin.getEditionDetail(id).pipe(
      map((edition) => {
        if (!edition || edition.id !== id || edition.eventCoreId !== core.id) {
          throw new Error('[EVENT_GLOBAL_DRAFT] Inconsistent Edition readback.');
        }
        const isStaffingConverted = edition.isStaffingConverted === true;
        if (!isStaffingConverted) this.mainEdition.set(edition);
        this.isUnreleasedStaffing.set(isStaffingConverted && !edition.isStaffingReleased);
        return isStaffingConverted ? edition.id : null;
      }),
    );
  }

  private readGlobalCalendar(core: IEventCoreDetail): Observable<IEventCoreDetail> {
    return this.eventAdmin.getGlobalCalendar(core.id).pipe(switchMap((calendar) => {
      const createdHere = this.result()?.coreId === core.id;
      const cityCommand = this.cityCommand?.coreId === core.id ? this.cityCommand : null;
      if (calendar.coreId !== core.id || ((createdHere || cityCommand) && calendar.calendarLifecycle !== 'global') ||
        (createdHere && calendar.mainEditionId !== this.result()?.mainEditionId) ||
        (cityCommand && calendar.mainEditionId !== cityCommand.mainEditionId)) {
        throw new Error('[EVENT_GLOBAL_DRAFT] Inconsistent global calendar readback.');
      }
      if (calendar.calendarLifecycle !== 'global') {
        this.calendar.set(null);
        this.policy.set(null);
        return of(core);
      }
      if (!calendar.cities.some((city) => city.editionId === calendar.mainEditionId && city.isMain)) {
        throw new Error('[EVENT_GLOBAL_DRAFT] Global calendar main city is missing.');
      }
      return this.eventAdmin.getEffectivePolicy(core.id).pipe(tap((policy) => {
        if (policy.coreId !== core.id || policy.lifecycle !== 'global' || policy.mainEditionId !== calendar.mainEditionId ||
          !policy.editions.some((edition) => edition.editionId === calendar.mainEditionId && edition.isMain)) {
          throw new Error('[EVENT_GLOBAL_DRAFT] Inconsistent global policy readback.');
        }
        const editionId = cityCommand ? this.cityResult?.editionId : null;
        if (editionId && (!core.editions.some(edition => edition.id === editionId) ||
          !calendar.cities.some(city => city.editionId === editionId) ||
          !policy.editions.some(edition => edition.editionId === editionId))) {
          throw new Error('[EVENT_GLOBAL_DRAFT] Added city readback is missing.');
        }
        this.calendar.set(calendar);
        this.policy.set(policy);
      }), switchMap(() => this.mainEdition()?.id === calendar.mainEditionId
        ? of(this.mainEdition()) : this.eventAdmin.getEditionDetail(calendar.mainEditionId)), map(edition => {
        if (!edition || edition.id !== calendar.mainEditionId || edition.eventCoreId !== core.id) {
          throw new Error('[EVENT_GLOBAL_DRAFT] Inconsistent main Edition readback.');
        }
        this.mainEdition.set(edition);
        return core;
      }));
    }));
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

  canAddCity(core: IEventCoreDetail): boolean {
    const calendar = this.calendar();
    return !this.isChecking() && calendar !== null && calendar.coreId === core.id && calendar.calendarLifecycle === 'global' &&
      !core.isActive && !core.hasPublicPage && calendar.cities.every(city => !city.isActive) &&
      calendar.globalDates.every(date => date.status === 'planned' && date.cityOccurrences.every(city =>
        !city.protected && !city.publishedAt && (city.occurrenceStatus === null || city.occurrenceStatus === 'planned')));
  }

  openCity(core: IEventCoreDetail): void {
    if (this.cityEditing() || !this.canAddCity(core)) return;
    this.cityEditing.set(true);
  }

  closeCity(): void {
    if (this.cityBusy() || this.cityState() !== 'idle') return;
    this.resetCity();
  }

  addCity(core: IEventCoreDetail): Observable<IEventCoreDetail> {
    return defer(() => {
      if (this.isChecking() || this.cityBusy() || !this.cityEditing()) return EMPTY;
      if (this.cityState() === 'idle' && (!this.canAddCity(core) || this.cityForm.invalid)) return EMPTY;
      const calendar = this.calendar();
      if (!calendar) return EMPTY;
      this.cityCommand ??= {
        coreId: core.id, mainEditionId: calendar.mainEditionId, requestId: crypto.randomUUID(),
        payload: mapEventGlobalCity(this.cityForm.controls),
      };
      const command = this.cityCommand;
      this.cityForm.disable({ emitEvent: false });
      this.cityBusy.set(true);
      const write = this.cityResult ? of(this.cityResult)
        : this.eventAdmin.addGlobalEventCity(command.coreId, command.requestId, command.payload).pipe(
          tap(saved => {
            if ((!saved.created && !saved.replayed) || saved.coreId !== command.coreId || !saved.editionId) {
              throw new Error('[EVENT_GLOBAL_DRAFT] Inconsistent added city confirmation.');
            }
            this.cityResult = saved;
            this.cityState.set('created');
          }),
          tap({ error: (error: unknown) => {
            if (this.cityState() === 'idle' && error instanceof RpcError &&
              ['42501', '22023', '22P02', '22007', '23503', '23505', '23514', '40001', 'P0002'].includes(error.code)) {
              this.cityCommand = null;
              this.cityForm.enable({ emitEvent: false });
            } else {
              this.cityState.set('uncertain');
            }
          } }),
        );
      return write.pipe(
        switchMap(() => this.readCore(command.coreId)),
        map(loaded => {
          if (!loaded) throw new Error('[EVENT_GLOBAL_DRAFT] Added city Core readback is missing.');
          this.resetCity();
          return loaded;
        }),
        finalize(() => this.cityBusy.set(false)),
      );
    });
  }

  checkErrors(coreId: string): Observable<AdminGlobalEventPagePreview> {
    return defer(() => {
      const calendar = this.calendar();
      if (this.isChecking() || this.cityEditing() || this.cityBusy() ||
        calendar?.coreId !== coreId || calendar.calendarLifecycle !== 'global') return EMPTY;
      this.isChecking.set(true);
      return this.eventAdmin.previewGlobalEventPage(coreId).pipe(
        tap(result => {
          const status = result.fieldErrors.length ? 'invalid' : result.blockers.length ? 'blocked' : 'preview_ready';
          assertEdgeContract(result.coreId === coreId && result.preview === true && result.appliedToPublic === false &&
            result.status === status && result.valid === (status === 'preview_ready') &&
            (result.page === null || (result.page.core.id === coreId && result.participantSignupOpened === false)),
          'globalEventPagePreview', 'a read-only diagnostic result for the selected Core');
        }),
        finalize(() => this.isChecking.set(false)),
      );
    });
  }

  private resetCity(): void {
    this.cityCommand = null;
    this.cityResult = null;
    this.cityForm.enable({ emitEvent: false });
    this.cityForm.reset();
    this.cityState.set('idle');
    this.cityEditing.set(false);
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
