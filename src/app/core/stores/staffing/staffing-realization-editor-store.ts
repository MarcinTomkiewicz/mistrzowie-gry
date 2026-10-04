import { computed, Injectable, signal } from '@angular/core';

import { AdminStaffingRealizationCore } from '../../interfaces/admin-staffing-realization';
import { StaffingRealizationReadinessResult } from '../../interfaces/staffing-realization-readiness';
import { StaffingRecruitmentPolicyDraft } from '../../types/staffing-recruitment-policy-form';
import {
  StaffingRealizationCoreDraft,
  StaffingRealizationDayDraft,
  StaffingRealizationTravelTermsDraft,
} from '../../types/staffing-realization-editor-draft';

@Injectable({ providedIn: 'root' })
export class StaffingRealizationEditorStore {
  private readinessVersionSource = 0;
  private readonly readinessSource = signal<StaffingRealizationReadinessResult | null>(null);
  readonly readiness = this.readinessSource.asReadonly();
  private readonly recruitmentPolicyBaseline = signal<StaffingRecruitmentPolicyDraft | null>(null);
  private readonly recruitmentPolicySource = signal<StaffingRecruitmentPolicyDraft | null>(null);
  readonly recruitmentPolicyDraft = this.recruitmentPolicySource.asReadonly();
  readonly hasRecruitmentPolicyChanges = computed(() =>
    JSON.stringify(this.recruitmentPolicyBaseline()) !== JSON.stringify(this.recruitmentPolicyDraft()),
  );
  private readonly realizationIdSource = signal<string | null>(null);
  private readonly realizationSource = signal<AdminStaffingRealizationCore | null>(null);
  private readonly coreBaseline = signal<StaffingRealizationCoreDraft | null>(null);
  private readonly coreSource = signal<StaffingRealizationCoreDraft | null>(null);
  private readonly scheduleBaseline = signal<readonly StaffingRealizationDayDraft[] | null>(null);
  private readonly scheduleSource = signal<readonly StaffingRealizationDayDraft[] | null>(null);
  private readonly travelTermsBaseline = signal<StaffingRealizationTravelTermsDraft | null>(null);
  private readonly travelTermsSource = signal<StaffingRealizationTravelTermsDraft | null>(null);

  readonly realizationId = this.realizationIdSource.asReadonly();
  readonly realization = this.realizationSource.asReadonly();
  readonly coreDraft = this.coreSource.asReadonly();
  readonly scheduleDraft = this.scheduleSource.asReadonly();
  readonly travelTermsDraft = this.travelTermsSource.asReadonly();
  readonly hasCoreChanges = computed(() =>
    JSON.stringify(this.coreBaseline()) !== JSON.stringify(this.coreDraft()),
  );
  readonly hasScheduleChanges = computed(() =>
    JSON.stringify(this.scheduleBaseline()) !== JSON.stringify(this.scheduleDraft()),
  );
  readonly hasTravelTermsChanges = computed(() =>
    JSON.stringify(this.travelTermsBaseline()) !== JSON.stringify(this.travelTermsDraft()),
  );
  readonly hasUnsavedChanges = computed(() =>
    this.hasCoreChanges() || this.hasScheduleChanges() ||
    this.hasTravelTermsChanges() || this.hasRecruitmentPolicyChanges(),
  );

  get readinessVersion(): number {
    return this.readinessVersionSource;
  }

  invalidateReadiness(): void {
    this.readinessVersionSource += 1;
    this.readinessSource.set(null);
  }

  acceptReadiness(result: StaffingRealizationReadinessResult, version: number): void {
    if (this.realizationId() === result.realizationId &&
        this.readinessVersion === version && !this.hasUnsavedChanges()) {
      this.readinessSource.set(result);
    }
  }

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
    if (realization.type === 'travel') {
      for (const source of [this.recruitmentPolicyBaseline, this.recruitmentPolicySource]) {
        source.update((policy) => policy ? { ...policy, stationaryScopePolicy: null } : null);
      }
    }
    this.realizationSource.set(realization);
    this.coreBaseline.set(draft);
    this.coreSource.set(draft);
  }

  hydrateSchedule(draft: readonly StaffingRealizationDayDraft[]): void {
    this.scheduleBaseline.set(draft);
    this.scheduleSource.set(draft);
  }

  setCoreDraft(draft: StaffingRealizationCoreDraft): void {
    this.invalidateReadiness();
    this.coreSource.set(draft);
  }

  setScheduleDraft(draft: readonly StaffingRealizationDayDraft[]): void {
    this.invalidateReadiness();
    this.scheduleSource.set(draft);
  }

  hydrateTravelTerms(draft: StaffingRealizationTravelTermsDraft): void {
    this.travelTermsBaseline.set(draft);
    this.travelTermsSource.set(draft);
  }

  setTravelTermsDraft(draft: StaffingRealizationTravelTermsDraft): void {
    this.invalidateReadiness();
    this.travelTermsSource.set(draft);
  }

  clearTravelTerms(): void {
    this.travelTermsBaseline.set(null);
    this.travelTermsSource.set(null);
  }

  reset(): void {
    this.invalidateReadiness();
    this.recruitmentPolicyBaseline.set(null);
    this.recruitmentPolicySource.set(null);
    this.realizationIdSource.set(null);
    this.realizationSource.set(null);
    this.coreBaseline.set(null);
    this.coreSource.set(null);
    this.scheduleBaseline.set(null);
    this.scheduleSource.set(null);
    this.clearTravelTerms();
  }

  hydrateRecruitmentPolicy(draft: StaffingRecruitmentPolicyDraft): void {
    this.recruitmentPolicyBaseline.set(draft);
    this.recruitmentPolicySource.set(draft);
  }

  setRecruitmentPolicyDraft(draft: StaffingRecruitmentPolicyDraft): void {
    this.invalidateReadiness();
    this.recruitmentPolicySource.set(draft);
  }
}
