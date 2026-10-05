import { STAFFING_WITHDRAWAL_NOTICE_HOURS } from '../../configs/staffing-realization.config';
import type { MyStaffingRealizationDetail } from '../../interfaces/my-staffing-realization';
import { HOUR_IN_MS } from '../../types/hour-offset';
import { parseIsoDate } from '../../utils/date';
import { timeZoneDateToTimestamp } from '../../utils/time-zone';

export function getStaffingParticipationActions(detail: MyStaffingRealizationDetail, now: number) {
  const candidate = detail.candidate;
  const policy = detail.recruitmentPolicy;
  const archived = detail.status === 'archived';
  const selectedDays = detail.type === 'stationary' && policy?.stationaryScopePolicy === 'selected_days';
  const eligibleScope = detail.type === 'travel' || policy?.stationaryScopePolicy === 'whole_realization' || selectedDays;
  const firstDay = detail.days.map(day => day.date).sort()[0];
  const startTimestamp = firstDay ? timeZoneDateToTimestamp(parseIsoDate(firstDay), detail.timezone) : null;
  const startAt = startTimestamp === null ? null : Date.parse(startTimestamp);
  const confirmed = candidate?.state === 'confirmed' && candidate.participation.active;
  const withdrawalLifecycle = detail.status === 'open' || detail.status === 'closed';
  const beforeStart = startAt !== null && now < startAt;

  return {
    selectedDays,
    canCreate: detail.status === 'open' && policy?.selfApplicationEnabled === true && eligibleScope &&
      (candidate === null || candidate.state === 'withdrawn' || candidate.state === 'rejected'),
    canSubmit: detail.status === 'open' && policy?.selfApplicationEnabled === true &&
      candidate?.origin === 'self_application' && candidate.state === 'draft',
    canWithdrawApplication: !archived && candidate?.origin === 'self_application' &&
      (candidate.state === 'draft' || candidate.state === 'pending'),
    canDecideProposal: detail.status === 'open' && candidate?.origin === 'admin_proposal' &&
      candidate.state === 'pending' && candidate.gmDecision === 'pending' && candidate.adminDecision === 'accepted',
    canWithdrawParticipation: confirmed && withdrawalLifecycle && beforeStart,
    replacementRequired: confirmed && withdrawalLifecycle && beforeStart &&
      now > startAt - STAFFING_WITHDRAWAL_NOTICE_HOURS * HOUR_IN_MS,
    withdrawalStarted: confirmed && withdrawalLifecycle && startAt !== null && now >= startAt,
  };
}
