import { inject, Injectable } from '@angular/core';
import { forkJoin, map, Observable, of, tap } from 'rxjs';

import { mapStaffingRealizationCoreToDraft } from '../../factories/staffing-realization-core-form.factory';
import { mapStaffingRealizationScheduleToDraft } from '../../factories/staffing-realization-days-form.factory';
import {
  AdminStaffingRealizationCore,
  AdminStaffingSchedule,
  CreateAdminStaffingRealizationRequest,
  CreateAdminStaffingRealizationResult,
  SaveAdminStaffingScheduleDayInput,
  UpdateAdminStaffingRealizationCorePayload,
} from '../../interfaces/admin-staffing-realization';
import { AdminStaffingRealizationRead } from '../../reads/staffing/admin-staffing-realization-read';
import { AdminStaffingRealization } from '../../services/staffing/admin-staffing-realization';
import { StaffingRealizationEditorStore } from '../../stores/staffing/staffing-realization-editor-store';

@Injectable({ providedIn: 'root' })
export class StaffingRealizationEditorFacade {
  private readonly read = inject(AdminStaffingRealizationRead);
  private readonly write = inject(AdminStaffingRealization);
  readonly store = inject(StaffingRealizationEditorStore);

  load(realizationId: string): Observable<void> {
    this.store.open(realizationId);

    return forkJoin({
      core: this.store.coreDraft() === null
        ? this.read.getDetail(realizationId)
        : of(null),
      schedule: this.store.scheduleDraft() === null
        ? this.read.getSchedule(realizationId)
        : of(null),
    }).pipe(
      tap(({ core, schedule }) => {
        if (core) {
          this.hydrateCore(core);
        }
        if (schedule) {
          this.hydrateSchedule(schedule);
        }
      }),
      map(() => void 0),
    );
  }

  create(payload: CreateAdminStaffingRealizationRequest): Observable<CreateAdminStaffingRealizationResult> {
    return this.write.create(payload).pipe(
      tap(({ realization, days }) => {
        this.store.open(realization.id);
        this.hydrateCore(realization);
        this.hydrateSchedule({
          realizationId: realization.id,
          days: days.map((day) => ({ ...day, slots: [] })),
        });
      }),
    );
  }

  update(realizationId: string, payload: UpdateAdminStaffingRealizationCorePayload): Observable<AdminStaffingRealizationCore> {
    return this.write.update(realizationId, payload).pipe(
      tap((realization) => {
        if (this.store.realizationId() === realizationId) {
          this.hydrateCore(realization);
        }
      }),
    );
  }

  saveSchedule(realizationId: string, days: SaveAdminStaffingScheduleDayInput[]): Observable<AdminStaffingSchedule> {
    return this.write.saveSchedule(realizationId, days).pipe(
      tap((schedule) => {
        if (this.store.realizationId() === realizationId) {
          this.hydrateSchedule(schedule);
        }
      }),
    );
  }

  private hydrateCore(realization: AdminStaffingRealizationCore): void {
    this.store.hydrateCore(realization, mapStaffingRealizationCoreToDraft(realization));
  }

  private hydrateSchedule(schedule: AdminStaffingSchedule): void {
    this.store.hydrateSchedule(mapStaffingRealizationScheduleToDraft(schedule));
  }
}
