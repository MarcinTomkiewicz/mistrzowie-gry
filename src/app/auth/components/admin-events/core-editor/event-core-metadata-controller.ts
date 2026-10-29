import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { defer, EMPTY, finalize, map, Observable, of, switchMap, tap } from 'rxjs';

import { createEventGlobalCityControls } from '../../../../core/factories/event-global-draft-form.factory';
import type { SaveAdminGlobalEventEditionMetadataPayload } from '../../../../core/interfaces/i-admin-global-event';
import type { IAdminEventDetail, IEventCoreDetail, IEventCoreSavePayload } from '../../../../core/interfaces/i-event-admin';
import { EventAdmin } from '../../../../core/services/event-admin/event-admin';
import { RpcError } from '../../../../core/types/rpc-error';
import { assertEdgeContract } from '../../../../core/utils/edge-contract';
import { setControlEnabled } from '../../../../core/utils/form-controls';
import { normalizeText } from '../../../../core/utils/normalize-text';
import { requiredTrimmedValidator } from '../../../../core/validators/required-trimmed.validator';
import { EventDatedBlocksController } from './event-dated-blocks-controller';
import { EventGlobalDraftController } from './event-global-draft-controller';
import { EventCoreCoverController } from './event-core-cover-controller';
import { EventGlobalScheduleController } from './event-global-schedule-controller';

export type EventMetadataTarget = 'core' | 'edition';
type MetadataCommand = { coreId: string } & (
  | { target: 'core'; payload: IEventCoreSavePayload }
  | { target: 'edition'; payload: SaveAdminGlobalEventEditionMetadataPayload }
);

