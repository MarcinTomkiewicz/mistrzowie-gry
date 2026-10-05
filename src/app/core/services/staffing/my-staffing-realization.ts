import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { STAFFING_REALIZATION_RPC } from '../../configs/staffing-realization-rpc.config';
import type {
  MyStaffingCandidate,
  WithdrawMyConfirmedStaffingParticipationResult,
} from '../../interfaces/my-staffing-realization';
import { Backend } from '../backend/backend';

@Injectable({ providedIn: 'root' })
export class MyStaffingRealization {
  private readonly backend = inject(Backend);

  createSelfApplication(realizationId: string, dayIds: string[] | null): Observable<MyStaffingCandidate> {
    return this.backend.rpc<MyStaffingCandidate>(STAFFING_REALIZATION_RPC.createMySelfApplication, {
      p_realization_id: realizationId,
      p_day_ids: dayIds,
    });
  }

  submitSelfApplication(candidateId: string): Observable<MyStaffingCandidate> {
    return this.backend.rpc<MyStaffingCandidate>(STAFFING_REALIZATION_RPC.submitMySelfApplication, {
      p_candidate_id: candidateId,
    });
  }

  withdrawSelfApplication(candidateId: string): Observable<MyStaffingCandidate> {
    return this.backend.rpc<MyStaffingCandidate>(STAFFING_REALIZATION_RPC.withdrawMySelfApplication, {
      p_candidate_id: candidateId,
    });
  }

  decideAdminProposal(candidateId: string, decision: 'accepted' | 'rejected'): Observable<MyStaffingCandidate> {
    return this.backend.rpc<MyStaffingCandidate>(STAFFING_REALIZATION_RPC.decideMyAdminProposal, {
      p_candidate_id: candidateId,
      p_decision: decision,
    });
  }

  withdrawConfirmedParticipation(
    candidateId: string,
    replacementGmUserId: string | null,
  ): Observable<WithdrawMyConfirmedStaffingParticipationResult> {
    return this.backend.rpc<WithdrawMyConfirmedStaffingParticipationResult>(
      STAFFING_REALIZATION_RPC.withdrawMyConfirmedParticipation,
      { p_candidate_id: candidateId, p_replacement_gm_user_id: replacementGmUserId },
    );
  }
}
