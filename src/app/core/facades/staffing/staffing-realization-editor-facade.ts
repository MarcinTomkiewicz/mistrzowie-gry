import { inject, Injectable } from '@angular/core';
import { defer, forkJoin, map, Observable, of, switchMap, tap } from 'rxjs';

import { mapStaffingRealizationCoreToDraft } from '../../factories/staffing-realization-core-form.factory';
import { mapStaffingRealizationScheduleToDraft } from '../../factories/staffing-realization-days-form.factory';
import { mapStaffingTravelTermsToDraft } from '../../factories/staffing-realization-travel-terms-form.factory';
import { mapStaffingRecruitmentPolicyToDraft } from '../../factories/staffing-recruitment-policy-form.factory';
import { AdminStaffingRecruitmentPolicy, SaveAdminStaffingRecruitmentPolicyPayload } from '../../interfaces/admin-staffing-recruitment-policy';
import type { AdminStaffingRealizationBoard } from '../../interfaces/admin-staffing-realization-board';
import type { StaffingCandidate } from '../../interfaces/staffing-candidate';
import {
  AdminStaffingRealizationCore,
  AdminStaffingSchedule,
  CreateAdminStaffingRealizationRequest,
  CreateAdminStaffingRealizationResult,
  SaveAdminStaffingScheduleDayInput,
  UpdateAdminStaffingRealizationCorePayload,
} from '../../interfaces/admin-staffing-realization';
import {
  AdminStaffingTravelTerms,
  SaveAdminStaffingTravelTermsPayload,
} from '../../interfaces/admin-staffing-travel-terms';
import { AdminStaffingRealizationRead } from '../../reads/staffing/admin-staffing-realization-read';
import { AdminStaffingRealization } from '../../services/staffing/admin-staffing-realization';
import { StaffingRealizationEditorStore } from '../../stores/staffing/staffing-realization-editor-store';
import { OpenAdminStaffingRealizationResult, StaffingRealizationReadinessResult } from '../../interfaces/staffing-realization-readiness';

@Injectable({ providedIn: 'root' })
export class StaffingRealizationEditorFacade {
  private readonly read = inject(AdminStaffingRealizationRead);
  private readonly write = inject(AdminStaffingRealization);
  readonly store = inject(StaffingRealizationEditorStore);

  validate(realizationId: string): Observable<StaffingRealizationReadinessResult> {
    return defer(() => {
      this.store.invalidateReadiness();
      const version = this.store.readinessVersion;
      return this.read.validate(realizationId).pipe(
        tap((result) => this.store.acceptReadiness(result, version)),
      );
    });
  }

  open(realizationId: string): Observable<OpenAdminStaffingRealizationResult> {
    return defer(() => {
      this.store.invalidateReadiness();
      const version = this.store.readinessVersion;
      return this.write.open(realizationId).pipe(tap((result) => {
        if (this.store.realizationId() !== realizationId) return;
        if (result.opened) {
          this.hydrateCore(result.realization);
          this.store.invalidateReadiness();
        } else {
          this.store.acceptReadiness(result.readiness, version);
        }
      }));
    });
  }

  loadRecruitmentPolicy(realizationId: string): Observable<void> {
    this.store.open(realizationId);
    const coreRequest: Observable<AdminStaffingRealizationCore | null> = this.store.realization() === null
      ? this.read.getDetail(realizationId)
      : of(null);
    return coreRequest.pipe(
      tap((core) => { if (core) this.hydrateCore(core); }),
      switchMap(() => {
        if (this.store.recruitmentPolicyDraft() !== null) return of(void 0);
        return this.read.getRecruitmentPolicy(realizationId).pipe(
          tap((policy) => {
            if (this.store.realizationId() === realizationId) {
              this.store.hydrateRecruitmentPolicy(mapStaffingRecruitmentPolicyToDraft(policy));
            }
          }),
          map(() => void 0),
        );
      }),
    );
  }