@Injectable()
export class EventCoreMetadataController {
  private readonly admin = inject(EventAdmin);
  private readonly global = inject(EventGlobalDraftController);
  private readonly blocks = inject(EventDatedBlocksController);
  private readonly cover = inject(EventCoreCoverController);
  private readonly schedule = inject(EventGlobalScheduleController);
  private command: MetadataCommand | null = null;
  readonly core = signal<IEventCoreDetail | null>(null);
  readonly edition = signal<IAdminEventDetail | null>(null);
  readonly isGlobal = signal(false);
  readonly isBusy = signal(false);
  readonly state = signal<'idle' | 'uncertain' | 'saved'>('idle');
  readonly pendingTarget = signal<EventMetadataTarget | null>(null);
  readonly errors = signal<Partial<Record<EventMetadataTarget, unknown>>>({});
  readonly issues = signal<Partial<Record<EventMetadataTarget, 'conflict' | 'protected'>>>({});
  readonly locked = computed(() => this.isBusy() || this.state() !== 'idle');
  readonly blocked = computed(() => this.global.isChecking() || this.global.cityEditing() || this.global.cityBusy() ||
    this.schedule.locked() || this.blocks.isBusy() || this.blocks.isDirty() || this.blocks.readbackPending());
  readonly coreForm = new FormGroup({
    key: new FormControl('', { nonNullable: true,
      validators: [Validators.required, requiredTrimmedValidator(), Validators.pattern(/^[a-z0-9-]+$/)] }),
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, requiredTrimmedValidator()] }),
    shortDescription: new FormControl('', { nonNullable: true }),
    longDescription: new FormControl('', { nonNullable: true }),
    isActive: new FormControl(false, { nonNullable: true }),
    hasPublicPage: new FormControl(false, { nonNullable: true }),
  });
  readonly editionForm = new FormGroup(createEventGlobalCityControls());
  readonly timezones = computed(() => {
    const edition = this.edition();
    return edition ? [{ value: edition.timezone, label: edition.timezone }] : [];
  });
  readonly canEditCore = computed(() => {
    const core = this.core();
    const calendar = this.global.calendar();
    const edition = this.global.mainEdition();
    return !!core && this.issues().core !== 'protected' && (!this.isGlobal() ||
      (!!calendar && !!edition && !edition.currentlyPublic && calendar.calendarLifecycle === 'global' && calendar.coreId === core.id &&
        calendar.globalDates.every(day => day.cityOccurrences.every(city => !city.protected && !city.publishedAt))));
  });
  readonly canEditEdition = computed(() => {
    const edition = this.global.mainEdition();
    const core = this.core();
    const calendar = this.global.calendar();
    return !!core && !!edition && !!calendar && calendar.calendarLifecycle === 'global' &&
      calendar.coreId === core.id && calendar.mainEditionId === edition.id && edition.eventCoreId === core.id &&
      this.issues().edition !== 'protected' && !edition.isActive &&
      !edition.currentlyPublic && !edition.isStaffingConverted &&
      edition.occurrences.every(row => !row.publishedAt && row.activeParticipantCount === 0) &&
      calendar.globalDates.every(day => day.cityOccurrences.filter(city => city.editionId === edition.id)
        .every(city => !city.protected && !city.publishedAt));
  });

  constructor() {
    effect(() => this.syncControls());
  }

  reset(): void {
    this.core.set(null);
    this.edition.set(null);
    this.isGlobal.set(false);
    this.syncCoreValidators();
    this.command = null;
    this.pendingTarget.set(null);
    this.isBusy.set(false);
    this.state.set('idle');
    this.errors.set({});
    this.issues.set({});
    this.coreForm.reset();
    this.editionForm.reset();
    this.syncControls();
  }

  load(core: IEventCoreDetail | null): void {
    this.core.set(core);
    this.isGlobal.set(this.global.calendar()?.calendarLifecycle === 'global');
    this.syncCoreValidators();
    if (core) this.populateCore(core);
    if (this.isGlobal()) this.populateEdition();
    this.syncControls();
  }

  canSave(target: EventMetadataTarget): boolean {
    return !this.isBusy() && !this.blocked() && this.cover.ready() && (this.pendingTarget() === target || (this.state() === 'idle' &&
      !this.issues()[target] && (target === 'core' ? this.canEditCore() : this.canEditEdition())));
  }

  save(target: EventMetadataTarget): Observable<IEventCoreDetail> {
    return defer(() => {
      const core = this.core();
      const form = target === 'core' ? this.coreForm : this.editionForm;
      if (!core || !this.canSave(target) || (!this.command && form.invalid)) return EMPTY;
      this.command ??= this.createCommand(target, core);
      const command = this.command;
      this.pendingTarget.set(target);
      this.clearError(target);
      this.isBusy.set(true);
      this.syncControls();
      const write = this.state() === 'saved' ? of(undefined) : this.write(command).pipe(
        tap(() => this.state.set('saved')),
        tap({ error: error => this.recordWriteFailure(target, error) }),
      );
      return write.pipe(
        switchMap(() => this.readback(target, core.id)),
        tap(() => {
          this.command = null;
          this.state.set('idle');
          this.pendingTarget.set(null);
        }),
        tap({ error: error => this.errors.update(errors => ({ ...errors, [target]: error })) }),
        finalize(() => { this.isBusy.set(false); this.syncControls(); }),
      );
    });
  }

  refresh(target: EventMetadataTarget): Observable<IEventCoreDetail> {
    return defer(() => {
      const core = this.core();
      if (!core || this.locked() || this.blocked() || this.cover.locked()) return EMPTY;
      this.isBusy.set(true);
      this.syncControls();
      return this.readback(target, core.id).pipe(
        tap(() => {
          const issues = { ...this.issues() };
          delete issues[target];
          this.issues.set(issues);
          this.clearError(target);
        }),
        tap({ error: error => this.errors.update(errors => ({ ...errors, [target]: error })) }),
        finalize(() => { this.isBusy.set(false); this.syncControls(); }),
      );
    });
  }

  private createCommand(target: EventMetadataTarget, core: IEventCoreDetail): MetadataCommand {
    if (target === 'core') {
      const value = this.coreForm.getRawValue();
      const global = this.isGlobal();
      return { target, coreId: core.id, payload: {
        id: core.id, key: core.key, name: value.name.trim(),
        shortDescription: normalizeText(value.shortDescription), longDescription: normalizeText(value.longDescription),
        isActive: global ? core.isActive : value.isActive,
        hasPublicPage: global || this.global.isUnreleasedStaffing() ? core.hasPublicPage : value.hasPublicPage,
        displayOrder: core.displayOrder,
      } };
    }
    const edition = this.edition();
    assertEdgeContract(edition !== null, 'globalEditionMetadata', 'a saved main Edition');
    const value = this.editionForm.getRawValue();
    return { target, coreId: core.id, payload: {
      editionId: edition.id, expectedUpdatedAt: edition.updatedAt,
      venueName: normalizeText(value.venueName), venueAddress: normalizeText(value.venueAddress),
      facebookLink: normalizeText(value.facebookLink),
    } };
  }

  private write(command: MetadataCommand): Observable<void> {
    if (command.target === 'core') {
      return this.admin.saveCore(command.payload).pipe(tap(core => {
        assertEdgeContract(core.id === command.coreId && core.key === command.payload.key,
          'eventCoreMetadata', 'the saved Core with unchanged identity');
      }), map(() => undefined));
    }
    return this.admin.saveGlobalEditionMetadata(command.payload).pipe(tap(result => {
      assertEdgeContract(result.coreId === command.coreId && result.editionId === command.payload.editionId &&
        ((result.saved === true && result.alreadyApplied === false) || (result.saved === false && result.alreadyApplied === true)) &&
        Number.isFinite(Date.parse(result.updatedAt)) &&
        result.metadata.venueName === command.payload.venueName && result.metadata.venueAddress === command.payload.venueAddress &&
        result.metadata.facebookLink === command.payload.facebookLink,
      'globalEditionMetadata', 'a saved or already applied metadata PATCH for the main Edition');
    }), map(() => undefined));
  }

  private readback(target: EventMetadataTarget, coreId: string): Observable<IEventCoreDetail> {
    const command = this.command;
    return this.global.readCore(coreId).pipe(map(core => {
      assertEdgeContract(core !== null && core.id === coreId, 'eventCoreMetadata', 'an authoritative Core readback');
      if (target === 'edition') {
        const edition = this.global.mainEdition();
        const previous = this.edition();
        assertEdgeContract(edition !== null && previous !== null && edition.id === previous.id &&
          edition.city === previous.city && edition.slug === previous.slug && edition.timezone === previous.timezone,
        'globalEditionMetadata', 'a current main Edition readback with unchanged identity');
        if (command?.target === 'edition' && (edition.venueName !== command.payload.venueName ||
          edition.venueAddress !== command.payload.venueAddress || edition.facebookLink !== command.payload.facebookLink)) {
          this.rejectReadback(target);
        }
        this.populateEdition();
      } else {
        if (command?.target === 'core' && (core.key !== command.payload.key || core.name !== command.payload.name ||
          core.shortDescription !== command.payload.shortDescription || core.longDescription !== command.payload.longDescription ||
          core.isActive !== command.payload.isActive || core.hasPublicPage !== command.payload.hasPublicPage ||
          core.displayOrder !== command.payload.displayOrder)) {
          this.rejectReadback(target);
        }
        this.populateCore(core);
      }
      this.core.set(core);
      if (this.cover.needsReconciliation()) this.cover.reconcile(core);
      return core;
    }));
  }

  private rejectReadback(target: EventMetadataTarget): never {
    this.issues.update(issues => ({ ...issues, [target]: 'conflict' }));
    this.command = null;
    this.state.set('idle');
    this.pendingTarget.set(null);
    (target === 'core' ? this.coreForm : this.editionForm).markAsDirty();
    throw new Error('[EVENT_CORE_METADATA] Authoritative readback differs from the submitted metadata.');
  }

  private recordWriteFailure(target: EventMetadataTarget, error: unknown): void {
    if (error instanceof RpcError && ['42501', '22023', '22P02', '22007', '23503', '23505', '23514', '40001', 'P0002'].includes(error.code)) {
      if (error.code === '40001' || error.code === '23514') {
        this.issues.update(issues => ({ ...issues, [target]: error.code === '40001' ? 'conflict' : 'protected' }));
      }
      this.command = null;
      this.state.set('idle');
      this.pendingTarget.set(null);
    } else this.state.set('uncertain');
  }

  private populateCore(core: IEventCoreDetail): void {
    this.coreForm.reset({ key: core.key, name: core.name, shortDescription: core.shortDescription ?? '',
      longDescription: core.longDescription ?? '', isActive: core.isActive, hasPublicPage: core.hasPublicPage });
  }

  private populateEdition(): void {
    const edition = this.global.mainEdition();
    this.edition.set(edition);
    if (edition) this.editionForm.reset({ city: edition.city, timezone: edition.timezone,
      venueName: edition.venueName ?? '', venueAddress: edition.venueAddress ?? '', facebookLink: edition.facebookLink ?? '' });
  }

  private syncControls(): void {
    const coreEnabled = !this.locked() && !this.schedule.locked() && this.cover.ready() && this.canEditCore();
    setControlEnabled(this.coreForm, coreEnabled);
    setControlEnabled(this.coreForm.controls.isActive, coreEnabled && !this.isGlobal());
    setControlEnabled(this.coreForm.controls.hasPublicPage, coreEnabled && !this.isGlobal() && !this.global.isUnreleasedStaffing());
    setControlEnabled(this.editionForm, !this.locked() && !this.schedule.locked() && this.cover.ready() && this.canEditEdition());
    this.editionForm.controls.city.disable({ emitEvent: false });
    this.editionForm.controls.timezone.disable({ emitEvent: false });
  }

  private syncCoreValidators(): void {
    const { name, shortDescription, longDescription } = this.coreForm.controls;
    name.setValidators([Validators.required, requiredTrimmedValidator(), ...(this.isGlobal() ? [Validators.maxLength(140)] : [])]);
    shortDescription.setValidators(this.isGlobal() ? Validators.maxLength(500) : null);
    longDescription.setValidators(this.isGlobal() ? Validators.maxLength(12000) : null);
  }

  private clearError(target: EventMetadataTarget): void {
    const errors = { ...this.errors() };
    delete errors[target];
    this.errors.set(errors);
  }
}
