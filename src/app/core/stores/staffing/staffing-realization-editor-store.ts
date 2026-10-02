import { computed, Injectable, signal } from '@angular/core';

import { AdminStaffingRealizationCore } from '../../interfaces/admin-staffing-realization';
import {
  StaffingRealizationCoreDraft,
  StaffingRealizationDayDraft,
} from '../../types/staffing-realization-editor-draft';

@Injectable({ providedIn: 'root' })
export class StaffingRealizationEditorStore {
  private readonly realizationIdSource = signal<string | null>(null);
  private readonly realizationSource = signal<AdminStaffingRealizationCore | null>(null);
  private readonly coreBaseline = signal<StaffingRealizationCoreDraft | null>(null);
  private readonly coreSource = signal<StaffingRealizationCoreDraft | null>(null);
  private readonly scheduleBaseline = signal<readonly StaffingRealizationDayDraft[] | null>(null);
  private readonly scheduleSource = signal<readonly StaffingRealizationDayDraft[] | null>(null);

  readonly realizationId = this.realizationIdSource.asReadonly();
  readonly realization = this.realizationSource.asReadonly();
  readonly coreDraft = this.coreSource.asReadonly();
  readonly scheduleDraft = this.scheduleSource.asReadonly();
  readonly hasCoreChanges = computed(() =>
    JSON.stringify(this.coreBaseline()) !== JSON.stringify(this.coreDraft()),
  );
  readonly hasScheduleChanges = computed(() =>
    JSON.stringify(this.scheduleBaseline()) !== JSON.stringify(this.scheduleDraft()),
  );

  open(realizationId: string): void {
    if (this.realizationId() === realizationId) {
      return;
    }

    this.reset();
    this.realizationIdSource.set(realizationId);
  }

  hydrateCore(
    realization: AdminStaffingRealizationCore,
    draft: StaffingRealizationCoreDraft,
  ): void {
    this.realizationSource.set(realization);
    this.coreBaseline.set(draft);
    this.coreSource.set(draft);
  }

  hydrateSchedule(draft: readonly StaffingRealizationDayDraft[]): void {
    this.scheduleBaseline.set(draft);
    this.scheduleSource.set(draft);
  }

  setCoreDraft(draft: StaffingRealizationCoreDraft): void {
    this.coreSource.set(draft);
  }

  setScheduleDraft(draft: readonly StaffingRealizationDayDraft[]): void {
    this.scheduleSource.set(draft);
  }

  reset(): void {
    this.realizationIdSource.set(null);
    this.realizationSource.set(null);
    this.coreBaseline.set(null);
    this.coreSource.set(null);
    this.scheduleBaseline.set(null);
    this.scheduleSource.set(null);
  }
}