  saveRecruitmentPolicy(
    realizationId: string,
    payload: SaveAdminStaffingRecruitmentPolicyPayload,
  ): Observable<AdminStaffingRecruitmentPolicy> {
    return this.write.saveRecruitmentPolicy(realizationId, payload).pipe(
      tap((policy) => {
        if (this.store.realizationId() === realizationId) {
          this.store.invalidateReadiness();
          this.store.hydrateRecruitmentPolicy(mapStaffingRecruitmentPolicyToDraft(policy));
        }
      }),
    );
  }

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

  loadBoard(realizationId: string): Observable<AdminStaffingRealizationBoard> {
    this.store.open(realizationId);
    return forkJoin({
      realization: this.read.getDetail(realizationId),
      schedule: this.read.getSchedule(realizationId),
      list: this.read.getList(),
      candidates: this.read.getCandidates(realizationId),
      availability: this.read.getAvailability(realizationId),
      recruitmentPolicy: this.read.getRecruitmentPolicy(realizationId),
    }).pipe(
      map(({ list, ...board }) => {
        const item = list.find((row) => row.id === realizationId);
        if (!item) throw new Error('Staffing realization is missing from the admin list.');
        return { ...board, summary: item.staffingSummary };
      }),
      tap(({ realization, schedule }) => {
        if (this.store.realizationId() !== realizationId) return;
        if (this.store.coreDraft() === null) this.hydrateCore(realization);
        if (this.store.scheduleDraft() === null) this.hydrateSchedule(schedule);
      }),
    );
  }

  createProposal(realizationId: string, gmUserId: string, dayIds: string[] | null): Observable<StaffingCandidate> {
    return this.write.createProposal(realizationId, gmUserId, dayIds);
  }

  decideSelfApplication(candidateId: string, decision: 'accepted' | 'rejected'): Observable<StaffingCandidate> {
    return this.write.decideSelfApplication(candidateId, decision);
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

  loadTravelTerms(realizationId: string): Observable<void> {
    this.store.open(realizationId);

    const coreRequest: Observable<AdminStaffingRealizationCore | null> = this.store.coreDraft() === null
      ? this.read.getDetail(realizationId)
      : of(null);

    return coreRequest.pipe(
      tap((core) => {
        if (core) this.hydrateCore(core);
      }),
      switchMap(() => {
        if (this.store.travelTermsDraft() !== null) return of(void 0);

        return this.read.getTravelTerms(realizationId).pipe(
          tap((terms) => this.store.hydrateTravelTerms(mapStaffingTravelTermsToDraft(terms))),
          map(() => void 0),
        );
      }),
    );
  }

  update(realizationId: string, payload: UpdateAdminStaffingRealizationCorePayload): Observable<AdminStaffingRealizationCore> {
    return this.write.update(realizationId, payload).pipe(
      tap((realization) => {
        if (this.store.realizationId() === realizationId) {
          this.store.invalidateReadiness();
          this.hydrateCore(realization);
          if (realization.type === 'stationary') {
            this.store.clearTravelTerms();
          }
        }
      }),
    );
  }

  saveSchedule(realizationId: string, days: SaveAdminStaffingScheduleDayInput[]): Observable<AdminStaffingSchedule> {
    return this.write.saveSchedule(realizationId, days).pipe(
      tap((schedule) => {
        if (this.store.realizationId() === realizationId) {
          this.store.invalidateReadiness();
          this.hydrateSchedule(schedule);
        }
      }),
    );
  }

  saveTravelTerms(
    realizationId: string,
    payload: SaveAdminStaffingTravelTermsPayload,
  ): Observable<AdminStaffingTravelTerms> {
    return this.write.saveTravelTerms(realizationId, payload).pipe(
      tap((terms) => {
        if (this.store.realizationId() === realizationId) {
          this.store.invalidateReadiness();
          this.store.hydrateTravelTerms(mapStaffingTravelTermsToDraft(terms));
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
