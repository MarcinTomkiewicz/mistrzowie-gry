import { createCommonActionsI18n, createCommonErrorsI18n } from '../../../../core/translations/common.i18n';
import { createScopedObjectI18n, createScopedSectionsI18n } from '../../../../core/translations/scoped.i18n';
import { AdminStaffingFinalizationCopy, AdminStaffingShellCopy } from '../../../../core/types/i18n/admin-staffing';
import { StaffingRealizationReadinessIssueCode } from '../../../../core/types/staffing-realization-readiness';

export function createStaffingRealizationFinalizationI18n() {
  return {
    copy: createScopedObjectI18n<AdminStaffingFinalizationCopy>('adminStaffing', 'finalization'),
    tabs: createScopedObjectI18n<AdminStaffingShellCopy['tabs']>('adminStaffing', 'shell.tabs'),
    commonActions: createCommonActionsI18n(),
    commonErrors: createCommonErrorsI18n(),
    issues: createScopedSectionsI18n<Record<StaffingRealizationReadinessIssueCode, string>>('adminStaffing', {
      'core.name_invalid': 'finalization.issues.core.name_invalid',
      'core.timezone_invalid': 'finalization.issues.core.timezone_invalid',
      'core.type_invalid': 'finalization.issues.core.type_invalid',
      'core.coordinator_invalid': 'finalization.issues.core.coordinator_invalid',
      'core.event_reference_invalid': 'finalization.issues.core.event_reference_invalid',
      'schedule.days_missing': 'finalization.issues.schedule.days_missing',
      'schedule.day_demand_invalid': 'finalization.issues.schedule.day_demand_invalid',
      'schedule.slot_label_invalid': 'finalization.issues.schedule.slot_label_invalid',
      'schedule.slot_time_invalid': 'finalization.issues.schedule.slot_time_invalid',
      'schedule.slot_position_invalid': 'finalization.issues.schedule.slot_position_invalid',
      'schedule.slot_position_duplicate': 'finalization.issues.schedule.slot_position_duplicate',
      'schedule.slot_overlap': 'finalization.issues.schedule.slot_overlap',
      'travel_terms.missing': 'finalization.issues.travel_terms.missing',
      'travel_terms.unexpected_for_stationary': 'finalization.issues.travel_terms.unexpected_for_stationary',
      'travel_terms.transport_mode_invalid': 'finalization.issues.travel_terms.transport_mode_invalid',
      'travel_terms.reimbursement_mode_invalid': 'finalization.issues.travel_terms.reimbursement_mode_invalid',
      'travel_terms.mileage_rate_invalid': 'finalization.issues.travel_terms.mileage_rate_invalid',
      'travel_terms.lodging_invalid': 'finalization.issues.travel_terms.lodging_invalid',
      'travel_terms.work_time_scope_invalid': 'finalization.issues.travel_terms.work_time_scope_invalid',
      'travel_terms.work_time_note_invalid': 'finalization.issues.travel_terms.work_time_note_invalid',
      'travel_terms.note_invalid': 'finalization.issues.travel_terms.note_invalid',
      'recruitment_policy.missing': 'finalization.issues.recruitment_policy.missing',
      'recruitment_policy.stationary_scope_invalid': 'finalization.issues.recruitment_policy.stationary_scope_invalid',
      'recruitment_policy.session_selection_mode_invalid': 'finalization.issues.recruitment_policy.session_selection_mode_invalid',
      'recruitment_policy.session_requirement_invalid': 'finalization.issues.recruitment_policy.session_requirement_invalid',
    }),
  };
}
